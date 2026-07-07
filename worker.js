// Cloudflare Worker — backend del Sorteo Familiar Mundial 2026
// Guarda y entrega el estado del sorteo usando Workers KV.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token'
};

// TU PIN SECRETO
const PIN_SECRETO = "Mundial2026";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Manejo de peticiones de seguridad del navegador (CORS)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // 2. RUTA: GET /state (Cargar el sorteo - Libre para toda la familia)
    if (url.pathname === '/state' && request.method === 'GET') {
      if (!env || !env.SORTEO_KV) {
        return new Response(JSON.stringify({ error: 'Falta conectar SORTEO_KV' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
      const value = await env.SORTEO_KV.get('state');
      return new Response(value || 'null', {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    // 3. RUTA: POST /state (Guardar sorteo - ¡SÓLO TÚ CON TU PIN!)
    if (url.pathname === '/state' && request.method === 'POST') {
      
      // Intentamos leer el PIN de dos formas distintas para asegurar que lo reciba
      const tokenDesdeHeader = request.headers.get('X-Admin-Token');
      const tokenDesdeUrl = url.searchParams.get('token') || url.searchParams.get('pin');
      
      const pinRecibido = tokenDesdeHeader || tokenDesdeUrl;

      // Validación estricta del PIN
      if (!pinRecibido || pinRecibido.trim() !== PIN_SECRETO) {
        return new Response(JSON.stringify({ error: 'unauthorized', detalle: 'PIN incorrecto en el servidor' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
      
      let body;
      try {
        body = await request.text();
        JSON.parse(body); 
      } catch (e) {
        return new Response(JSON.stringify({ error: 'invalid json' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
      
      if (!env || !env.SORTEO_KV) {
        return new Response(JSON.stringify({ error: 'Falta conectar SORTEO_KV' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }

      await env.SORTEO_KV.put('state', body);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    return new Response('Not found', { status: 404, headers: CORS_HEADERS });
  }
};
