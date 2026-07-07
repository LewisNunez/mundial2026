// Cloudflare Worker — backend del Sorteo Familiar Mundial 2026
// Guarda y entrega el estado del sorteo usando Workers KV.
//
// Rutas:
//   GET  /state   -> devuelve el estado guardado (o null si no existe)
//   POST /state   -> guarda el estado (requiere header X-Admin-Token correcto)
//
// Configuración necesaria en Cloudflare (ver README-DESPLIEGUE.md):
//   - Binding de KV llamado: SORTEO_KV
//   - Variable de entorno:   ADMIN_TOKEN

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname === '/state' && request.method === 'GET') {
      const value = await env.SORTEO_KV.get('state');
      return new Response(value || 'null', {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    if (url.pathname === '/state' && request.method === 'POST') {
      const token = request.headers.get('X-Admin-Token');
      if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
      let body;
      try {
        body = await request.text();
        JSON.parse(body); // valida que sea JSON válido antes de guardar
      } catch (e) {
        return new Response(JSON.stringify({ error: 'invalid json' }), {
          status: 400,
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
