# Fase 3 — Experiência

O visual chama a atenção; a experiência faz a pessoa ficar. Esta fase cuida de tudo o que acontece entre abrir o site e mandar uma mensagem. Pode andar em paralelo com a Fase 2.

**Esforço:** G. **Marco:** M4, "experiência completa".

---

## 1. Abertura e carregamento

- **Conteúdo primeiro:** o nome, o menu e o botão "Ver sem 3D" aparecem na hora. O 3D carrega por trás, sem tela branca.
- **Progresso de verdade:** barra baseada nos bytes do GLB e das texturas, não um giro sem fim.
- **Carregamento em duas etapas:** primeiro as texturas leves (1024, cerca de 1 MB) e o quarto aparece; depois as completas trocam sem a pessoa perceber.
- **Entrada com cena de abertura** (~2,5 s, pulável com clique ou tecla):
  1. o quarto começa apagado e longe;
  2. a câmera se aproxima até a visão geral;
  3. a luz "liga" (`uExposure` sobe), seguindo o clima atual;
  4. as etiquetas aparecem uma de cada vez.
- **Movimento reduzido:** com `prefers-reduced-motion`, sem voo, só um fade.

## 2. Interação com os objetos

| Item | Como |
|---|---|
| **Contorno no hover** | Efeito *Outline* nos nós `hs-*`, com a cor de destaque do clima |
| **"Aperto" no clique** | Mola curta de escala (já existe o crescimento no hover; ganha a resposta ao clique) |
| **Cursor** | Mão nos clicáveis (já existe) |
| **Interruptor da luminária "&"** | Botão físico com mola e o som de clique; dispara a sequência de dia/noite ([03](03-iluminacao.md#8-transição-entre-dia-e-noite)) |
| **Etiquetas** | Continuam como `<button>` acessíveis; somem quando uma seção está aberta |

## 3. Seções nos objetos

| Seção | Objeto | Hoje | Plano |
|---|---|---|---|
| Projetos | Monitor | Dentro da tela ✓ | Polir a transição e o "liga a tela" |
| Experiências | TV | Painel | **Dentro da TV**, como o monitor (era a etapa E7) |
| Contato | Celular | Dentro da tela ✓ | Polir; EmailJS no lançamento |
| Sobre mim | Porta-retrato | Painel lateral | Manter (decisão antiga); avaliar uma animação do porta-retrato "virando" para o painel |

## 4. Detalhes vivos (pequenos, mas fazem o quarto parecer habitado)

Cada um é opcional e barato. Escolher os que combinam:

- a cadeira gira devagar de um lado para o outro;
- relógio com a hora real (já existe no LCD);
- a bola de futevôlei quica ao ser clicada;
- o robô acena quando o mouse passa;
- a luz do RGB "respira" à noite;
- os pôsteres mostram, ao passar o mouse, uma curiosidade sobre o filme ou o jogo.

## 5. Som (desligado por padrão)

- Botão de som no topo, lembrado entre visitas.
- **Ambiente** bem baixo: o zumbido do quarto de dia, grilos e cidade distante à noite.
- **Efeitos:** clique do interruptor, a tela ligando, o "swoosh" da câmera, o toque do celular ao abrir o Contato.
- **Licença:** só sons próprios ou CC0, listados em `docs/creditos.md`.
- Carregados só depois que o som é ligado, para não pesar a abertura.

## 6. Navegação e endereços

- **Seção na URL:** `/projetos`, `/experiencias`, `/contato`, `/sobre` (e `/en/...` em inglês). Abrir o link já leva a câmera ao objeto.
- **Botão Voltar do navegador** fecha a seção.
- **Link direto para um projeto:** `/projetos/djfinance` abre o monitor já no projeto. Bom para mandar no LinkedIn.
- **Vercel:** *rewrites* para tudo cair no `index.html`.

## 7. Acessibilidade

- **Teclado:** Tab percorre os objetos clicáveis na ordem do menu, com a câmera acompanhando; Enter abre; Esc fecha (já existe).
- **Leitor de tela:** cada objeto anuncia a seção que abre; o canvas tem descrição.
- **Modo sem 3D** continua: liga sozinho sem WebGL ou em aparelho muito fraco.
- **Contraste** das etiquetas e painéis conferido nos dois climas.

## 8. Celular e desempenho

- **Qualidade adaptativa:** `PerformanceMonitor` do drei baixa o `dpr` se o FPS cair e sobe de novo se sobrar.
- **Texturas do celular** (metade da resolução) escolhidas pelo tamanho da tela e pela memória do aparelho.
- **`frameloop="demand"`:** parado, o quarto não redesenha. Economiza bateria e esquenta menos o celular.
- **Enquadramento no retrato** revisto depois do bake (o quarto novo pode ter outra leitura).
- **Meta:** ≥ 50 FPS no celular simulado e abertura em menos de 4 s numa conexão 4G.

## 9. Checklist de pronto da Fase 3

- [ ] Abertura com progresso real, texturas em duas etapas e cena de entrada pulável
- [ ] Contorno no hover e resposta ao clique
- [ ] Experiências dentro da TV
- [ ] Interruptor com mola e sequência de dia/noite
- [ ] Som opcional com licenças registradas
- [ ] Seção na URL, botão Voltar e link direto para projeto
- [ ] Navegação por teclado completa
- [ ] Qualidade adaptativa e `frameloop="demand"`; metas de FPS cumpridas
