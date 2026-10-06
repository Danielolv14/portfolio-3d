// Gera publish/index.html: a página do protótipo no formato de Artifact
// (sem <html>/<head>/<body>, CSS embutido e o app.js como arquivo ao lado).
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const css = readFileSync('dist/index.css', 'utf8');
const fonts =
    'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Unbounded:wght@500;600&display=swap';

const page = `<title>Quarto Portfólio 3D</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>
${css}
</style>
<div id="root"></div>
<script type="module" src="app.js"></script>
`;

mkdirSync('publish', { recursive: true });
writeFileSync('publish/index.html', page);
copyFileSync('dist/app.js', 'publish/app.js');
console.log('publish/index.html', page.length, 'bytes');
