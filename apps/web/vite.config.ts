import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { offlineServiceWorker } from './build/sw-plugin';

function manualChunkName(id: string): string | undefined {
  const path = id.replace(/\\/g, '/');
  if (
    path.includes('/node_modules/react/')
    || path.includes('/node_modules/react-dom/')
    || path.includes('/node_modules/scheduler/')
  ) {
    return 'vendor-react';
  }
  if (path.includes('/node_modules/dexie/')) return 'vendor-dexie';
  if (path.includes('/packages/domain/dist/') && path.endsWith('/template-data.js')) {
    return 'template-data';
  }
  if (
    path.includes('/packages/domain/dist/esm/templates.js')
    || path.includes('/packages/domain/dist/templates-subpath.js')
  ) {
    return 'domain-templates';
  }
  if (path.includes('/packages/domain/')) return 'domain';
  if (path.includes('/packages/ai/')) return 'ai';
  if (path.includes('/packages/storage/')) return 'storage';
  return undefined;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');

  return {
    base: process.env.VITE_BASE || env.VITE_BASE || '/bingli/',
    plugins: [react(), offlineServiceWorker()],
    optimizeDeps: {
      include: ['@dabingli/domain'],
    },
    build: {
      commonjsOptions: {
        include: [/node_modules/, /packages[\\/]domain[\\/]dist/],
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks: manualChunkName,
        },
      },
    },
  };
});
