// Monitor = Projetos. Uma "janela" maximizada: barra de título, a seção com rolagem própria
// e a barra de tarefas com as saídas. A textura do monitor em repouso (monitorScreenTexture,
// em textures.js) desenha a mesma barra de título e as mesmas cores, para a troca não aparecer.
import { IconClose, IconList } from '../Icons';
import { Projects, SectionHeader } from '../Sections';

export default function MonitorScreen({ t, headingRef, onClose, onRead2d }) {
    const s = t.ui.screen;
    return (
        <>
            <div className="win-bar">
                {/* as três bolinhas são só enfeite */}
                <span className="win-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                </span>
                <span className="win-path" aria-hidden="true">
                    {s.path.projects}
                </span>
                <button type="button" className="win-close" onClick={onClose} aria-label={s.closeWindow} title={s.closeWindow}>
                    <IconClose />
                </button>
            </div>

            <div className="win-scroll">
                <SectionHeader id="projects" t={t} headingRef={headingRef} headingId="screen-title" />
                <Projects t={t} />
            </div>

            <div className="win-task">
                <span className="win-hint">{s.escHint}</span>
                <button type="button" className="win-btn" onClick={onRead2d}>
                    <IconList />
                    {s.read2d}
                </button>
                <button type="button" className="win-btn win-btn-primary" onClick={onClose}>
                    {t.ui.close}
                </button>
            </div>
        </>
    );
}
