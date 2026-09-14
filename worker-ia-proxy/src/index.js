// Proxy para el diagnóstico IA de Procontrol: reenvía el prompt a Gemini
// poniendo la API key desde el lado del servidor (GEMINI_API_KEY, secret de
// este Worker). El navegador nunca ve la key.
//
// ponytail: sin rate-limit por IP — el nombre del Worker no es adivinable,
// pero si el costo de Gemini se dispara, agregar Cloudflare Rate Limiting aquí.

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

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

    const { status, text } = await callGeminiWithRetry(body.contents, env.GEMINI_API_KEY);
    return withCors(new Response(text, { status, headers: { "Content-Type": "application/json" } }));
  },
};

// Gemini (modelo preview) devuelve 503/UNAVAILABLE seguido cuando está saturado.
// Reintenta acá, en el único lugar por el que pasan todas las llamadas, con
// backoff creciente (1s, 2s, 3s) antes de rendirse.
async function callGeminiWithRetry(contents, apiKey, retries = 3) {
  for (let intento = 0; ; intento++) {
    const upstream = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    const saturado = data?.error && (data.error.code === 503 || data.error.status === "UNAVAILABLE");
    if (!saturado || intento >= retries) return { status: upstream.status, text };
    await new Promise((resolve) => setTimeout(resolve, 1000 * (intento + 1)));
  }
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
