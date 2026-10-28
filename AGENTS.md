# Organização do projeto

- Preserve uma hierarquia clara: mantenha cada página com seus arquivos específicos próximos dela e agrupe os modos de cada jogo em suas próprias pastas.
- Deixe recursos compartilhados pelo site nas pastas `assets/`, `css/` e `js/` na raiz do projeto.
- Mantenha ferramentas locais de desenvolvimento em pastas próprias na raiz; o `dev-mode/` é exclusivo deste checkout, deve permanecer ignorado pelo Git e só pode ser carregado em `file:` ou em `localhost`.
- Ao mover páginas, estilos, scripts ou recursos, atualize todos os caminhos relativos que apontam para eles e confira as referências em todas as páginas afetadas.
- Mantenha a documentação alinhada com a estrutura real de pastas.
