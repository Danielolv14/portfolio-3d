import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        assetsDir: '.',
        rollupOptions: {
            output: {
                entryFileNames: 'app.js',
                inlineDynamicImports: true,
                assetFileNames: '[name][extname]'
            }
        }
    }
});
