# Roteiro da demo ao vivo — Parte B (hot reload com o Vite)

**Quando:** slide 19 (“Hot reload ao vivo com o Vite”), dentro dos 10 minutos da parte B.
**Duração:** cerca de 1 min 45 s (passos 1 a 3). O passo 4 é opcional.
**Quem conduz:** quem apresenta a parte B. Se possível, outro integrante troca os slides.

---

## Antes da aula (checklist)

- [ ] `npm install` já rodado e `npm run dev` **rodando** num terminal com fonte grande.
      O Vite sobe em `http://localhost:5173` (porta definida no `vite.config.js`).
- [ ] Chrome aberto em `http://localhost:5173`, com o DevTools em **modo celular**
      (F12 → `Ctrl + Shift + M` → escolha “iPhone 12 Pro” ou “Pixel 7”).
      O Ionic escolhe o visual pelo aparelho: iPhone = modo **ios**, Pixel = modo **md**. Depois de trocar o aparelho, recarregue (F5).
- [ ] VS Code aberto com 3 abas, zoom em ~150% (`Ctrl + =`):
      `src/styles.css`, `index.html` e `src/smart.js`.
- [ ] Algumas tarefas já criadas pela **adição rápida** (barra de baixo do app), para a lista não ficar vazia:

  | Digite                                          | O app entende                                    |
  | ----------------------------------------------- | ------------------------------------------------ |
  | `Entregar relatório amanhã 18h #trabalho !alta` | Trabalho · Alta · amanhã às 18:00                 |
  | `Estudar para a prova de Cálculo sexta`         | Estudo (sugerida) · próxima sexta                 |
  | `Pagar boleto da faculdade dia 10/12`           | Finanças (sugerida) · 10/12                       |
  | `Consulta no dentista terça 14h30`              | Saúde (sugerida) · terça às 14:30                 |
  | `Comprar presente da mãe sem pressa`            | Pessoal · prioridade Baixa (“sem pressa”)         |

- [ ] `git status` limpo — assim dá para desfazer tudo no final com um comando.
- [ ] Notificações do Windows silenciadas (Assistente de foco). Não precisa de internet: o servidor é local.

---

## Passo 0 — Mostrar que está rodando (≈ 15 s)

**Ação:** mostre o terminal com a saída do Vite e, ao lado, o app no Chrome.

> “Este é o `npm run dev`. O Vite serve o app em localhost:5173 e fica observando os arquivos.
> Quando eu salvar algo, ele manda para o navegador só o que mudou — não refaz o build.”

---

## Passo 1 — CSS troca a quente, sem recarregar (≈ 30 s) — o “uau” da demo

1. No app, toque no **+** (botão flutuante) e digite `Tarefa de teste` no título.
   **Deixe o formulário aberto.**
2. No VS Code, em `src/styles.css` (linha 3 hoje), troque:

   ```css
   --ion-color-primary: #0a84ff;
   ```

   por:

   ```css
   --ion-color-primary: #af52de;
   ```

   e salve (`Ctrl + S`).
3. **Resultado:** “Cancelar”, “Salvar”, “Remover prazo” e o chip de categoria selecionado ficam **roxos na hora**,
   e o formulário **continua aberto, com o texto digitado**.

> “Mudei o CSS e a tela atualizou sem recarregar: o formulário continua aberto, nada se perdeu.
> Isso é o HMR do Vite.”

4. Desfaça (`Ctrl + Z`, `Ctrl + S`) — volta ao azul na hora. Feche o formulário com **Cancelar**.

---

## Passo 2 — HTML: a página recarrega, mas os dados ficam (≈ 30 s)

1. Em `index.html` (linha 23 hoje), troque:

   ```html
   <ion-title>Tarefas</ion-title>
   ```

   por:

   ```html
   <ion-title>Minhas tarefas</ion-title>
   ```

   e salve.
2. **Resultado:** a página recarrega sozinha em menos de 1 segundo, com o título novo, e **as tarefas continuam lá**.

> “HTML e JavaScript não têm troca a quente neste projeto — não usamos framework —, então o Vite recarrega
> a página inteira, bem rápido. Como as tarefas estão salvas no aparelho (localStorage no navegador),
> nada se perde.”

3. Desfaça e salve.

---

## Passo 3 — JavaScript: uma categoria nova (≈ 30 s)

1. **Antes de mexer no código**, digite na adição rápida: `Cinema sábado 20h #lazer` e Enter.
   Repare: a categoria `#lazer` **não existe** — o app cria “Cinema #lazer” na categoria Pessoal.
2. Em `src/smart.js`, na lista `CATEGORIES` (linhas 4 a 11 hoje), acrescente **depois da linha de Finanças**:

   ```js
     { id: 'lazer', label: 'Lazer', color: '#34c759' },
   ```

   e salve.
3. **Resultado:** a página recarrega e o chip **Lazer** aparece nos filtros (role os chips para o lado) e no formulário.
4. Digite de novo `Cinema sábado 20h #lazer` e Enter: agora o título fica só “Cinema”, na categoria **Lazer**,
   e o aviso mostra “Adicionada: Lazer · …”.

> “Uma linha de JavaScript e o app inteiro passou a entender a categoria nova — filtros, formulário e
> adição rápida —, porque tudo lê a mesma lista do `smart.js`.”

5. Limpeza: exclua as duas tarefas “Cinema” (arraste para a esquerda → **Excluir** → confirmar).
   Depois desfaça a mudança no `smart.js` e salve.

---

## Passo 4 (opcional, se sobrar tempo) — no celular

- **Navegador do celular:** na mesma rede Wi-Fi, abra o endereço **Network** que o Vite mostra no terminal
  (funciona porque o `vite.config.js` tem `server.host: true`). Repita o passo 1: a cor muda no celular também.
- **Dentro do app nativo (Android):** com o Android Studio instalado e o celular em depuração USB:

  ```bash
  npx cap run android -l --host <IP-do-notebook> --port 5173
  ```

  O app instalado carrega direto do servidor do Vite e recebe as mudanças ao vivo.
  Atenção: o `cap run` também faz o `cap sync` (copia arquivos para `android/`).

---

## Ao terminar

Confira o que mudou e desfaça tudo o que for da demo:

```bash
git status
git diff
git checkout -- src/styles.css index.html src/smart.js
```

---

## Plano B

| Problema                              | O que fazer                                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| Porta 5173 ocupada                    | O Vite usa a próxima (5174…). Abra o endereço que aparecer no terminal.                       |
| Tela em branco ou erro vermelho       | É o aviso de erro do Vite (algo digitado errado). `Ctrl + Z`, salve, e a tela volta sozinha. |
| A cor não mudou no passo 1            | Confira se salvou o arquivo certo (`src/styles.css`) e se o terminal do Vite está rodando.   |
| Atrasou                               | Pule o passo 3 e siga para a parte C.                                                         |
| Sem notebook / projetor com problema  | Use os slides 13, 14 e 18 (telas reais do app) e explique os passos pela tabela do slide 19. |

---

## Frases-chave (cola)

- “O Vite não refaz o build a cada mudança: serve os arquivos sob demanda e manda só o que mudou.”
- “CSS troca a quente; HTML e JavaScript recarregam a página em menos de 1 segundo.”
- “No React Native, o equivalente é o Fast Refresh, que preserva o estado do componente — falamos disso na parte D.”
