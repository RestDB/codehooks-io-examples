import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build output goes to /dist, which is uploaded with `coho upload ./dist`
// and served by the backend via app.static().
export default defineConfig({
  plugins: [react()],
});
