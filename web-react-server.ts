import { serve } from 'bun';
import { file } from 'bun';

const WEB_PORT = 13338;
const API_BASE = 'http://localhost:13337';

serve({
  port: WEB_PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Proxy API requests to enhanced API server
    if (url.pathname.startsWith('/api/')) {
      const apiUrl = `${API_BASE}${url.pathname}${url.search}`;

      try {
        const options: RequestInit = {
          method: req.method,
          headers: {},
        };

        if (req.method !== 'GET' && req.method !== 'HEAD') {
          const body = await req.text();
          if (body) {
            options.body = body;
            (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
          }
        }

        const apiRes = await fetch(apiUrl, options);
        const resBody = await apiRes.text();

        return new Response(resBody, {
          status: apiRes.status,
          headers: {
            'Content-Type': apiRes.headers.get('content-type') || 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return Response.json(
          { error: 'API server unavailable', details: error instanceof Error ? error.message : String(error) },
          { status: 503, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
    }

    // Serve React app - handle client-side routing
    // Serve static assets
    if (url.pathname.startsWith('/assets')) {
      try {
        const staticFile = file(`web-react/dist${url.pathname}`);
        return new Response(staticFile);
      } catch {
        return new Response('Not Found', { status: 404 });
      }
    }

    // Serve index.html for all other routes (SPA routing)
    try {
      const indexFile = file('web-react/dist/index.html');
      return new Response(indexFile, {
        headers: { 'Content-Type': 'text/html' },
      });
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  },
});

console.log(`🌐 PardusCrawler React UI running at http://localhost:${WEB_PORT}`);
console.log(`📡 Connecting to Enhanced API at ${API_BASE}`);
