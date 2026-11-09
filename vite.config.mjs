import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev only: serves /.netlify/functions/<name> from functions/<name>.mjs so
// `npm run dev` works without the Netlify CLI. Uses sample data unless
// AIRTABLE_MOCK=false is set.
function netlifyFunctions() {
  return {
    name: 'netlify-functions-dev',
    apply: 'serve',
    configureServer(server) {
      process.env.AIRTABLE_MOCK ??= 'true';
      server.middlewares.use('/.netlify/functions', async (req, res) => {
        const name = req.url.split('?')[0].replace(/^\/+|\/+$/g, '');
        if (!/^[\w-]+$/.test(name) || !existsSync(join(server.config.root, 'functions', `${name}.mjs`))) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ err: `Function ${name} not found` }));
        }
        try {
          const { default: handler } = await server.ssrLoadModule(`/functions/${name}.mjs`);
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const hasBody = !['GET', 'HEAD'].includes(req.method);
          const response = await handler(
            new Request(`http://${req.headers.host}/.netlify/functions${req.url}`, {
              method: req.method,
              headers: req.headers,
              body: hasBody ? Buffer.concat(chunks) : undefined,
            }),
          );
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          server.config.logger.error(`Function ${name} failed: ${err.message}`);
          res.statusCode = 500;
          res.end(JSON.stringify({ err: `Function ${name} failed` }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), netlifyFunctions()],
  build: {
    outDir: 'dist',
  },
});
