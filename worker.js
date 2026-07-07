// Cloudflare Worker — backend del Sorteo Familiar Mundial 2026
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

    // Validar que el entorno exista para evitar el error "undefined"
    if (!env) {
      return new Response(JSON.stringify({ error: 'El entorno (env) no está inicializado.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    if (url.pathname === '/state' && request.method === 'GET') {
      // Validación segura de SORTEO_KV
      if (!env.SORTEO_KV) {
        return new Response(JSON.stringify({ error: 'Falta el binding de SORTEO_KV en Cloudflare' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
      
      const value = await env.SORTEO_KV.get('state');
      return new Response(value || 'null', {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    if (url.pathname === '/state' && request.method === 'POST') {
      const token = request.headers.get('X-Admin-Token');
      
      if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
        return new Response(JSON.stringify({ error: 'unauthorized', detalle: !env.ADMIN_TOKEN ? 'Falta ADMIN_TOKEN en producción' : 'Token incorrecto' }), {
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
      
      await env.SORTEO_KV.put('state', body);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    return new Response('Not found', { status: 404, headers: CORS_HEADERS });
  }
};
