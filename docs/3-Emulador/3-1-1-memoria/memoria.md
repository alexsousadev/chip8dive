A construção da memória do emulador começa pela classe Memory, que é responsável por representar toda a área de armazenamento do CHIP-8. No sistema original, essa memória tinha 4096 bytes (4 KB), e a mesma estrutura é criada aqui em TypeScript através de um `Uint8Array`, que representa um bloco de bytes.

```js
export class Memory {
    private RAM: Uint8Array;

    constructor() {
        this.RAM = new Uint8Array(4096);
    }
```
Isso cria um bloco contínuo de memória, onde cada posição pode guardar um valor entre 0 e 255 — exatamente como na arquitetura original do CHIP-8, que era baseada em bytes. Assim, esse array se torna o local onde o jogo, as fontes e os dados temporários serão armazenados.

Agora, precisamos criar a porta de entrada da CPU para a memória:

```js
getByte(address: number): number {
    return this.RAM[address];
}

setByte(address: number, value: number): void {
    this.RAM[address] = value;
}
```
Quando a CPU precisar ler uma instrução, ela chamará `getByte()`. Quando precisar gravar um valor, usará `setByte()`. É dessa forma que a CPU e a memória se comunicam — byte a byte, como em um computador real.

Com a estrutura básica da memória pronta, o próximo passo é preparar as fontes. Elas representam os dígitos e letras que o CHIP-8 exibe na tela. No sistema original, cada caractere é desenhado com uma pequena combinação de pixels.

Criamos o array `fontChip8`, onde cada grupo de 5 bytes define um caractere:

```js
export class Memory {
    private RAM: Uint8Array;
    private fonts: Uint8Array;

    constructor() {
        this.RAM = new Uint8Array(4096);
        this.fonts = new Uint8Array([
            0xF0, 0x90, 0x90, 0x90, 0xF0,	//0
            0x20, 0x60, 0x20, 0x20, 0x70,	//1
            0x60, 0x90, 0x20, 0x40, 0xF0,	//2
            0xF0, 0x10, 0xF0, 0x10, 0xF0,	//3
            0x90, 0x90, 0xF0, 0x10, 0x10,	//4
            0xF0, 0x80, 0x60, 0x10, 0xE0,	//5
            0xF0, 0x80, 0xF0, 0x90, 0xF0,	//6
            0xF0, 0x10, 0x10, 0x10, 0x10,	//7
            0xF0, 0x90, 0xF0, 0x90, 0xF0,	//8
            0xF0, 0x90, 0xF0, 0x10, 0x10,	//9
            0x60, 0x90, 0xF0, 0x90, 0x90,	//A
            0xE0, 0x90, 0xE0, 0x90, 0xE0,	//B
            0x70, 0x80, 0x80, 0x80, 0x70,	//C
            0xE0, 0x90, 0x90, 0x90, 0xE0,	//D
            0xF0, 0x80, 0xF0, 0x80, 0xF0,	//E
            0xF0, 0x80, 0xF0, 0x80, 0x80	//F
        ]);
    }
```
Para colocar essas fontes na memória, criamos um método que irá copiar os dados para a memória a partir do endereço `0x050` (ou 80 em decimal).
Esse endereço é uma convenção herdada do CHIP-8 original — é onde os programas esperam encontrar os caracteres pré-carregados:

```js
loadFontsInRAM() {
        for (let i = 0; i < fontChip8.length; i++)
            this.RAM[0x050 + i] = fontChip8[i];
    }
```

Depois das fontes, vem o código do jogo — ou seja, a ROM.
Criaremos um método responsável por isso (a lógica é a mesma das fontes, mas começando no endereço `0x200`):

```js
loadROMInRAM(romContent: Buffer) {
    this.loadFontsInRAM();
    for (let i = 0; i < romContent.length; i++) {
        this.RAM[0x200 + i] = romContent[i];
    }
}
```
Primeiro, ele garante que as fontes sejam carregadas chamando `loadFontsInRAM()`.
Depois, copia o conteúdo do jogo (a ROM) para a memória, começando no endereço `0x200`.

Pronto! Agora temos nossa memória definida:

```js
export class Memory {
    private RAM: Uint8Array;
    private fonts: Uint8Array;

    constructor() {
        this.RAM = new Uint8Array(4096);
        this.fonts = new Uint8Array([
            0xF0, 0x90, 0x90, 0x90, 0xF0,	//0
            0x20, 0x60, 0x20, 0x20, 0x70,	//1
            0x60, 0x90, 0x20, 0x40, 0xF0,	//2
            0xF0, 0x10, 0xF0, 0x10, 0xF0,	//3
            0x90, 0x90, 0xF0, 0x10, 0x10,	//4
            0xF0, 0x80, 0x60, 0x10, 0xE0,	//5
            0xF0, 0x80, 0xF0, 0x90, 0xF0,	//6
            0xF0, 0x10, 0x10, 0x10, 0x10,	//7
            0xF0, 0x90, 0xF0, 0x90, 0xF0,	//8
            0xF0, 0x90, 0xF0, 0x10, 0x10,	//9
            0x60, 0x90, 0xF0, 0x90, 0x90,	//A
            0xE0, 0x90, 0xE0, 0x90, 0xE0,	//B
            0x70, 0x80, 0x80, 0x80, 0x70,	//C
            0xE0, 0x90, 0x90, 0x90, 0xE0,	//D
            0xF0, 0x80, 0xF0, 0x80, 0xF0,	//E
            0xF0, 0x80, 0xF0, 0x80, 0x80	//F
        ]);
    }

    getByte(address: number): number {
        return this.RAM[address];
    }

    setByte(address: number, value: number): void {
        this.RAM[address] = value;
    }
    
    loadFontsInRAM() {
        for (let i = 0; i < this.fonts.length; i++)
            this.RAM[0x050 + i] = this.fonts[i];
    }

    loadROMInRAM(romContent: Buffer) {
        this.loadFontsInRAM();

        for (let i = 0; i < romContent.length; i++) {
            this.RAM[0x200 + i] = romContent[i];
        }
    }

}
```












