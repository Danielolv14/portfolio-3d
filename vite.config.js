import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    base: './',
    // Pastas do OneDrive às vezes não avisam que o arquivo mudou; a varredura garante o recarregamento
    server: { watch: { usePolling: true, interval: 300 } },
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
