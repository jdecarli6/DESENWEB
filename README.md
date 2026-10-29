# Tarefas Inteligentes (iOS)

Gerenciador de tarefas feito com **Capacitor (ecossistema Ionic) + Vite + JavaScript puro**.
O mesmo código roda no navegador (para desenvolver no Windows) e vira app nativo iOS.

## Funcionalidades
- Criar, editar e excluir tarefas (título, notas, prazo e hora)
- Categorias: Trabalho, Estudo, Pessoal, Saúde, Finanças, Outros
- Prioridade: Alta, Média, Baixa
- Marcar como concluída
- Busca (sem diferenciar acento/maiúscula) e filtros por situação, categoria e prioridade
- Persistência local (Capacitor Preferences no iOS; localStorage no navegador)

### O "inteligente"
- **Adição rápida em linguagem natural** (barra inferior):
  `Entregar relatório amanhã 14h #trabalho !alta`
  Entende: hoje, amanhã, depois de amanhã, dia da semana (segunda, "próxima sexta"), `dd/mm`, `dd/mm/aaaa`,
  "em 3 dias", `14h`, `14h30`, `14:30`, `#categoria` e `!alta|!media|!baixa`.
- **Sugestão automática** de categoria e prioridade (por palavras-chave e proximidade do prazo) – tanto na
  adição rápida quanto no formulário (você pode sobrescrever).
- **Ordenação inteligente**: atrasadas > hoje > amanhã > próximos 7 dias, ponderadas pela prioridade.
- Resumo no topo (pendentes, para hoje, atrasadas).

## Rodar no navegador (Windows/Mac/Linux)
```bash
npm install
npm run dev        # abre http://localhost:5173 (use o modo celular do DevTools)
npm test           # testes das regras e da persistência
```

## Gerar o app iOS (requer um Mac com Xcode)
```bash
npm install
npm run build
npx cap add ios            # só na primeira vez
npm run assets             # gera ícone e splash a partir de resources/
npx cap sync ios
npx cap open ios           # abre o Xcode
```
No Xcode: selecione o projeto **App → Signing & Capabilities**, escolha seu *Team*, ajuste o *Bundle Identifier*
(o mesmo `appId` do `capacitor.config.json`) e rode no iPhone/simulador.
Depois de cada mudança no código: `npm run ios:sync`.

> Sem Mac: use um build na nuvem com runner macOS (GitHub Actions, Codemagic, Bitrise).
> Para publicar na App Store é necessária conta Apple Developer.

## Gerar o APK (Android) — funciona no Windows
Requisitos: Node.js LTS e **Android Studio** (instala o SDK e o JDK necessários).
```bash
npm install
npm run build
npx cap add android        # só na primeira vez
npm run assets             # opcional: ícone e splash (use: npx @capacitor/assets generate --android)
npx cap sync android
```
**APK de teste (debug)** – instala direto no celular:
```bash
cd android
gradlew.bat assembleDebug
```
Arquivo gerado: `android/app/build/outputs/apk/debug/app-debug.apk`.
(Atalho: `npm run android:apk` depois do `cap add android`.)

**APK de distribuição (release)** – pelo Android Studio: `npx cap open android` →
*Build → Generate Signed App Bundle / APK → APK* → crie/escolha um keystore → variante *release*.
Guarde o keystore e as senhas: sem eles não dá para atualizar o app depois.

Para instalar o APK: copie para o celular Android, abra o arquivo e permita "instalar apps desconhecidos"
(ou use `adb install app-debug.apk` com depuração USB).

> O APK só roda em Android. iPhone não instala APK: para iOS continua valendo o caminho do Mac/Xcode
> ou usar como PWA (site adicionado à tela inicial).

## PWA (instalar no iPhone sem Mac)
O projeto já inclui `manifest.webmanifest`, `sw.js` (funciona offline após a 1ª visita), ícones e as meta tags do iOS.
1. `npm run build` → gera a pasta `dist/`.
2. Publique a `dist/` em um endereço **HTTPS** (GitHub Pages, Netlify, Cloudflare Pages, servidor interno com certificado...).
   Os caminhos são relativos, então funciona em subpastas.
3. No iPhone, abra o endereço no **Safari** → Compartilhar → **Adicionar à Tela de Início**.
Para lançar uma nova versão e renovar o cache, altere `VERSION` em `public/sw.js`.
O service worker não é registrado no app nativo (APK/IPA) nem no `npm run dev`.

## Estrutura
```
src/smart.js    regras puras: categorias, datas, parser de texto livre, sugestões, filtros, ordenação
src/store.js    CRUD + validação + persistência
src/storage.js  adaptador Preferences (iOS) / localStorage (web)
src/pwa.js      registro do service worker (somente web)
public/         manifest, sw.js, ícones (copiados para dist/)
src/main.js     interface
src/styles.css  visual estilo iOS (claro/escuro, safe-area)
tests/          testes (node --test)
```
