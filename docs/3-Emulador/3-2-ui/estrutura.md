A interface do usuário é construída usando React e TypeScript, fornecendo uma experiência visual completa para interagir com o emulador CHIP-8. A estrutura da UI é organizada de forma modular, facilitando a manutenção e a expansão do código.

## Estrutura de Pastas

A interface do usuário está organizada na pasta `src/ui/src/` com a seguinte estrutura:

```
src/ui/src/
├── assets/          # Recursos estáticos (imagens, ícones)
├── components/      # Componentes React
│   ├── shared/     # Componentes compartilhados
│   ├── Chip8Home.tsx
│   ├── Chip8Home.css
│   ├── Menu.tsx
│   └── Menu.css
├── index.css       # Estilos globais
├── main.tsx        # Ponto de entrada da aplicação
└── vite-env.d.ts   # Tipos do Vite
```

### Organização dos Componentes

- **`components/`**: Contém todos os componentes React da aplicação
  - **`shared/`**: Componentes reutilizáveis usados em múltiplas páginas (como `GitHubLink` e `GitHubIcon`)
  - **`Chip8Home.tsx`**: Componente da página inicial
  - **`Menu.tsx`**: Componente principal do emulador
  - Cada componente tem seu próprio arquivo CSS para estilização

- **`assets/`**: Recursos estáticos como imagens e ícones

- **`index.css`**: Estilos globais e variáveis CSS compartilhadas

- **`main.tsx`**: Arquivo principal que inicializa a aplicação React

## Ponto de Entrada - main.tsx

O arquivo `main.tsx` é o ponto de entrada da aplicação React. Ele é responsável por inicializar o React e configurar o roteamento:

```js
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import Chip8Home from './components/Chip8Home.tsx'
import Menu from './components/Menu.tsx'
```

### Inicialização do React

O código usa `createRoot` do React 18+ para criar a raiz da aplicação:

```js
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

- **`createRoot`**: Cria a raiz da aplicação React, permitindo renderização concorrente
- **`StrictMode`**: Modo estrito do React que ajuda a identificar problemas potenciais durante o desenvolvimento
- **`document.getElementById('root')!`**: Obtém o elemento HTML onde a aplicação será renderizada (definido no `index.html`)

### Sistema de Roteamento

A aplicação usa `React Router` para gerenciar a navegação entre páginas:

```js
const router = createBrowserRouter([
  {
    path: '/',
    element: <Chip8Home />,
  },
  {
    path: '/menu',
    element: <Menu />,
  }
])
```

O `createBrowserRouter` cria um roteador que usa a API History do navegador para navegação:

- **`path: '/'`**: Rota raiz que renderiza o componente `Chip8Home` (página inicial)
- **`path: '/menu'`**: Rota que renderiza o componente `Menu` (interface principal do emulador)
- **`element`**: O componente React que será renderizado quando a rota for acessada

## HTML Base - index.html

O arquivo `index.html` é o template HTML base da aplicação:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">
    <title>CHIP-8 Dive</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Características do HTML

- **`<div id="root">`**: Container onde o React renderiza a aplicação
- **Fonte VT323**: Carrega a fonte monoespaçada VT323 do Google Fonts, que dá um visual retro à aplicação
- **`<script type="module">`**: Carrega o módulo TypeScript principal

## Ferramentas e Dependências

A aplicação usa várias ferramentas modernas para desenvolvimento:

### Vite

O Vite é o build tool usado para desenvolvimento e produção:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

- **Desenvolvimento rápido**: Hot Module Replacement (HMR) instantâneo
- **Build otimizado**: Gera bundles otimizados para produção
- **Plugin React**: Suporte completo para React e JSX

### Dependências Principais

- **React 19.1.1**: Biblioteca para construção de interfaces
- **React DOM 19.1.1**: Renderização React no navegador
- **React Router 7.9.1**: Roteamento e navegação entre páginas
- **React Icons 5.5.0**: Biblioteca de ícones para React

### TypeScript

A aplicação é escrita em TypeScript, fornecendo:
- **Tipagem estática**: Detecta erros em tempo de desenvolvimento
- **Autocomplete**: Melhor experiência de desenvolvimento
- **Refatoração segura**: Facilita mudanças no código

## Padrão de Arquitetura

A UI segue um padrão de arquitetura modular:

### Separação de Responsabilidades

- **Componentes**: Cada componente tem uma responsabilidade específica
- **Estilos**: Cada componente tem seu próprio arquivo CSS
- **Compartilhados**: Componentes reutilizáveis em uma pasta separada

### Fluxo de Dados

1. **Inicialização**: `main.tsx` inicializa a aplicação e configura o roteamento
2. **Navegação**: React Router gerencia a navegação entre páginas
3. **Renderização**: Cada rota renderiza seu componente correspondente
4. **Interação**: Os componentes interagem com o Core do emulador através da classe `Chip8`

### Integração com o Core

A UI se comunica com o Core do emulador através da classe `Chip8`:

```js
import { Chip8 } from "../../../core/chip8/chip8";

const chip = new Chip8();
```

Isso permite que a interface:
- Carregue ROMs no emulador
- Controle a execução (start, pause, step, reset)
- Visualize o display
- Capture entrada do teclado
- Configure quirks e comportamentos

## Scripts de Desenvolvimento

O `package.json` define scripts úteis para desenvolvimento:

- **`npm run dev`**: Inicia o servidor de desenvolvimento com hot reload
- **`npm run build`**: Compila o TypeScript e gera o build de produção
- **`npm run lint`**: Executa o linter para verificar a qualidade do código
- **`npm run preview`**: Visualiza o build de produção localmente

## Resumo

A estrutura da UI é organizada para:
- **Modularidade**: Componentes separados e reutilizáveis
- **Manutenibilidade**: Código organizado e fácil de entender
- **Escalabilidade**: Fácil adicionar novos componentes e funcionalidades
- **Performance**: Build otimizado com Vite
- **Type Safety**: TypeScript garante tipagem estática

Essa estrutura fornece uma base sólida para uma interface de usuário moderna e responsiva.

## Trecho Completo

### `main.tsx`

```js
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import Chip8Home from './components/Chip8Home.tsx'
import Menu from './components/Menu.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Chip8Home />,
  },
  {
    path: '/menu',
    element: <Menu />,
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

### `vite.config.ts`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
```

### `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">
    <title>CHIP-8 Dive</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
