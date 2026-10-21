import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Pacotes do 3D: ficam num arquivo próprio, que quase nunca muda (o navegador guarda em cache)
const THREE_PACKAGES = ['three', '@react-three', 'camera-controls', 'postprocessing', 'n8ao', 'maath', 'three-stdlib', 'troika'];

export default defineConfig({
    plugins: [react()],
    // Caminho absoluto: as seções vão ganhar endereço próprio (/projetos), e o relativo quebraria lá
    base: '/',
    // Pastas do OneDrive às vezes não avisam que o arquivo mudou; a varredura garante o recarregamento
    server: { watch: { usePolling: true, interval: 300 } },
    build: {
        // O pedaço do three.js passa de 1 MB, e isso é esperado: ele só baixa quando o 3D abre
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
            output: {
                // Nomes com hash (padrão do Vite): a Vercel guarda em cache para sempre, e cada versão
                // nova tem nome novo. O 3D (Scene.jsx) já é carregado sob demanda com React.lazy
                manualChunks(id) {
                    // O ajudante de pré-carregamento do Vite vai junto com o React. Solto, ele cairia
                    // no pedaço do 3D e obrigaria a página a baixar o three.js logo na abertura
                    if (id.includes('vite/preload-helper')) return 'vendor';
                    if (!id.includes('node_modules')) return;
                    if (THREE_PACKAGES.some((name) => id.includes(`node_modules/${name}`))) return 'three';
                    if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'vendor';
                }
            }
        }
    }
});
