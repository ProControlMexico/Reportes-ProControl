// Proxy para el diagnóstico IA de Procontrol: reenvía el prompt a Gemini
// poniendo la API key desde el lado del servidor (GEMINI_API_KEY /
// GEMINI_API_KEY_2, secrets de este Worker). El navegador nunca ve las keys.
//
// ALERTAS POR EMAIL: si Gemini falla (429/503/timeout) con TODAS las keys,
// envía un email al ALERT_EMAIL vía Resend para que el admin se entere sin
// que el usuario tenga que reportarlo. El envío es async (no bloquea la
// respuesta al usuario).

const MODELOS_PERMITIDOS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
];
const MODELO_DEFAULT = "gemini-3.5-flash-lite";

const TIMEOUT_MS = 25000;

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }));
    if (request.method !== "POST") return withCors(new Response("Method not allowed", { status: 405 }));

    let body;
    try {
      body = await request.json();
    } catch {
      return withCors(jsonResponse({ error: { message: "JSON inválido" } }, 400));
    }
    if (!body || !Array.isArray(body.contents)) {
      return withCors(jsonResponse({ error: { message: "Falta 'contents' en la petición" } }, 400));
    }

    const modelo = MODELOS_PERMITIDOS.includes(body.model) ? body.model : MODELO_DEFAULT;
    const apiKeys = [env.GEMINI_API_KEY, env.GEMINI_API_KEY_2].filter(Boolean);

    const { status, text } = await intentarKeys(body.contents, modelo, apiKeys);

    // Si falló con todas las keys, enviar alerta por email (sin bloquear la respuesta)
    if (status >= 400) {
      ctx.waitUntil(enviarAlertaEmail(env, modelo, status, text, apiKeys.length));
    }

    return withCors(new Response(text, { status, headers: { "Content-Type": "application/json" } }));
  },
};

// ── Alerta por email (Resend) ────────────────────────────────────────
async function enviarAlertaEmail(env, modelo, status, responseText, keysUsadas) {
  if (!env.RESEND_API_KEY || !env.ALERT_EMAIL) return;

  let errorMsg = "";
  try {
    const parsed = JSON.parse(responseText);
    errorMsg = parsed?.error?.message || `HTTP ${status}`;
  } catch {
    errorMsg = `HTTP ${status}`;
  }

  const ahora = new Date().toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    dateStyle: "medium",
    timeStyle: "medium",
  });

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ProControl IA <onboarding@resend.dev>",
        to: [env.ALERT_EMAIL],
        subject: `⚠️ Error IA ProControl — ${modelo} (${status})`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px">
            <h3 style="color:#dc2626">⚠️ Error en ProControl IA</h3>
            <table style="border-collapse:collapse;font-size:14px">
              <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Modelo:</td><td>${modelo}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Status:</td><td>${status}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Error:</td><td>${errorMsg}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Keys probadas:</td><td>${keysUsadas}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Hora (CDMX):</td><td>${ahora}</td></tr>
            </table>
            <p style="color:#666;font-size:11px;margin-top:16px">
              Email automático del Worker procontrol-ia-proxy.
              Si ves muchos de estos, revisa la cuota en
              <a href="https://aistudio.google.com/rate-limit">AI Studio</a>.
            </p>
          </div>
        `,
      }),
    });
    console.log(`alerta-email: enviada (${modelo} ${status})`);
  } catch (e) {
    console.log(`alerta-email: error enviando — ${e.message}`);
  }
}

// ── Intento por key ──────────────────────────────────────────────────
async function intentarKeys(contents, modelo, apiKeys) {
  let ultimo = { status: 504, text: JSON.stringify({ error: { message: "Gemini no respondió a tiempo. Intenta de nuevo." } }) };
  for (let i = 0; i < apiKeys.length; i++) {
    const inicio = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKeys[i]}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents }),
          signal: controller.signal,
        }
      );
      const text = await upstream.text();
      ultimo = { status: upstream.status, text };
      console.log(`modelo=${modelo} key=${i + 1}/${apiKeys.length} status=${upstream.status} ms=${Date.now() - inicio}`);
      if (upstream.status !== 429 && upstream.status !== 503) return ultimo;
    } catch (err) {
      console.log(`modelo=${modelo} key=${i + 1}/${apiKeys.length} status=timeout ms=${Date.now() - inicio}`);
    } finally {
      clearTimeout(timer);
    }
  }
  return ultimo;
}

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}

function withCors(res) {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(res.body, { status: res.status, headers });
}
