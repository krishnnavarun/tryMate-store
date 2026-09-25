import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Tailwind CSS v4 is set up through its Vite plugin: no tailwind.config.js or
// postcss.config.js needed. Theme tweaks live in src/index.css (@theme).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true, // CLIENT_URL / CORS on the server expects exactly this port
  },
});
