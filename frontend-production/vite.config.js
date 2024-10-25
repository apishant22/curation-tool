import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const target_port = `http://127.0.0.1:3002`;
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/search': {
        target: target_port,
        changeOrigin: true,
        secure: false,
      },
      '/query': {
        target: target_port,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
