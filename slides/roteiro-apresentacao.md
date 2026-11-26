# Roteiro da apresentação — 30 minutos

**Gerenciador de Tarefas Inteligente** · Explorando Tecnologias Móveis · Unochapecó
Integrantes: Bernardo Dal Piva Bernardi, João Victor Decarli e Rafael Rockenbach

Arquivos: `slides/apresentacao.pptx` (cada slide tem nas **notas** quem fala, o tempo e o que dizer) e
`slides/apresentacao.pdf` (os mesmos slides, sem as notas).
Para ver as notas durante a apresentação: PowerPoint → **Apresentação de Slides → Modo de Exibição do Apresentador**
(atalho **Alt+F5**). A turma vê só o slide; quem apresenta vê as notas e o cronômetro.

## Resumo

- **30:00 no total:** 25:30 de apresentação + **4:30 de perguntas**.
- **28 slides** na apresentação (cerca de 1 slide por minuto) + **material de apoio** nos slides 29 a 38, só para
  responder perguntas.
- **Quem fala o quê:**
  - **Bernardo** — abertura, o problema, o que o app faz, a demonstração no PC e no iPhone, próximos passos e a
    condução das perguntas.
  - **João Victor** — a tecnologia (parte A) e como o app foi feito (parte B), com o hot reload ao vivo.
  - **Rafael** — o Android (APK), build e deploy (parte C), comparativo (parte D), testes e desafios.
- **Tempo de cada um:** Bernardo 8:45 · João Victor 8:30 · Rafael 8:15 · perguntas 4:30 (os três) → cerca de
  **10 minutos por pessoa**.

## Blocos minuto a minuto

| Início | Fim | Quem fala | Slide | Bloco | O que dizer (tópicos) |
|---|---|---|---|---|---|
| 00:00 | 00:45 | Bernardo | 1 | Abertura | boa noite · nomes do grupo · app de tarefas para Android, iPhone e navegador · feito com Ionic + Capacitor, diferente do React Native da aula |
| 00:45 | 01:15 | Bernardo | 2 | Roteiro | 30 min, com perguntas no fim · quem apresenta cada parte · vai ter demonstração ao vivo |
| 01:15 | 02:30 | Bernardo | 3 | O problema e a proposta | tarefas espalhadas, prazos perdidos · escrever como se fala: "Reunião amanhã 14h #trabalho !alta" · organiza sozinho · sem cadastro, dados no aparelho · um código só |
| 02:30 | 03:45 | Bernardo | 4 | O que o app faz | os 6 requisitos (criar/editar/excluir, categorias, prioridades, concluir, buscar e filtrar, salvar no aparelho) · extras: adição rápida, sugestão, ordenação, modo escuro, QR code |
| 03:45 | 04:00 | João Victor | 5 | Parte A | "a tecnologia: Ionic, Capacitor e PWA, prós e contras" |
| 04:00 | 05:15 | João Victor | 6 | Ionic + Capacitor + PWA | Ionic = a interface (componentes com cara de app) · Capacitor = a ponte para Android e iOS (WebView + plugins) · o mesmo build vira APK, IPA e site · PWA = site que vira app pela Tela de Início |
| 05:15 | 06:00 | João Victor | 7 | Mesmo código, duas aparências | o Ionic detecta a plataforma · iOS à esquerda, Android (Material Design) à direita · nenhuma linha de CSS por plataforma |
| 06:00 | 07:15 | João Victor | 8 | Vantagens e desvantagens | prós: quem sabe web já sabe Ionic, um código, rápido, npm, grátis · contras: WebView, plugins, pacote maior (660 kB), iPhone exige Mac · ideal para listas e formulários |
| 07:15 | 07:30 | João Victor | 9 | Parte B | "como o app foi feito, e no fim a demonstração" |
| 07:30 | 08:45 | João Victor | 10 | Arquitetura | sem servidor e sem login · tela → store.js (estado) → storage.js (grava no aparelho) · regras no smart.js · funciona sem internet · pelo QR o PC só entrega o app |
| 08:45 | 09:30 | João Victor | 11 | Estrutura do projeto | index.html = telas · src/ = módulos · scripts/ = APK e QR · android/ e ios/ = projetos nativos · regras separadas da tela |
| 09:30 | 10:15 | João Victor | 12 | Componentes de UI | percorrer os números 1 a 9 da imagem · 32 componentes Ionic registrados |
| 10:15 | 11:15 | João Victor | 13 | O "inteligente" | a frase vira título, data, hora, categoria e prioridade · sem tags, sugere ("e-mail", "cliente" → Trabalho; "urgente" → Alta) · "Comprar pão 2h" não vira horário |
| 11:15 | 12:15 | João Victor | 14 | Hot reload **ao vivo** | trocar a cor em src/styles.css e salvar: muda na hora, formulário continua aberto · (se der tempo) trocar o título no index.html |
| 12:15 | 15:00 | Bernardo | 15 | **Demonstração no PC** | os 6 passos da seção "Demonstração ao vivo" abaixo |
| 15:00 | 16:30 | Bernardo | 16 | **iPhone pelo QR code** | ler o QR · abre no Safari com o aviso "Use como app" · Adicionar à Tela de Início · abrir pelo ícone em tela cheia · criar uma tarefa |
| 16:30 | 17:30 | Rafael | 17 | **Android (APK)** | abrir o app instalado e criar uma tarefa (ou mostrar o arquivo APK e as telas) · mesmo código, visual Material Design · APK de teste |
| 17:30 | 17:45 | Rafael | 18 | Parte C | "build e deploy: do código ao app" |
| 17:45 | 18:30 | Rafael | 19 | Pipeline de build | npm run build → npx cap sync → Gradle (APK) ou Xcode (IPA) · a mesma pasta vira site |
| 18:30 | 19:45 | Rafael | 20 | APK, IPA e lojas | npm run android:apk em Windows, Mac e Linux · precisa Node 20+, Java 21 e Android SDK · Play Store: .aab assinado, US$ 25 · App Store: Mac + US$ 99/ano · sem Mac: PWA |
| 19:45 | 20:30 | Rafael | 21 | Performance | WebView: fluido para listas, fraco para jogos · 660 kB (137 kB com gzip) · offline no APK e na web com HTTPS |
| 20:30 | 20:45 | Rafael | 22 | Parte D | "comparativo com o React Native da aula, e também Flutter e nativo" |
| 20:45 | 21:30 | Rafael | 23 | Como cada um desenha a tela | Ionic: página web na WebView · React Native: componentes nativos (Hermes) |
| 21:30 | 22:30 | Rafael | 24 | Por que Ionic | 4 caminhos lado a lado · por que escolhemos: já sabíamos web, app de listas, três plataformas com um código · para jogos: Flutter ou nativo |
| 22:30 | 23:30 | Rafael | 25 | Testes automatizados | 34 testes, todos passando · 15 regras, 9 dados, 3 offline, 7 aviso do iPhone · node --test, sem biblioteca extra |
| 23:30 | 24:45 | Rafael | 26 | Desafios e aprendizados | rodar em outro computador (APK só no Windows, gradlew) · Java 21 · iPhone sem Mac · português ambíguo · o que aprendemos |
| 24:45 | 25:30 | Bernardo | 27 | Próximos passos | ainda não feito: HTTPS, lembretes, sincronizar, lojas, app mais leve |
| 25:30 | 30:00 | Todos | 28 | **Perguntas** | Bernardo agradece, mostra o QR do GitHub e organiza as perguntas · cada um responde a sua parte · encerrar no 30:00 |
| | **30:00** | | | **Total** | Bernardo 8:45 · João Victor 8:30 · Rafael 8:15 · perguntas 4:30 |

### Passagens entre os apresentadores

- **Bernardo → João Victor** (03:45, slide 4 → 5): "Mas como um código só vira app de Android, de iPhone e site? O João
  Victor explica a tecnologia."
- **João Victor → Bernardo** (12:15, slide 14 → 15): "Agora o Bernardo mostra o app funcionando, do jeito que um usuário
  usa."
- **Bernardo → Rafael** (16:30, slide 16 → 17): "No iPhone ele vira app pela Tela de Início. E no Android? O Rafael mostra
  o APK."
- **Rafael → Bernardo** (24:45, slide 26 → 27): "Para fechar, o Bernardo fala dos próximos passos."
- **Bernardo → todos** (25:30, slide 28): "Obrigado! Agora, perguntas."

Marcos de tempo para quem cronometra: **12:15** começa a demonstração · **17:30** começa a parte C · **25:30** começam as
perguntas. Se no 12:15 ainda estiver no slide 12, pular o hot reload (ver Plano B).

## Demonstração ao vivo — passo a passo

### Hot reload (João Victor, 11:15–12:15, slide 14)

1. Já deixar aberto: um terminal na pasta do projeto rodando `npm run dev`, o Chrome em `http://localhost:5173` e o VS Code
   em `src/styles.css`.
2. No app, tocar em **+** e digitar algo no título (deixar o formulário aberto).
3. Em `src/styles.css`, trocar `--ion-color-primary: #0a84ff;` por `#af52de` e salvar (Ctrl+S): a cor muda na hora e o
   formulário continua aberto, com o texto.
4. Se der tempo: no `index.html`, trocar `<ion-title>Tarefas</ion-title>` por `Minhas tarefas` e salvar: a página recarrega
   em menos de 1 segundo e as tarefas continuam lá.
5. Desfazer com Ctrl+Z e salvar. Depois da aula: `git checkout -- src/styles.css index.html`.

### No PC (Bernardo, 12:15–15:00, slide 15)

No Chrome, em `http://localhost:4173`, em modo celular (F12 → Ctrl+Shift+M → escolher um iPhone).

1. **Adição rápida:** digitar `Reunião amanhã 14h #trabalho !alta` e Enter. Ler o aviso que aparece:
   *"Adicionada: Trabalho · prioridade alta · Amanhã · 14:00"*. Dizer: "eu não escolhi nada, ele entendeu a frase".
2. **Formulário:** tocar em **+**, digitar `Responder e-mail do cliente (urgente)` e mostrar o **✨ sugerida** em
   Trabalho e em Alta. Salvar.
3. **Concluir:** tocar no círculo de uma tarefa → ela fica riscada e vai para o fim da lista.
4. **Deslizar:** arrastar uma tarefa para a esquerda → aparecem **Editar** e **Excluir**; Excluir pede confirmação (pode
   cancelar).
5. **Buscar e filtrar:** buscar `seminario` (sem acento) → acha "Montar os slides do seminário". Tocar em **Pendentes** e
   no chip **Estudo**; depois voltar para **Todas**.
6. **Ordenação inteligente:** mostrar **Ordenar: Inteligente** (a atrasada no topo, depois hoje, amanhã…). Trocar para
   **Mais recentes** para comparar e voltar para **Inteligente**.

### No iPhone (Bernardo, 15:00–16:30, slide 16)

1. No PC, a página do QR já está aberta (atalho **Abrir no celular**, aberto 15 minutos antes).
2. Abrir a **câmera** do iPhone, apontar para o QR e tocar no link → abre no **Safari**, com o aviso **"Use como app"**.
3. Tocar em **Compartilhar** (quadrado com seta) → **Adicionar à Tela de Início** → **Adicionar**.
4. Abrir pelo ícone **Tarefas**: abre em tela cheia, sem a barra do Safari.
5. Criar uma tarefa no iPhone (ex.: `Apresentar o trabalho hoje #estudo !alta`) e mostrar o celular para a turma.
6. Opcional: o professor pode ler o QR com o próprio celular, se estiver no mesmo Wi-Fi.

Atenção: o ícone **Tarefas** guarda o endereço do PC. Na faculdade o PC recebe outro endereço, então um ícone criado em
casa **não abre lá** (e as tarefas do iPhone ficam ligadas ao endereço antigo). Por isso o passo a passo acima é feito na
hora, com o QR novo.

### No Android (Rafael, 16:30–17:30, slide 17)

- **Se alguém do grupo tiver Android:** o APK já foi instalado na véspera. Abrir o app, criar uma tarefa rápida e mostrar
  que ele abre até no modo avião (os arquivos vão dentro do app).
- **Se ninguém tiver Android:** mostrar no PC a pasta **APK** do projeto, com o arquivo `GerenciadorTarefas-debug.apk`
  (4,3 MB), e as telas do slide 17.

## Checklist de antes da apresentação

### Na véspera

- [ ] Ensaiar uma vez inteira **com cronômetro** (meta: chegar no slide 28 aos 25:30).
- [ ] Carregar o notebook, o iPhone e o Android (se houver).
- [ ] Instalar o APK no Android de alguém do grupo: copiar `GerenciadorTarefas-debug.apk` (pasta **APK** do projeto) para o
      celular, abrir e permitir "instalar apps desconhecidos".
- [ ] Gravar um vídeo curto (1 a 2 min) da demonstração no PC e no iPhone — é o plano B.
- [ ] Copiar `apresentacao.pptx` e `apresentacao.pdf` para um pen drive e para o celular.
- [ ] Testar o roteador (hotspot) de um celular com o PC e o iPhone ligados nele.
- [ ] Se for usar outro computador: baixar o projeto e rodar `npm ci` com internet (o atalho faz isso sozinho na primeira
      vez, mas demora).

### 15 minutos antes

- [ ] PC **na tomada**, sem suspensão de tela e com notificações silenciadas (Não perturbe).
- [ ] Projetor conectado e testado; PowerPoint aberto no **Modo de Exibição do Apresentador** (Alt+F5).
- [ ] Dois cliques em **Abrir no celular.bat** (pasta do projeto) e **deixar a janela aberta** — fechar a janela desliga o
      sistema. Se o Windows perguntar sobre a rede: marcar **Redes privadas** e **Permitir**.
- [ ] Celular e PC **no mesmo Wi-Fi**. Testar o QR no iPhone (abrir uma vez).
- [ ] iPhone e Android com bateria acima de 50%, brilho alto, Não perturbe ligado e rotação travada.
- [ ] Abas abertas no Chrome:
      1. `http://localhost:4173` em modo celular (F12 → Ctrl+Shift+M);
      2. a página do QR ("Abrir o Gerenciador de Tarefas no celular");
      3. `https://github.com/jdecarli6/DESENWEB`.
- [ ] Hot reload (João Victor): um segundo terminal na pasta do projeto com `npm run dev`, a aba
      `http://localhost:5173` e o VS Code aberto em `src/styles.css`.
- [ ] Lista de exemplo no Chrome do PC. Se estiver vazia ou bagunçada, digitar na adição rápida, uma de cada vez
      (para começar do zero, use uma janela anônima — Ctrl+Shift+N — que começa vazia):
      - `Entregar relatório do estágio hoje 18h`
      - `Montar os slides do seminário amanhã`
      - `Pagar boleto da faculdade em 2 dias`
      - `Estudar para a prova de Cálculo em 3 dias`
      - `Consulta no dentista em 5 dias às 9h`
      - `Lavar o carro quando der`
      - `Renovar livros na biblioteca 25/11/2026` (data já passada: vira "Atrasada" e fica no topo)
- [ ] **Não** criar antes a tarefa "Reunião amanhã 14h #trabalho !alta" — ela é criada ao vivo.
- [ ] Um colega com o cronômetro à vista de quem apresenta.

## Plano B

- **O Wi-Fi da faculdade não deixa o iPhone abrir o QR** (aparelhos não se enxergam na rede):
  1. ligar o **roteador (hotspot) do celular** de um colega e conectar nele o PC e o iPhone;
  2. fechar a janela do **Abrir no celular** e abrir de novo (o QR muda de endereço);
  3. ler o QR outra vez. Se ainda falhar: mostrar o slide 16 (capturas reais) e o vídeo gravado na véspera.
- **O PC ou o projetor falhou:** apresentar pelo PDF (pen drive ou celular). As telas do app estão nos slides 4, 12, 13, 15,
  16 e 17.
- **O hot reload não funcionou:** explicar pela tabela do slide 14 e seguir — no máximo 1 minuto.
- **Ninguém tem Android:** mostrar o arquivo APK na pasta e o slide 17.
- **O atalho do QR fechou com erro de porta ocupada:** fechar outras janelas do sistema que estejam abertas e abrir o
  atalho de novo.
- **O tempo está estourando**, cortar nesta ordem: hot reload (só falar pelo slide, −1 min) → slide 21 (−30 s) → slide 11
  (−30 s) → Android só falado (−30 s). As perguntas nunca ficam com menos de 3 minutos.
- **Sobrou tempo:** nas perguntas, usar o material de apoio (slides 29 a 38).

## Perguntas prováveis do professor

1. **Por que Ionic e não React Native, que vimos em aula?**
   Já sabíamos web (HTML, CSS e JavaScript); com um código só temos Android, iPhone e navegador; o app é de listas e
   formulários, que é o caso ideal do Ionic; e queríamos explorar outra tecnologia. Para jogos ou animações
   pesadas, React Native, Flutter ou nativo seriam melhores.
2. **Funciona sem internet?**
   No APK, sim, desde a instalação (os arquivos vão dentro do app). Na web, depois da primeira visita, quando o site
   está publicado em HTTPS. Pelo QR code (rede local, sem HTTPS) não: precisa do PC ligado.
3. **Onde ficam os dados? Tem banco de dados?**
   Não tem servidor nem banco na nuvem. Os dados ficam no aparelho: no app nativo, no plugin Preferences do Capacitor
   (SharedPreferences no Android, UserDefaults no iOS); no navegador, no localStorage. Tudo numa chave só, em JSON.
4. **O "inteligente" é inteligência artificial?**
   Não, e não usa internet. São regras em JavaScript (`smart.js`) que reconhecem datas ("amanhã", "sexta", "13/11",
   "em 3 dias"), horas ("14h", "às 8h"), `#categoria` e `!prioridade`, e palavras-chave para sugerir categoria e
   prioridade. A ordenação coloca atrasadas, hoje, amanhã e os próximos 7 dias primeiro, pesando a prioridade.
5. **Dá para publicar na Play Store e na App Store?**
   Dá, mas não publicamos. Na Play Store: pacote `.aab` assinado e taxa única de US$ 25. Na App Store: Mac com Xcode e
   conta Apple Developer (US$ 99 por ano). O APK de hoje é de teste (assinado com a chave de debug) e o nome do pacote
   (`br.com.exemplo...`) é de exemplo.
6. **Como vocês testaram?**
   34 testes automatizados com o `node --test`, que já vem com o Node, todos passando: 15 das regras, 9 dos dados, 3 do
   modo offline e 7 do aviso do iPhone. Além disso, usamos o app no navegador e no iPhone (pelo QR) e geramos o APK.
7. **Por que no iPhone não é um app "de verdade"?**
   Para gerar o app de iPhone (IPA) é obrigatório um Mac com Xcode, e não tínhamos. O projeto iOS está pronto no
   repositório: num Mac é rodar `npm run ios:sync` e abrir no Xcode. No iPhone usamos o PWA: "Adicionar à Tela de
   Início" abre em tela cheia, com ícone.
8. **Não fica lento por rodar numa WebView?**
   Para listas e formulários fica fluido. O ponto fraco é animação pesada, jogos e 3D. O JavaScript tem 660 kB (137 kB
   compactado) e só os 32 componentes do Ionic que usamos entram no pacote.

## Material de apoio (slides 29 a 38)

Não entram nos 30 minutos; servem para responder perguntas. No modo apresentação, digite o número do slide e Enter para
pular direto (e `28` + Enter para voltar).

| Slide | Conteúdo |
|---|---|
| 29 | Divisória "Material de apoio" |
| 30 | Características principais do Ionic |
| 31 | Casos de uso ideais (e quando evitar) |
| 32 | Configuração do ambiente e comandos |
| 33 | Componentes em ação (modal, deslizar, alerta, aviso) |
| 34 | Um componente Ionic no código |
| 35 | Gerenciamento de estado e dados (detalhado) |
| 36 | `store.js` por dentro |
| 37 | Fluxo de desenvolvimento: Ionic × React Native |
| 38 | A mesma tela nas duas tecnologias |
