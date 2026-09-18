// Proxy para el diagnóstico IA de Procontrol: reenvía el prompt a Gemini
// poniendo la API key desde el lado del servidor (GEMINI_API_KEY /
// GEMINI_API_KEY_2, secrets de este Worker). El navegador nunca ve las keys.
//
// El modelo lo elige el usuario desde la app (se manda en el body como
// "model"); acá solo se valida contra la lista permitida. Con 2 keys: si la
// primera da 503/429/timeout con el modelo elegido, se prueba la segunda
// antes de rendirse — nunca se cambia el modelo por cuenta propia.
//
// ponytail: sin rate-limit por IP — el nombre del Worker no es adivinable,
// pero si el costo de Gemini se dispara, agregar Cloudflare Rate Limiting aquí.

// Modelos ESTABLES permitidos (no "-preview" — traen límites más
// restrictivos y Google no los recomienda para producción).
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

// Un diagnóstico real (prompt largo + "thinking" del modelo) puede tardar
// legítimamente 10-30s en responder — 10s cortaba respuestas que sí iban a
// llegar. Con 2 keys, peor caso ahora ~50s (antes ~20s), pero deja tiempo
// real a que Gemini termine de pensar antes de rendirse.
const TIMEOUT_MS = 25000;

export default {
  async fetch(request, env) {
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
    return withCors(new Response(text, { status, headers: { "Content-Type": "application/json" } }));
  },
};

// Un intento por key, mismo modelo. Solo pasa a la siguiente key si la
// actual está saturada (503), sin cupo (429), o se colgó (timeout) —
// cualquier otro resultado (éxito o error real) se regresa tal cual.
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

