A próxima parte da implementação do emulador é a construção do display, que é o componente responsável por representar visualmente o que o CHIP-8 está executando.
No sistema original, o display tinha 64 pixels de largura por 32 pixels de altura, e cada pixel podia estar ligado (1) ou desligado (0).

Para simular esse comportamento em TypeScript, criamos uma classe chamada `Display`.
A ideia dela é ser como uma folha quadriculada, onde cada quadradinho representa um pixel:


```js
export class Display {
    private display: number[][];
    private display_width: number;
    private display_height: number;

    constructor() {
        this.display_width = 64;
        this.display_height = 32;
        this.display = new Array(this.display_height)
            .fill(0)
            .map(() => new Array(this.display_width).fill(0));
    }
}

```
Vamos entender isso por partes. Primeiro, definimos as dimensões da tela:

```js
this.display_width = 64;
this.display_height = 32;
```
Esses valores seguem o mesmo padrão do CHIP-8 original.
Isso significa que nossa “tela virtual” terá 64 colunas (pixels na horizontal) e 32 linhas (pixels na vertical).

Agora vem a parte que realmente forma a tela. Criamos uma matriz bidimensional (um array dentro de outro).
Cada posição dessa matriz vai guardar o estado de um pixel — 0 se estiver apagado e 1 se estiver aceso:

> Como estamos começando pelo estado inicial, usamos o `fill` para preencher essa matriz com zeros.

```js
this.display = new Array(this.display_height)
    .fill(0)
    .map(() => new Array(this.display_width).fill(0));

```
## Acessar e alterar pixel da tela
Com a tela criada, precisamos de formas de interagir com ela — acender, apagar e verificar pixels:

```js
getPixel(xPos: number, yPos: number) {
    return this.display[yPos][xPos];
}
```
Esse método serve para consultar o estado de um pixel específico.
A CPU usa isso para saber, por exemplo, se um ponto já estava aceso antes de desenhar outro em cima.

Também criamos um método modifica o pixel, ligando ou desligando conforme o valor passado:
```js
setPixel(xPos: number, yPos: number, value: number) {
    this.display[yPos][xPos] = value;
}
```

## Acessar a tela inteira
```js
getDisplay() {
    return this.display;
}
```
Esse método devolve toda a matriz.
Ele é útil quando outro módulo do emulador precisa renderizar a tela completa, por exemplo, desenhando os pixels no navegador.
### Limpar a tela
```js
cleanDisplay() {
    this.display.forEach(row => row.fill(0));
}
```
Esse método apaga tudo, preenchendo novamente com zeros.
No CHIP-8, essa ação acontece quando a CPU executa a instrução “CLS” (Clear Screen).

## Como será a interação no Emulador?

Durante a execução do jogo, a CPU do CHIP-8 vai chamar os métodos `setPixel()` e `getPixel()` várias vezes por segundo.
Cada instrução gráfica do jogo desenha pequenos blocos de pixels na tela — e é assim que as imagens “aparecem”. Portanto, o Display funciona como uma ponte entre a CPU e o visual do jogo.

# Trecho completo do Display
```js
export class Display {
    private display: number[][];
    private display_width: number;
    private display_height: number;

    constructor() {
        this.display_width = 64;
        this.display_height = 32;
        this.display = new Array(this.display_height)
            .fill(0)
            .map(() => new Array(this.display_width).fill(0));
    }

    getDisplay() {
        return this.display;
    }

    getPixel(xPos: number, yPos: number) {
        return this.display[yPos][xPos];
    }

    setPixel(xPos: number, yPos: number, value: number) {
        this.display[yPos][xPos] = value;
    }

    cleanDisplay() {
        this.display.forEach(row => row.fill(0));
    }
}
```









