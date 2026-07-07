// Cloudflare Worker — backend del Sorteo Familiar Mundial 2026
// Guarda y entrega el estado del sorteo usando Workers KV.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token'
};

// Definimos el PIN idéntico al que tú usas en la página web
const PIN_SECRETO = "Mundial2026";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Manejo de peticiones de seguridad del navegador (CORS)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // 2. RUTA: GET /state (Para cargar el avance del sorteo en la pantalla)
    if (url.pathname === '/state' && request.method === 'GET') {
      // Verificación de seguridad por si las dudas
      if (!env || !env.SORTEO_KV) {
        return new Response(JSON.stringify({ error: 'Falta conectar la base de datos SORTEO_KV en Cloudflare.' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
      
      const value = await env.SORTEO_KV.get('state');
      return new Response(value || 'null', {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    // 3. RUTA: POST /state (Para cuando guardas datos con tu PIN)
    if (url.pathname === '/state' && request.method === 'POST') {
      const token = request.headers.get('X-Admin-Token');
      
      // Comparamos el PIN de la web eliminando espacios en blanco por si se coló alguno (.trim())
      if (!token || token.trim() !== PIN_SECRETO) {
        return new Response(JSON.stringify({ error: 'unauthorized', detalle: 'El PIN ingresado no coincide' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
      
      let body;
      try {
        body = await request.text();
        JSON.parse(body); // Valida que los datos del sorteo estén bien estructurados
      } catch (e) {
        return new Response(JSON.stringify({ error: 'invalid json' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
      
      if (!env || !env.SORTEO_KV) {
        return new Response(JSON.stringify({ error: 'Falta conectar la base de datos SORTEO_KV en Cloudflare.' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }

      await env.SORTEO_KV.put('state', body);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    // 4. Si entran a cualquier otra ruta que no sea /state
    return new Response('Not found', { status: 404, headers: CORS_HEADERS });
  }
};
