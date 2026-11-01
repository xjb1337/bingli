import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');

  return {
    base: env.VITE_BASE || '/bingli/',
    plugins: [react()],
    optimizeDeps: {
      include: ['@dabingli/domain'],
    },
    build: {
      commonjsOptions: {
        include: [/node_modules/, /packages[\\/]domain[\\/]dist/],
        transformMixedEsModules: true,
      },
    },
  };
});
