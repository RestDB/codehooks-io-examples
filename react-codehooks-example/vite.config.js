import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build output goes to /dist, which `coho deploy` ships with the backend
// code and serves via app.static().
export default defineConfig({
  plugins: [react()],
});
