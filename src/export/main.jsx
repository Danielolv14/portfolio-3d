// Entrada da página de export (export.html), usada só pelo pipeline do Blender em desenvolvimento
import { createRoot } from 'react-dom/client';

import ExportPage from './ExportPage';

createRoot(document.getElementById('root')).render(<ExportPage />);
