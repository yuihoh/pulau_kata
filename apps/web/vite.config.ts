/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { existsSync, readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleRequest, type Env } from '../../workers/api/src/index';

/** Reads workers/api/.dev.vars (KEY=VALUE lines, git-ignored) if it exists. */
function devVars(): Env {
  const file = new URL('../../workers/api/.dev.vars', import.meta.url);
  const env: Record<string, string> = {};
  if (existsSync(file))
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
      if (m) env[m[1]!] = m[2]!.replace(/^["']|["']$/g, '');
    }
  return env;
}

/**
 * Serves /api/* from the Worker's own handler inside `vite dev` and `vite preview`, so the
 * whole app (including the sentence check) runs with one command and no wrangler. Mock AI
 * unless workers/api/.dev.vars says otherwise. Production uses the deployed Worker.
 */
function workerApi(): Plugin {
  const env = devVars();
  const middleware = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/')) return next();
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
    const method = req.method ?? 'GET';
    const request = new Request(`http://${req.headers.host ?? 'localhost'}${req.url}`, {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : Buffer.concat(chunks),
    });
    const response = await handleRequest(request, env);
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.end(Buffer.from(await response.arrayBuffer()));
  };
  return {
    name: 'jelajah-worker-api',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  };
}

export default defineConfig({
  plugins: [
    workerApi(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Jelajah Kata',
        short_name: 'Jelajah Kata',
        description: 'Belajar kosa kata Bahasa Melayu',
        theme_color: '#f59e0b',
        background_color: '#fffbeb',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webp,mp3,woff2}'],
        // Source PNGs (until task 9 converts them to small WebP for precaching) are cached
        // the first time they are shown, so pictures already seen still work offline.
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
  },
});
