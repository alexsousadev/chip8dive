Os componentes compartilhados são elementos reutilizáveis da interface que aparecem em múltiplas páginas da aplicação. Eles fornecem consistência visual e funcionalidade comum em toda a aplicação.

## GitHubIcon

O componente `GitHubIcon` é um ícone SVG que representa o logo do GitHub. Ele é usado como parte do link para o repositório do projeto.

A construção do ícone começa pelo componente `GitHubIcon`, que renderiza um SVG inline:

```js
export const GitHubIcon = () => {
  return (
    <svg viewBox="0 0 16 16" width="22" height="22" aria-hidden="true">
      <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"></path>
    </svg>
  );
};
```

### Características do SVG

O ícone usa um SVG inline com as seguintes propriedades:

- **`viewBox="0 0 16 16"`**: Define o sistema de coordenadas do SVG, permitindo que ele seja escalado proporcionalmente
- **`width="22" height="22"`**: Define o tamanho do ícone em pixels
- **`aria-hidden="true"`**: Indica aos leitores de tela que este elemento é decorativo e não precisa ser anunciado
- **`fill="currentColor"`**: Faz com que o ícone use a cor do texto atual, permitindo que ele se adapte ao tema

O uso de `currentColor` é importante porque permite que o ícone herde a cor do elemento pai, tornando-o flexível e fácil de estilizar.

## GitHubLink

O componente `GitHubLink` combina o `GitHubIcon` com um link para o repositório GitHub do projeto. Ele é usado em múltiplas páginas da aplicação para fornecer acesso rápido ao código-fonte.

A construção do link começa pelo componente `GitHubLink`:

```js
import { GitHubIcon } from "./GitHubIcon";

export const GitHubLink = () => {
  return (
    <a 
      className="gh-float" 
      href="https://github.com/alexsousadev/chip8dive" 
      target="_blank" 
      rel="noopener noreferrer" 
      aria-label="GitHub" 
      title="GitHub"
    >
      <GitHubIcon />
    </a>
  );
};
```

### Propriedades do Link

O componente `GitHubLink` usa um elemento `<a>` com várias propriedades importantes:

- **`className="gh-float"`**: Aplica estilos CSS que fazem o link flutuar no canto inferior direito da tela
- **`href`**: URL do repositório GitHub
- **`target="_blank"`**: Abre o link em uma nova aba
- **`rel="noopener noreferrer"`**: Medidas de segurança que previnem que a nova página acesse `window.opener` e não envia informações de referência
- **`aria-label="GitHub"`**: Fornece um rótulo acessível para leitores de tela
- **`title="GitHub"`**: Fornece uma dica de ferramenta quando o usuário passa o mouse sobre o link

### Acessibilidade

O componente é projetado com acessibilidade em mente:
- Usa `aria-label` para descrever o propósito do link
- Usa `title` para fornecer informações adicionais
- O ícone usa `aria-hidden="true"` porque o link já tem um rótulo textual

## Estilos Compartilhados

Os estilos compartilhados são definidos no arquivo `index.css` e incluem variáveis CSS globais e estilos para componentes comuns.

### Variáveis CSS

O arquivo define variáveis CSS que podem ser usadas em toda a aplicação:

```css
:root {
  --bg: #ffffff;
  --text: #222222;
  --muted-text: #4b4b4b;
  --panel: #fafafa;
  --border: #e5e5e5;
  --accent: #1f6b3a;
  --accent-soft: #2d8a52;
  font-family: 'VT323', system-ui, monospace;
}
```

Essas variáveis permitem:
- **Consistência**: Manter as mesmas cores e estilos em toda a aplicação
- **Manutenibilidade**: Mudar um valor em um lugar afeta toda a aplicação
- **Temas**: Facilitar a implementação de temas diferentes no futuro

### Estilo do Link Flutuante

O estilo `.gh-float` é aplicado ao componente `GitHubLink`:

```css
.gh-float {
  position: fixed;
  bottom: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #111;
  background: rgba(255,255,255,0.9);
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  text-decoration: none;
  z-index: 1001;
}
```

### Características do Estilo

- **`position: fixed`**: Fixa o elemento na tela, mesmo quando o usuário rola a página
- **`bottom: 10px; right: 10px`**: Posiciona o link no canto inferior direito
- **`z-index: 1001`**: Garante que o link fique acima de outros elementos
- **`background: rgba(255,255,255,0.9)`**: Fundo branco semi-transparente
- **`border-radius: 6px`**: Cantos arredondados para um visual mais suave

### Efeito Hover

O estilo também define um efeito hover:

```css
.gh-float:hover {
  background: #ffffff;
  border-color: #000000;
  color: #000000;
}
```

Quando o usuário passa o mouse sobre o link, ele muda para um fundo branco sólido com borda preta, criando um feedback visual claro.

## Reutilização

Os componentes compartilhados são projetados para serem reutilizáveis:

- **GitHubIcon**: Pode ser usado em qualquer lugar onde um ícone do GitHub seja necessário
- **GitHubLink**: Pode ser importado e usado em qualquer página da aplicação
- **Estilos globais**: Fornecem uma base consistente para toda a aplicação

Isso reduz duplicação de código e garante consistência visual em toda a aplicação.

## Trecho Completo

### `GitHubIcon.tsx`

```js
/**
 * Icone do GitHub
 */
export const GitHubIcon = () => {
  return (
    <svg viewBox="0 0 16 16" width="22" height="22" aria-hidden="true">
      <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"></path>
    </svg>
  );
};
```

### `GitHubLink.tsx`

```js
import { GitHubIcon } from "./GitHubIcon";

export const GitHubLink = () => {
  return (
    <a 
      className="gh-float" 
      href="https://github.com/alexsousadev/chip8dive" 
      target="_blank" 
      rel="noopener noreferrer" 
      aria-label="GitHub" 
      title="GitHub"
    >
      <GitHubIcon />
    </a>
  );
};
```

### Estilos Compartilhados (`index.css`)

```css
/* Variáveis CSS globais */
:root {
  --bg: #ffffff;
  --text: #222222;
  --muted-text: #4b4b4b;
  --panel: #fafafa;
  --border: #e5e5e5;
  --accent: #1f6b3a;
  --accent-soft: #2d8a52;
  font-family: 'VT323', system-ui, monospace;
}

/* Link flutuante do GitHub */
.gh-float {
  position: fixed;
  bottom: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #111;
  background: rgba(255,255,255,0.9);
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  text-decoration: none;
  z-index: 1001;
}

.gh-float:hover {
  background: #ffffff;
  border-color: #000000;
  color: #000000;
}
```

