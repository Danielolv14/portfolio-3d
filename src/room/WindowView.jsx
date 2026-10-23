// Vista da janela, desenhada ao vivo (fica fora do bake). De dia: céu de fim de tarde com o sol dourado
// (a mesma luz que o bake joga para dentro do quarto) e a cidade ao longe, na névoa quente. À noite: cidade
// chuvosa, com as janelas dos prédios acesas e desfocadas, a chuva caindo e gotas escorrendo no vidro.
// As camadas ficam em profundidades diferentes atrás da parede: quando a câmera gira, elas se deslocam
// umas em relação às outras (paralaxe), sem nenhuma conta extra. dayNight.mix: 0 = dia, 1 = noite.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { dayNight } from './shared';

// Números aleatórios sempre iguais: a vista não muda a cada visita
function sorteio(semente) {
    let s = semente;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function textura(w, h, desenhar, repetir = false) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    desenhar(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
}

function ceuDia() {
    return textura(512, 512, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#6f9fcf');
        g.addColorStop(0.45, '#e7c08e');
        g.addColorStop(0.8, '#ffb466');
        g.addColorStop(1, '#ff9f55');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // Sol baixo, à direita (o bake joga a luz de cima e da direita para dentro do quarto)
        const sol = ctx.createRadialGradient(w * 0.68, h * 0.36, 0, w * 0.68, h * 0.36, w * 0.4);
        sol.addColorStop(0, 'rgba(255,248,225,1)');
        sol.addColorStop(0.06, 'rgba(255,236,190,1)');
        sol.addColorStop(0.2, 'rgba(255,200,130,0.55)');
        sol.addColorStop(1, 'rgba(255,170,90,0)');
        ctx.fillStyle = sol;
        ctx.fillRect(0, 0, w, h);
    });
}

function ceuNoite() {
    return textura(512, 512, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#070b18');
        g.addColorStop(0.55, '#141c33');
        // a cidade acesa clareia as nuvens de chuva perto do horizonte
        g.addColorStop(1, '#3a2f45');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
    });
}

// Fileira de prédios num fundo transparente. `perto`: prédios maiores e mais altos (camada da frente)
function cidade(noite, semente, perto) {
    return textura(1024, 512, (ctx, w, h) => {
        const r = sorteio(semente);
        if (noite) ctx.filter = 'blur(1.5px)';
        let x = -10;
        while (x < w) {
            const largura = (perto ? 70 : 40) + r() * (perto ? 90 : 60);
            const altura = h * ((perto ? 0.35 : 0.25) + r() * (perto ? 0.45 : 0.4));
            const topo = h - altura;
            if (noite) {
                ctx.fillStyle = perto ? '#0b0e18' : '#121726';
            } else {
                // de dia, prédios na névoa quente do fim de tarde (os de longe mais claros)
                ctx.fillStyle = perto ? 'rgba(150,140,140,0.85)' : 'rgba(196,176,160,0.6)';
            }
            ctx.fillRect(x, topo, largura, altura);
            // Janelas: à noite, várias acesas (quentes e frias); de dia, só reflexos do sol
            for (let jy = topo + 10; jy < h - 8; jy += 14) {
                for (let jx = x + 6; jx < x + largura - 8; jx += 11) {
                    if (noite && r() < 0.42) {
                        ctx.fillStyle = r() < 0.75 ? 'rgba(255,205,130,0.9)' : 'rgba(160,210,255,0.85)';
                        ctx.fillRect(jx, jy, 5, 7);
                    } else if (!noite && r() < 0.08) {
                        ctx.fillStyle = 'rgba(255,214,150,0.6)';
                        ctx.fillRect(jx, jy, 5, 7);
                    }
                }
            }
            x += largura + r() * 6;
        }
        if (noite) {
            // Luzes grandes desfocadas (vidro molhado): bolinhas de luz suaves
            for (let i = 0; i < 26; i++) {
                const bx = r() * w;
                const by = h * (0.45 + r() * 0.5);
                const raio = 8 + r() * 22;
                const cor = r() < 0.7 ? '255,190,110' : '140,190,255';
                const g = ctx.createRadialGradient(bx, by, 0, bx, by, raio);
                g.addColorStop(0, `rgba(${cor},0.5)`);
                g.addColorStop(1, `rgba(${cor},0)`);
                ctx.fillStyle = g;
                ctx.fillRect(bx - raio, by - raio, raio * 2, raio * 2);
            }
        }
    });
}

function chuva() {
    return textura(
        256,
        512,
        (ctx, w, h) => {
            const r = sorteio(7);
            ctx.strokeStyle = 'rgba(200,220,255,0.22)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 160; i++) {
                const x = r() * w;
                const y = r() * h;
                const comp = 10 + r() * 22;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x - comp * 0.12, y + comp);
                ctx.stroke();
            }
        },
        true
    );
}

function gotas() {
    return textura(
        512,
        512,
        (ctx, w, h) => {
            const r = sorteio(21);
            for (let i = 0; i < 140; i++) {
                const x = r() * w;
                const y = r() * h;
                const raio = 1 + r() * 3;
                const g = ctx.createRadialGradient(x - raio * 0.3, y - raio * 0.3, 0, x, y, raio);
                g.addColorStop(0, 'rgba(255,255,255,0.45)');
                g.addColorStop(0.5, 'rgba(200,215,240,0.12)');
                g.addColorStop(1, 'rgba(200,215,240,0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(x, y, raio, 0, Math.PI * 2);
                ctx.fill();
                // algumas gotas deixam um rastro escorrendo
                if (r() < 0.12) {
                    ctx.strokeStyle = 'rgba(210,225,250,0.18)';
                    ctx.lineWidth = raio * 0.6;
                    ctx.beginPath();
                    ctx.moveTo(x, y - raio);
                    ctx.lineTo(x + (r() - 0.5) * 4, y - raio - 20 - r() * 50);
                    ctx.stroke();
                }
            }
        },
        true
    );
}

// Uma camada: plano com textura, na profundidade z, com opacidade animada
function Camada({ textura: mapa, posicao, tamanho, refMat, aditiva = false }) {
    return (
        <mesh position={posicao}>
            <planeGeometry args={tamanho} />
            <meshBasicMaterial
                ref={refMat}
                map={mapa}
                transparent
                depthWrite={false}
                toneMapped={false}
                blending={aditiva ? THREE.AdditiveBlending : THREE.NormalBlending}
            />
        </mesh>
    );
}

// `cx`, `cy`, `w`, `h`: centro e tamanho do vão da janela; a parede fica em z = -5 (o vão vai até -5,3)
export default function WindowView({ cx, cy, w, h }) {
    const tex = useMemo(
        () => ({
            ceuDia: ceuDia(),
            ceuNoite: ceuNoite(),
            longeDia: cidade(false, 3, false),
            longeNoite: cidade(true, 3, false),
            pertoDia: cidade(false, 11, true),
            pertoNoite: cidade(true, 11, true),
            chuva: chuva(),
            gotas: gotas()
        }),
        []
    );
    // A chuva e as gotas se repetem na janela: riscos e gotas menores, como de verdade
    useMemo(() => {
        tex.chuva.repeat.set(4, 3);
        tex.gotas.repeat.set(2, 2);
    }, [tex]);
    const mats = {
        ceuDia: useRef(),
        ceuNoite: useRef(),
        longeDia: useRef(),
        longeNoite: useRef(),
        pertoDia: useRef(),
        pertoNoite: useRef(),
        chuva: useRef(),
        gotas: useRef()
    };

    useFrame((_, dt) => {
        const m = dayNight.mix;
        const dia = 1 - m;
        mats.ceuDia.current.opacity = dia;
        mats.ceuNoite.current.opacity = m;
        mats.longeDia.current.opacity = dia;
        mats.longeNoite.current.opacity = m;
        mats.pertoDia.current.opacity = dia;
        mats.pertoNoite.current.opacity = m;
        mats.chuva.current.opacity = m * 0.5;
        mats.gotas.current.opacity = m * 0.55;
        // A chuva cai rápido; as gotas no vidro escorrem devagar
        tex.chuva.offset.y += dt * 1.6;
        tex.gotas.offset.y += dt * 0.015;
    });

    return (
        <group>
            {/* céu, bem atrás. A câmera olha de cima: o topo dele fica abaixo da linha que passa pela borda
                de cima da parede (senão ele aparece por cima do quarto); pela janela se vê só a parte de baixo */}
            <Camada textura={tex.ceuDia} posicao={[cx, cy - 0.55, -6.6]} tamanho={[w + 4, 3.7]} refMat={mats.ceuDia} />
            <Camada textura={tex.ceuNoite} posicao={[cx, cy - 0.55, -6.59]} tamanho={[w + 4, 3.7]} refMat={mats.ceuNoite} />
            {/* cidade ao longe e mais perto (as duas se deslocam diferente quando a câmera gira) */}
            <Camada textura={tex.longeDia} posicao={[cx + 0.3, cy - 0.45, -6.3]} tamanho={[w + 3.2, 1.8]} refMat={mats.longeDia} />
            <Camada textura={tex.longeNoite} posicao={[cx + 0.3, cy - 0.45, -6.29]} tamanho={[w + 3.2, 1.8]} refMat={mats.longeNoite} />
            <Camada textura={tex.pertoDia} posicao={[cx - 0.2, cy - 0.85, -5.95]} tamanho={[w + 2.2, 1.6]} refMat={mats.pertoDia} />
            <Camada textura={tex.pertoNoite} posicao={[cx - 0.2, cy - 0.85, -5.94]} tamanho={[w + 2.2, 1.6]} refMat={mats.pertoNoite} />
            {/* chuva caindo lá fora e gotas no vidro (só à noite) */}
            <Camada textura={tex.chuva} posicao={[cx, cy, -5.45]} tamanho={[w + 0.8, h + 0.8]} refMat={mats.chuva} aditiva />
            <Camada textura={tex.gotas} posicao={[cx, cy, -5.21]} tamanho={[w, h]} refMat={mats.gotas} aditiva />
        </group>
    );
}
