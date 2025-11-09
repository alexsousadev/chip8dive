# Estilização do Chip8Home

A estilização do componente `Chip8Home` é feita através do arquivo `Chip8Home.css`, que define um design minimalista e retro, alinhado com a estética do CHIP-8 original. Os aspectos mais importantes da estilização são:

## Reset e Base

O CSS começa com um reset global que remove margens e paddings padrão:

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
```

Isso garante que todos os elementos comecem com uma base limpa, sem estilos padrão do navegador interferindo no layout.

## Container Principal

O container principal usa Flexbox para centralizar todo o conteúdo na tela:

```css
.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100vw;
    background-color: #ffffff;
}
```

- **`height: 100vh`** e **`width: 100vw`**: Ocupa toda a altura e largura da viewport
- **`flex-direction: column`**: Organiza os elementos verticalmente
- **`align-items: center`** e **`justify-content: center`**: Centraliza o conteúdo tanto horizontal quanto verticalmente
- **Fundo branco**: Cria um contraste com o box preto do título

## Box do Título

O título "CHIP-8 Dive" é exibido dentro de uma caixa preta que cria um contraste forte:

```css
.chip8-box {
    background-color: #000000;
    color: #ffffff;
    padding: 30px;
    margin-bottom: 30px;
    width: 100%;
    max-width: 600px;
    text-align: center;
    border-radius: 0px;
    border: 2px solid #000000;
}
```

- **Contraste preto/branco**: Estética minimalista e retro
- **`max-width: 600px`**: Limita a largura em telas grandes, mantendo o conteúdo legível
- **`border-radius: 0px`**: Bordas retas, sem arredondamento, reforçando o estilo minimalista

O título em si tem características tipográficas específicas:

```css
.chip8-title {
    font-size: 56px;
    letter-spacing: 3px;
    text-transform: uppercase;
}
```

- **Tamanho grande**: 56px para impacto visual
- **`letter-spacing: 3px`**: Espaçamento entre letras para legibilidade e estilo
- **`text-transform: uppercase`**: Garante que o texto sempre apareça em maiúsculas

## Botão de Inicialização

O botão segue o mesmo padrão minimalista, com um efeito de hover invertido:

```css
.button {
    padding: 18px 30px;
    font-size: 32px;
    width: 100%;
    border: 2px solid #000000;
    border-radius: 0px;
    background-color: #ffffff;
    cursor: pointer;
    color: #000000;
    transition: background-color 0.2s, color 0.2s;
    font-family: 'VT323', monospace;
}
```

- **Bordas retas**: `border-radius: 0px` mantém a consistência visual
- **Fonte monoespaçada**: `'VT323'` é uma fonte retro que remete a terminais antigos
- **Transição suave**: `transition` de 0.2s para mudanças de cor suaves

O efeito hover inverte as cores:

```css
.button:hover {
    background-color: #000000;
    color: #ffffff;
}
```

Quando o mouse passa sobre o botão, ele muda de branco com texto preto para preto com texto branco, criando uma interação visual clara e imediata.

## Espaçamento

O espaçador superior cria separação visual:

```css
.home-spacer {
    margin-top: 200px;
}
```

Isso empurra o conteúdo principal para baixo, criando espaço para o link do GitHub no topo e equilibrando o layout verticalmente.

## Responsividade

Para telas menores, o CSS ajusta os tamanhos:

```css
@media (max-width: 600px) {
    .chip8-title {
        font-size: 42px;
    }
    
    .button {
        font-size: 28px;
        padding: 14px 20px;
    }
}
```

- **Título reduzido**: De 56px para 42px em telas pequenas
- **Botão menor**: Fonte e padding reduzidos para melhor ajuste em dispositivos móveis

## Princípios de Design

A estilização segue alguns princípios fundamentais:

1. **Minimalismo**: Uso de apenas preto e branco, sem cores desnecessárias
2. **Contraste forte**: Preto sobre branco e branco sobre preto para máxima legibilidade
3. **Bordas retas**: Sem arredondamentos, mantendo uma estética "pixel-perfect"
4. **Tipografia retro**: Fonte monoespaçada que remete a sistemas antigos
5. **Interatividade clara**: Hover com inversão de cores para feedback visual imediato

