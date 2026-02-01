import { serve } from 'bun';
import { readFile } from 'fs/promises';
import { join } from 'path';

const WEB_PORT = 13338;
const API_BASE = 'http://localhost:13337';

serve({
  port: WEB_PORT,
  fetch: async (req) => {
    const url = new URL(req.url);

    // Serve the HTML file
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = await readFile(join(import.meta.dir, 'index.html'), 'utf-8');
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Health check
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', port: WEB_PORT });
    }

    // Proxy API requests to task server
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
            options.headers['Content-Type'] = 'application/json';
          }
        }

        const apiRes = await fetch(apiUrl, options);
        const resBody = await apiRes.text();

        return new Response(resBody, {
          status: apiRes.status,
          headers: {
            'Content-Type': apiRes.headers.get('content-type') || 'application/json',
          },
        });
      } catch (error) {
        return Response.json(
          { error: 'Task server unavailable', details: error instanceof Error ? error.message : String(error) },
          { status: 503 }
        );
      }
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`🌐 PardusCrawler Web UI running at http://localhost:${WEB_PORT}`);
console.log(`📡 Connecting to Task Server at ${API_BASE}`);
