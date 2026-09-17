// Proxy para el diagnóstico IA de Procontrol: reenvía el prompt a Gemini
// poniendo la API key desde el lado del servidor (GEMINI_API_KEY, secret de
// este Worker). El navegador nunca ve la key.
//
// ponytail: sin rate-limit por IP — el nombre del Worker no es adivinable,
// pero si el costo de Gemini se dispara, agregar Cloudflare Rate Limiting aquí.

// En cuenta gratuita, cada modelo de Gemini tiene su PROPIO cupo diario
// separado (20 RPD c/u, visto en el dashboard de rate limits). Si el modelo
// preferido está saturado (503) o sin cupo (429), probamos el siguiente de
// la lista — multiplica el cupo gratis real sin pagar nada.
// ponytail: orden fijo, sin recordar cuál falló entre peticiones — si el
// primero casi siempre falla, reordenar esta lista a mano.
const MODELOS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash-lite",
];

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

    // Todas las keys gratuitas configuradas (GEMINI_API_KEY, GEMINI_API_KEY_2, ...).
    const apiKeys = [env.GEMINI_API_KEY, env.GEMINI_API_KEY_2].filter(Boolean);
    const { status, text } = await intentarModelos(body.contents, apiKeys);
    return withCors(new Response(text, { status, headers: { "Content-Type": "application/json" } }));
  },
};

// Para cada modelo, prueba cada key antes de rendirse con ese modelo y pasar
// al siguiente. Un intento por combinación (nada de reintentos repetidos
// sobre la misma pareja modelo+key — eso sí gastaría cupo de más). Solo
// avanza cuando el error es saturación (503) o cupo agotado (429);
// cualquier otro resultado (éxito o error real) se regresa tal cual.
async function intentarModelos(contents, apiKeys) {
  let ultimo = null;
  for (const modelo of MODELOS) {
    for (const apiKey of apiKeys) {
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents }),
        }
      );
      const text = await upstream.text();
      ultimo = { status: upstream.status, text };
      if (upstream.status !== 429 && upstream.status !== 503) return ultimo;
    }
  }
  return ultimo; // se agotaron todos los modelos y todas las keys — regresa el último error
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
