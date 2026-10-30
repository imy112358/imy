const SUPABASE_URL = 'https://whtfhjahmkxkmpqsmdni.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vVqwLV6JIQJcL8-pvmHu3g_GVFLqS4E';
const ALLOWED_ORIGINS = new Set([
  'https://www.aifather.top',
  'https://aifather.top',
  'http://127.0.0.1:8765',
  'http://localhost:8765'
]);

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://www.aifather.top',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Prefer',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

export default {
  async fetch(request) {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        return new Response('Origin not allowed', { status: 403, headers: cors });
      }
      return new Response(null, { status: 204, headers: cors });
    }

    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return new Response(JSON.stringify({ message: 'Origin not allowed' }), {
        status: 403,
        headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (requestUrl.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (requestUrl.pathname !== '/' && requestUrl.pathname !== '/code_snippets') {
      return new Response(JSON.stringify({ message: 'Not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(request.method)) {
      return new Response(JSON.stringify({ message: 'Method not allowed' }), {
        status: 405,
        headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const target = new URL('/rest/v1/code_snippets', SUPABASE_URL);
    target.search = requestUrl.search;
    const headers = new Headers({
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    });
    const prefer = request.headers.get('Prefer');
    if (prefer) headers.set('Prefer', prefer);

    let upstream;
    try {
      upstream = await fetch(target, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body
      });
    } catch (_) {
      return new Response(JSON.stringify({ message: 'Database connection failed' }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const responseHeaders = new Headers(cors);
    responseHeaders.set('Content-Type', upstream.headers.get('Content-Type') || 'application/json; charset=utf-8');
    responseHeaders.set('Cache-Control', 'no-store');
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  }
};
