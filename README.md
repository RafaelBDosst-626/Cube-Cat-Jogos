# Cube Cat Jogos

Site estático de jogos para navegador. A página inicial está em `Tela-Inicial/index.html`; o `index.html` da raiz encaminha para ela para facilitar a publicação pelo GitHub Pages. O MP4 da animação e o logotipo ficam em `assets/`, na raiz junto das pastas `css/` e `js/`.

## Publicar no GitHub Pages

Envie o conteúdo deste repositório para o GitHub e, em **Settings → Pages**, selecione a branch principal e a pasta `/(root)`. O site não precisa de Node.js, terminal, servidor próprio ou etapa de compilação. Os jogos e imagens são servidos como arquivos estáticos.

O navegador precisa de JavaScript habilitado. A navegação e as imagens usam caminhos relativos para funcionar no domínio do GitHub Pages e em páginas de projeto sob um subcaminho.

## Organização dos arquivos

- As pastas `assets/`, `css/` e `js/` ficam na raiz, no mesmo nível de `Tela-Inicial/`. Elas contêm as imagens, o vídeo e os sons do jogo; os estilos globais; e os scripts compartilhados pelo site, respectivamente. `js/site-audio.js` controla a música em loop, o botão de mute e os efeitos de interface e partida. A preferência de mute fica no armazenamento local do navegador; a faixa retoma aproximadamente de onde parou entre páginas da mesma sessão.
- A pasta local `dev-mode/` fica na raiz para uso neste checkout; ela é ignorada pelo Git e o painel só carrega em `localhost` ou ao abrir as páginas localmente. O painel abre ao lado da página, permite navegar por todas as páginas do site e oferece pausa do cronômetro nos modos Clássico, Rápido e Inverso; não inclui ferramentas de edição visual ou de conteúdo.
- As páginas Biblioteca e SaibaMais têm pastas próprias, com HTML e CSS juntos. Os estilos específicos ficam ao lado de suas páginas ou em `Tela-Inicial/Inicio/` para a página inicial.
- Em `Tela-Inicial/Jogo say my name`, cada modo tem uma pasta própria com HTML, CSS e JavaScript. O menu fica em `menu/`; os estilos comuns dos modos ficam em `compartilhado/game-base.css`; catálogo e imagens continuam compartilhados na pasta do jogo.
- O mecanismo e a página geral dos quizzes ficam em `Tela-Inicial/Jogo de quiz js`; os temas de animação e universo têm páginas e bancos de perguntas próprios em `Tela-Inicial/Animacoes/` e `Tela-Inicial/Universo/`.
- `quiz-progress.js` mantém recordes qualificados no armazenamento local do navegador e o histórico de tentativas da sessão, sem servidor ou banco de dados.
