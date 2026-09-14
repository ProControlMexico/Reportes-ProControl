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

    const upstream = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: body.contents }),
    });

    const data = await upstream.text();
    return withCors(new Response(data, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    }));
  },
};

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
