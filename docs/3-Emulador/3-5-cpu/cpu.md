# CPU do Emulador CHIP-8

A CPU é o coração do emulador CHIP-8. Ela é responsável por executar as instruções das ROMs, gerenciar os registradores, controlar os timers e coordenar todos os componentes do sistema (memória, display, teclado e áudio).

Para reproduzir isso em TypeScript, criamos uma classe `CPU` que implementa o ciclo fetch-decode-execute, onde busca instruções da memória, decodifica o que cada instrução significa e executa a operação correspondente. Esse ciclo se repete continuamente, permitindo que os jogos e programas CHIP-8 funcionem.

## 1) Estrutura da CPU

A CPU do CHIP-8 possui vários componentes importantes que trabalham juntos para executar as instruções:

### a) Registradores de Propósito Geral - `V`

```ts
private V: Uint8Array;
```

O CHIP-8 possui 16 registradores de propósito geral, chamados de V0 a VF. Cada um pode armazenar um valor de 8 bits (0 a 255). Eles são usados para armazenar dados temporários durante a execução das instruções.

Inicializamos o array no construtor:

```ts
this.V = new Uint8Array(16);
```

O registrador VF é especial: além de ser um registrador normal, ele também é usado como flag de carry em operações aritméticas e flag de colisão em operações de desenho.

### b) Program Counter - `PC`

```ts
private PC: number;
```

O Program Counter (PC) é um registrador que aponta para o endereço da memória onde está a próxima instrução a ser executada. No CHIP-8, as ROMs começam no endereço 0x200 (512 em decimal), então inicializamos o PC nesse valor:

```ts
this.PC = 0x200;
```

A cada instrução executada, o PC é incrementado em 2 bytes (uma instrução CHIP-8 tem 16 bits = 2 bytes), a menos que a instrução seja um desvio (jump) ou chamada de subrotina, que modificam o PC diretamente.

### c) Registrador de Índice - `I`

```ts
private I: number;
```

O registrador I é usado para armazenar endereços de memória. Ele tem 16 bits e pode armazenar valores de 0 a 4095 (0xFFF). É usado principalmente para:
- Apontar para sprites na memória (instrução de desenho)
- Apontar para locais na memória onde dados serão salvos ou carregados
- Apontar para fontes de caracteres

### d) Stack e Stack Pointer - `Stack` e `SP`

```ts
private Stack: Uint16Array;
private SP: number;
```

O Stack (pilha) é uma estrutura de dados usada para armazenar endereços de retorno quando subrotinas são chamadas. O CHIP-8 tem uma pilha de 16 níveis, o que significa que podemos ter até 16 chamadas de subrotina aninhadas.

O Stack Pointer (SP) aponta para a próxima posição livre na pilha. Quando uma subrotina é chamada, o endereço de retorno (PC + 2) é salvo na pilha e o SP é incrementado. Quando a subrotina retorna, o SP é decrementado e o PC é restaurado com o valor salvo.

Inicializamos ambos no construtor:

```ts
this.Stack = new Uint16Array(16);
this.SP = 0;
```

### e) Timers - `delayTimer` e `soundTimer`

```ts
private delayTimer: number;
private soundTimer: number;
```

O CHIP-8 possui dois timers que decrementam automaticamente a 60 Hz (60 vezes por segundo):
- **delayTimer**: Usado para criar delays no programa. Pode ser lido e escrito pelas instruções.
- **soundTimer**: Quando maior que zero, ativa o beep do áudio. Quando chega a zero, o beep para.

Ambos são inicializados em zero:

```ts
this.delayTimer = 0;
this.soundTimer = 0;
```

### f) Componentes do Sistema

A CPU também mantém referências para os outros componentes do emulador:

```ts
private memory: Memory;
private display: Display;
private keyboard: Keyboard;
private audio: Audio;
```

Esses componentes são passados no construtor e permitem que a CPU interaja com a memória, tela, teclado e áudio durante a execução das instruções.

### g) Constantes de Tela

```ts
private readonly SCREEN_WIDTH: number = 64;
private readonly SCREEN_HEIGHT: number = 32;
```

Essas constantes definem as dimensões da tela do CHIP-8: 64 pixels de largura por 32 pixels de altura. São usadas principalmente na instrução de desenho de sprites para verificar limites e aplicar clipping quando necessário.

### h) Variáveis Auxiliares

```ts
private aux_value: number;
private lastDrawTime: number = 0;
private readonly DRAW_INTERVAL_MS: number = 1000 / 60;
```

A CPU possui algumas variáveis auxiliares importantes:

- **aux_value**: Usado para armazenar valores temporários durante operações aritméticas, especialmente em subtrações onde precisamos verificar se houve borrow antes de aplicar a máscara de 8 bits.

- **lastDrawTime**: Armazena o timestamp da última vez que um sprite foi desenhado. É usado para limitar a taxa de desenho a 60 FPS, evitando flicker excessivo.

- **DRAW_INTERVAL_MS**: Define o intervalo mínimo entre desenhos (aproximadamente 16.67ms, que é 1000/60). Isso garante que a tela não seja atualizada mais de 60 vezes por segundo, mesmo que a CPU execute muitas instruções por segundo.

### i) Construtor

O construtor da CPU inicializa todos os componentes e registradores:

```ts
constructor(memory: Memory, display: Display, keyboard: Keyboard, quirks?: Partial<Chip8Quirks>) {
    this.memory = memory;
    this.V = new Uint8Array(16);
    this.Stack = new Uint16Array(16);
    this.display = display;
    this.aux_value = 0;

    this.PC = 0x200;
    this.I = 0;
    this.SP = 0;

    this.delayTimer = 0;
    this.soundTimer = 0;
    this.keyboard = keyboard;
    this.audio = new Audio();

    this.quirks = {
        memoryIncrement: false,
        shiftLegacy: false,
        clipping: false,
        vfReset: false,
        jumpWithVx: false,
        ...quirks,
    };
    this.lastDrawTime = performance.now() - this.DRAW_INTERVAL_MS;
    
    this.startTimers();
}
```

O construtor recebe os componentes principais (memória, display e teclado) e um parâmetro opcional `quirks` para configurar os comportamentos de compatibilidade. Ele inicializa todos os registradores, timers e variáveis auxiliares, configura os quirks com valores padrão (que podem ser sobrescritos pelo parâmetro `quirks`), e inicia os timers que decrementam automaticamente a 60 Hz.

O `lastDrawTime` é inicializado com um valor negativo do intervalo de desenho para garantir que o primeiro sprite possa ser desenhado imediatamente.

## 2) Ciclo de Execução

O ciclo fetch-decode-execute é o coração da CPU. Ele se repete continuamente, executando uma instrução por vez:

### a) `fetch()` - Buscar Instrução

```ts
fetch() {
    const msb = this.memory.getByte(this.PC);
    const lsb = this.memory.getByte(this.PC + 1);
    const opcode = msb << 8 | lsb
    return opcode;
}
```

O método `fetch()` busca a instrução atual da memória. Como cada instrução CHIP-8 tem 16 bits (2 bytes), lemos dois bytes consecutivos:
- `msb` (most significant byte): o byte mais significativo (primeiro byte)
- `lsb` (least significant byte): o byte menos significativo (segundo byte)

Combinamos os dois bytes usando operações bitwise: deslocamos o msb 8 bits para a esquerda (`<< 8`) e fazemos um OR com o lsb, criando o opcode completo de 16 bits.

### b) `decode()` - Decodificar Instrução

```ts
decode(opcode: number) {
    return Disassembler.decode(opcode)
}
```

O método `decode()` usa o Disassembler para transformar o opcode bruto em uma estrutura com informações sobre a instrução, como o nome, os registradores envolvidos e os valores imediatos. Isso facilita a execução da instrução.

A decodificação envolve extrair os diferentes componentes do opcode de 16 bits:
- **x, y**: Registradores (4 bits cada, extraídos dos nibbles do opcode)
- **n**: Nibble (4 bits, geralmente usado para altura de sprites)
- **kk**: Byte (8 bits, valor imediato)
- **nnn**: Endereço (12 bits, usado para jumps e chamadas)

O Disassembler analisa o opcode e identifica qual instrução ele representa, extraindo esses parâmetros e criando uma estrutura que facilita a execução.

> **Nota**: Para compreender em detalhe a decodificação de cada opcode e suas especificações, recomenda-se consultar o [Cowgod’s Chip-8 Technical Reference v1.0](http://devernay.free.fr/hacks/chip8/C8TECH10.HTM)
, um guia técnico completo elaborado por Thomas P. Greene que documenta todas as instruções padrão do CHIP-8, descrevendo seus parâmetros, comportamento e funcionamento esperado.


## 3) Quirks - Compatibilidade na Decodificação

Os "quirks" são configurações que permitem o emulador se comportar como diferentes versões do CHIP-8. Diferentes implementações históricas tinham comportamentos ligeiramente diferentes, e os quirks permitem escolher qual comportamento usar. 
> **Nota:** Para entender melhor os quirks e as diferenças entre diferentes implementações do CHIP-8, consulte a [CHIP-8 Variant Opcode Table](https://chip8.gulrak.net). Neste projeto, essa funcionalidade foi incluída porque algumas ROMs de teste utilizadas para verificar a fidelidade do emulador não seguem os quirks tradicionais do sistema original. Dessa forma, para garantir a máxima compatibilidade com o CHIP-8 autêntico e, ao mesmo tempo, permitir o uso das ROMs de teste atuais, optou-se por tornar os quirks configuráveis.

A interface `Chip8Quirks` define todos os quirks disponíveis:

```ts
export interface Chip8Quirks {
    memoryIncrement: boolean;
    shiftLegacy: boolean;
    clipping: boolean;
    vfReset: boolean;
    jumpWithVx: boolean;
}
```

Cada quirk é um booleano que ativa ou desativa um comportamento específico. A CPU armazena esses quirks em uma propriedade privada:

```ts
private quirks: Chip8Quirks;
```

Vamos entender cada quirk em detalhes:

### 3.1) **memoryIncrement** - Incremento do Registrador I

Quando ativado, o registrador I é incrementado durante as operações de load/store (FX55 e FX65). Isso reflete o comportamento dos intérpretes CHIP-8 da década de 1970, como o COSMAC VIP.

> Para lembrar das instruções do CHIP-8, clique [**AQUI**](../../2-Arquitetura/Decodificacao_opcode.md#lista-total-de-instruções)

**Comportamento padrão (memoryIncrement = false):**
```ts
case "STORE_V0_TO_VX_AT_I":
    for (let i = 0; i <= instruction.x; i++) {
        this.memory.setByte(this.I + i, this.V[i]);
    }
    break;
```

O registrador I permanece inalterado. Os registradores são salvos em posições consecutivas começando em I.

**Comportamento legado (memoryIncrement = true):**
```ts
case "STORE_V0_TO_VX_AT_I":
    if (this.quirks.memoryIncrement) {
        for (let i = 0; i <= instruction.x; i++) {
            this.memory.setByte(this.I, this.V[i]);
            this.I = (this.I + 1) & 0xFFF;
        }
    }
    break;
```

O registrador I é incrementado a cada byte salvo ou carregado, avançando através da memória durante a operação.

### 3.2) **shiftLegacy** - Operação de Shift Legada

Quando ativado, as operações de shift (8XY6 e 8XYE) usam VY em vez de VX como valor a ser deslocado. Isso reflete o comportamento do COSMAC VIP original.

**Comportamento padrão (shiftLegacy = false):**
```ts
case "SHIFT_VX_RIGHT": {
    const valueToShift = this.V[instruction.x];
    const shiftedValue = valueToShift >> 1;
    this.V[instruction.x] = shiftedValue & 0xFF;
    break;
}
```

O valor em VX é deslocado e o resultado é armazenado em VX.

**Comportamento legado (shiftLegacy = true):**
```ts
case "SHIFT_VX_RIGHT": {
    const originalVx = this.V[instruction.x];
    const originalVy = this.V[instruction.y];
    const valueToShift = this.quirks.shiftLegacy ? originalVy : originalVx;
    const shiftedValue = valueToShift >> 1;
    this.V[instruction.x] = shiftedValue & 0xFF;
    break;
}
```

O valor em VY é deslocado e o resultado é armazenado em VX. Isso significa que VY é copiado para VX antes do deslocamento.

### 3.3) **clipping** - Clipping de Sprites

Quando ativado, os sprites são cortados na borda da tela em vez de fazer wrap-around. Isso evita que sprites ultrapassem as bordas e reapareçam do outro lado.

**Comportamento padrão (clipping = false):**
```ts
const xPos = this.wrapCoordinate(baseX + col, this.SCREEN_WIDTH);
const yPos = this.wrapCoordinate(baseY + row, this.SCREEN_HEIGHT);
```

Os sprites fazem wrap-around usando a função `wrapCoordinate()`, que garante que coordenadas fora da tela sejam ajustadas para aparecer do outro lado.

**Comportamento com clipping (clipping = true):**
```ts
if (this.quirks.clipping) {
    if (yPosRaw >= this.SCREEN_HEIGHT) {
        break; // Para de desenhar se sair da tela
    }
    if (xPosRaw >= this.SCREEN_WIDTH) {
        continue; // Pula pixels que saem da tela
    }
}
const xPos = xPosRaw;
const yPos = yPosRaw;
```

Os sprites são cortados na borda da tela. Pixels que sairiam da tela não são desenhados.

### 3.4) **vfReset** - Reset de VF em Operações Lógicas

Quando ativado, o registrador VF é zerado antes das operações lógicas (OR, AND, XOR). Isso reflete o comportamento do COSMAC VIP original.

**Comportamento padrão (vfReset = false):**
```ts
case "SET_VX_TO_VX_OR_VY": {
    this.V[instruction.x] = (vxValue | vyValue) & 0xFF;
    break;
}
```

O registrador VF não é modificado durante operações lógicas.

**Comportamento legado (vfReset = true):**
```ts
case "SET_VX_TO_VX_OR_VY": {
    this.V[instruction.x] = (vxValue | vyValue) & 0xFF;
    if (this.quirks.vfReset) {
        this.V[0xF] = 0;
    }
    break;
}
```

O registrador VF é zerado antes da operação lógica, garantindo que não contenha valores residuais de operações anteriores.

### 3.5) **jumpWithVx** - Salto com VX em vez de V0

Quando ativado, a instrução BNNN usa VX (onde X é o primeiro nibble do opcode) em vez de V0 como offset. Isso reflete o comportamento de variantes como CHIP-48 e SUPER-CHIP.

**Comportamento padrão (jumpWithVx = false):**
```ts
case "JUMP_TO_V0_PLUS_NNN":
    this.PC = (instruction.nnn + this.V[0]) & 0xFFF;
    break;
```

A instrução BNNN salta para o endereço NNN + V0.

**Comportamento legado (jumpWithVx = true):**
```ts
case "JUMP_TO_V0_PLUS_NNN":
    if (this.quirks.jumpWithVx) {
        this.PC = (instruction.nnn + this.V[instruction.x]) & 0xFFF;
    } else {
        this.PC = (instruction.nnn + this.V[0]) & 0xFFF;
    }
    break;
```

A instrução BNNN salta para o endereço NNN + VX, onde X é extraído do opcode.

## 4) `step()` - Executar um Ciclo

```ts
step() {
    try {
        const opcode = this.fetch();
        const instruction = this.decode(opcode);
        this.execute(instruction);
        // Instruções de desvio já modificam PC, então não incrementamos aqui
        if (!this.isJumpInstruction(instruction.name)) {
            this.PC += 2;
        }
    } catch (error) {
        console.error("Erro na execução da instrução:", error);
    }
}
```

O método `step()` executa um ciclo completo: busca a instrução, decodifica e executa. Depois, incrementa o PC em 2 bytes para apontar para a próxima instrução, a menos que a instrução seja um desvio (jump, call, return, skip), que já modificam o PC diretamente.

Usamos um bloco `try-catch` para capturar erros durante a execução, permitindo que o emulador continue funcionando mesmo se uma instrução falhar.

O método `step()` também verifica se a instrução é um desvio usando o método auxiliar `isJumpInstruction()`:

```ts
private isJumpInstruction(instructionName: string): boolean {
    return [
        "JUMP_TO_NNN", 
        "CALL_SUBROUTINE_NNN", 
        "RETURN", 
        "JUMP_TO_V0_PLUS_NNN",
        "SKIP_IF_VX_EQUALS_KK", 
        "SKIP_IF_VX_NOT_EQUALS_KK", 
        "SKIP_IF_VX_EQUALS_VY", 
        "SKIP_IF_VX_NOT_EQUALS_VY", 
        "SKIP_IF_KEY_VX_PRESSED", 
        "SKIP_IF_KEY_VX_NOT_PRESSED",
        "WAIT_FOR_KEY_PRESS",
        "DRAW_SPRITE_VX_VY_N"
    ].includes(instructionName);
}
```

Esse método verifica se a instrução já modificou o PC diretamente. Se sim, não incrementamos o PC novamente em `step()`, evitando pular instruções incorretamente.

### d) `execute()` - Executar Instrução

O método `execute()` é um grande `switch` que executa a instrução decodificada. Cada caso do switch corresponde a uma instrução diferente do CHIP-8. 

> **Nota:** Para entender detalhadamente cada instrução e suas especificações completas, consulte a [Cowgod's Chip-8 Technical Reference](http://devernay.free.fr/hacks/chip8/C8TECH10.HTM) e o [Guide to making a CHIP-8 emulator](https://tobiasvl.github.io/blog/write-a-chip-8-emulator/). Esses guias fornecem informações detalhadas sobre cada instrução, incluindo seus opcodes, parâmetros e comportamento esperado.

Vamos ver algumas categorias principais:

#### Instruções de Controle de Fluxo

Instruções como `JUMP_TO_NNN`, `CALL_SUBROUTINE_NNN` e `RETURN` controlam o fluxo de execução do programa:

```ts
// 1nnn
case "JUMP_TO_NNN":
    this.PC = instruction.nnn;
    break;

// 2nnn
case "CALL_SUBROUTINE_NNN": 
    this.Stack[this.SP++] = this.PC + 2;
    this.PC = instruction.nnn;
    break;

case "RETURN":
    if (this.SP > 0) {
        this.SP--;
        this.PC = this.Stack[this.SP];
    }
    break;
```

#### Instruções Aritméticas

Instruções como `ADD_VY_TO_VX_WITH_CARRY` e `SUBTRACT_VY_FROM_VX` realizam operações matemáticas. Para detalhes completos sobre essas instruções, consulte a [Cowgod's Chip-8 Technical Reference - Instruções Aritméticas](http://devernay.free.fr/hacks/chip8/C8TECH10.HTM):

```ts
// 8xy4
case "ADD_VY_TO_VX_WITH_CARRY":
    // VF = 1 se houve carry (soma > 255), 0 caso contrário
    const sum = this.V[instruction.x] + this.V[instruction.y];
    this.V[instruction.x] = sum & 0xFF;
    this.V[0xF] = sum > 255 ? 1 : 0;
    break;
```

O `& 0xFF` garante que o resultado fique dentro do range de 8 bits (0-255), descartando qualquer bit além do 8º.

#### Instruções de Desenho

A instrução `DRAW_SPRITE_VX_VY_N` desenha sprites na tela. Para detalhes completos sobre esta instrução, consulte a [Cowgod's Chip-8 Technical Reference - Instrução de Desenho](http://devernay.free.fr/hacks/chip8/C8TECH10.HTM):

```ts
// Dxyn - DRAW_SPRITE com clipping configurável e Display Wait
case "DRAW_SPRITE_VX_VY_N":
    // Limita desenho a 60 FPS para evitar flicker
    const now = performance.now();
    const timeSinceLastDraw = now - this.lastDrawTime;
    
    if (timeSinceLastDraw < this.DRAW_INTERVAL_MS) {
        return;
    }
    
    this.lastDrawTime = now;
    
    // VF = 1 se algum pixel foi apagado (colisão)
    this.V[0xF] = 0;
    
    const baseX = this.wrapCoordinate(this.V[instruction.x], this.SCREEN_WIDTH);
    const baseY = this.wrapCoordinate(this.V[instruction.y], this.SCREEN_HEIGHT);
    
    for (let row = 0; row < instruction.n; row++) {
        const sprite = this.memory.getByte(this.I + row);
        // ... desenha cada linha do sprite
    }
    break;
```

Essa instrução lê dados do sprite da memória (começando no endereço I), desenha na posição (VX, VY) e define VF como 1 se houve colisão (pixel apagado).

#### Instruções de Teclado

Instruções que interagem com o teclado do CHIP-8:

```ts
// Ex9E
case "SKIP_IF_KEY_VX_PRESSED":
    if (this.keyboard.keyIsPressed(this.V[instruction.x])) {
        this.PC += 4;
    } else {
        this.PC += 2;
    }
    break;

// ExA1
case "SKIP_IF_KEY_VX_NOT_PRESSED":
    if (!this.keyboard.keyIsPressed(this.V[instruction.x])) {
        this.PC += 4;
    } else {
        this.PC += 2;
    }
    break;

// Fx0A
case "WAIT_FOR_KEY_PRESS":    
    // Bloqueia até uma tecla ser pressionada e solta
    // Se não houver tecla pronta, não incrementa PC (repetirá a instrução)
    let historyOfKeysPressed = this.keyboard.getHistoryOfKeysPressed();
    
    if (historyOfKeysPressed.length > 0) {
        const lastKey = historyOfKeysPressed[historyOfKeysPressed.length - 1];
        const keyCode = this.keyboard.getKeyMapping().get(lastKey);
        
        if (keyCode !== undefined && this.keyboard.isKeyPressReleaseCycleComplete(lastKey)) {
            this.V[instruction.x] = keyCode;
            this.keyboard.clearHistory();
            this.keyboard.clearKeyPressReleaseCycle(lastKey);
            this.PC += 2;
        }
    }
    break;
```

Essas instruções verificam o estado do teclado e pulam instruções ou aguardam entrada do usuário. A instrução `WAIT_FOR_KEY_PRESS` é especial porque bloqueia a execução até que uma tecla seja pressionada e solta, não incrementando o PC até que isso aconteça.

#### Instruções de Timer

Instruções que interagem com os timers do CHIP-8:

```ts
// Fx07
case "SET_VX_TO_DELAY_TIMER":
    this.V[instruction.x] = this.delayTimer;
    break;

// Fx15
case "SET_DELAY_TIMER_TO_VX":
    this.delayTimer = this.V[instruction.x];
    break;

// Fx18
case "SET_SOUND_TIMER_TO_VX":
    this.soundTimer = this.V[instruction.x];
    break;
```

Essas instruções permitem ler e escrever os valores dos timers. O `delayTimer` pode ser lido e escrito, enquanto o `soundTimer` pode ser escrito para ativar o beep.

#### Instruções de Memória e Índice

Instruções que manipulam o registrador I e a memória:

```ts
// Annn
case "SET_I_TO_NNN":
    this.I = instruction.nnn;
    break;

// Fx1E
case "ADD_VX_TO_I":
    this.I = (this.I + this.V[instruction.x]) & 0xFFF;
    break;

// Fx29
case "SET_I_TO_FONT_VX":
    // Fontes começam em 0x050, cada dígito ocupa 5 bytes
    this.I = 0x050 + (this.V[instruction.x] * 5);
    break;

// Fx33
case "STORE_BCD_VX_AT_I":
    // Converte valor em BCD (Binary Coded Decimal): centenas, dezenas, unidades
    const value = this.V[instruction.x];
    this.memory.setByte(this.I, Math.floor(value / 100));
    this.memory.setByte(this.I + 1, Math.floor((value % 100) / 10));
    this.memory.setByte(this.I + 2, value % 10);
    break;
```

Essas instruções manipulam o registrador I e permitem salvar valores em BCD (Binary Coded Decimal) na memória. A instrução `SET_I_TO_FONT_VX` é especialmente importante, pois aponta I para o endereço da fonte do caractere hexadecimal armazenado em VX.

#### Instruções de Load/Store

Instruções que salvam e carregam registradores da memória:

```ts
// Fx55
case "STORE_V0_TO_VX_AT_I":
    // Quirk: versões antigas incrementavam I durante o loop
    if (this.quirks.memoryIncrement) {
        for (let i = 0; i <= instruction.x; i++) {
            this.memory.setByte(this.I, this.V[i]);
            this.I = (this.I + 1) & 0xFFF;
        }
    } else {
        for (let i = 0; i <= instruction.x; i++) {
            this.memory.setByte(this.I + i, this.V[i]);
        }
    }
    break;

// Fx65
case "LOAD_V0_TO_VX_FROM_I":
    // Quirk: versões antigas incrementavam I durante o loop
    if (this.quirks.memoryIncrement) {
        for (let i = 0; i <= instruction.x; i++) {
            this.V[i] = this.memory.getByte(this.I);
            this.I = (this.I + 1) & 0xFFF;
        }
    } else {
        for (let i = 0; i <= instruction.x; i++) {
            this.V[i] = this.memory.getByte(this.I + i);
        }
    }
    break;
```

Essas instruções salvam ou carregam os registradores V0 até VX da memória, começando no endereço armazenado em I. O comportamento depende do quirk `memoryIncrement`.

#### Instruções de Operações Lógicas e Bitwise

Instruções que realizam operações lógicas e bitwise:

```ts
// 8xy1
case "SET_VX_TO_VX_OR_VY": {
    const vxValue = this.V[instruction.x];
    const vyValue = this.V[instruction.y];
    this.V[instruction.x] = (vxValue | vyValue) & 0xFF;
    // Quirk: COSMAC VIP zerava VF antes das operações lógicas
    if (this.quirks.vfReset) {
        this.V[0xF] = 0;
    }
    break;
}

// 8xy2
case "SET_VX_TO_VX_AND_VY": {
    const vxValue = this.V[instruction.x];
    const vyValue = this.V[instruction.y];
    this.V[instruction.x] = (vxValue & vyValue) & 0xFF;
    // Quirk: COSMAC VIP zerava VF antes das operações lógicas
    if (this.quirks.vfReset) {
        this.V[0xF] = 0;
    }
    break;
}

// 8xy3
case "SET_VX_TO_VX_XOR_VY": {
    const vxValue = this.V[instruction.x];
    const vyValue = this.V[instruction.y];
    this.V[instruction.x] = (vxValue ^ vyValue) & 0xFF;
    // Quirk: COSMAC VIP zerava VF antes das operações lógicas
    if (this.quirks.vfReset) {
        this.V[0xF] = 0;
    }
    break;
}
```

Essas instruções realizam operações lógicas bitwise (OR, AND, XOR) entre VX e VY, armazenando o resultado em VX. O resultado é limitado a 8 bits usando `& 0xFF`.

#### Instruções de Operações com Valores Imediatos

Instruções que trabalham com valores imediatos (constantes):

```ts
// 6xkk
case "SET_VX_TO_KK":
    this.V[instruction.x] = instruction.kk;
    break;

// 7xkk
case "ADD_KK_TO_VX":
    this.V[instruction.x] = (this.V[instruction.x] + instruction.kk) & 0xFF;
    break;

// Cxkk
case "SET_VX_TO_RANDOM_AND_KK":
    this.V[instruction.x] = (Math.floor(Math.random() * 256)) & instruction.kk;
    break;
```

Essas instruções trabalham com valores imediatos (kk), que são bytes de 8 bits extraídos diretamente do opcode. A instrução `SET_VX_TO_RANDOM_AND_KK` gera um número aleatório e faz um AND com o valor kk, útil para criar aleatoriedade nos jogos.

#### Instruções de Comparação e Skip

Instruções que comparam valores e pulam instruções condicionalmente:

```ts
// 3xkk
case "SKIP_IF_VX_EQUALS_KK":
    if (this.V[instruction.x] === instruction.kk) {
        this.PC += 4;
    } else {
        this.PC += 2;
    }
    break;

// 4xkk
case "SKIP_IF_VX_NOT_EQUALS_KK":
    if (this.V[instruction.x] !== instruction.kk) {
        this.PC += 4;
    } else {
        this.PC += 2
    }
    break;

// 5xy0
case "SKIP_IF_VX_EQUALS_VY":
    if (this.V[instruction.x] === this.V[instruction.y]) {
        this.PC += 4;
    } else {
        this.PC += 2; 
    }
    break;

// 9xy0
case "SKIP_IF_VX_NOT_EQUALS_VY":
    if (this.V[instruction.x] !== this.V[instruction.y]) {
        this.PC += 4; 
    } else {
        this.PC += 2; 
    }
    break;
```

Essas instruções comparam valores e pulam a próxima instrução (incrementando PC em 4 em vez de 2) se a condição for verdadeira. Isso permite criar estruturas condicionais no código CHIP-8.

#### Instruções de Operações com Registradores

Instruções que copiam valores entre registradores:

```ts
// 8xy0
case "SET_VX_TO_VY":
    this.V[instruction.x] = this.V[instruction.y];
    break;
```

Essa instrução simplesmente copia o valor de VY para VX.

#### Instruções de Subtração

Instruções que realizam subtrações:

```ts
// 8xy5
case "SUBTRACT_VY_FROM_VX":
    // VF = 1 se não houve borrow (VX >= VY), 0 caso contrário
    this.aux_value = this.V[instruction.x] - this.V[instruction.y];
    this.V[instruction.x] = this.aux_value & 0xFF;
    this.V[0xF] = this.aux_value < 0 ? 0 : 1;
    break;

// 8xy7
case "SET_VX_TO_VY_MINUS_VX":
    // VF = 1 se não houve borrow (VY >= VX), 0 caso contrário
    this.aux_value = this.V[instruction.y] - this.V[instruction.x];
    this.V[instruction.x] = this.aux_value & 0xFF;
    this.V[0xF] = this.aux_value < 0 ? 0 : 1;
    break;
```

Essas instruções realizam subtrações e definem VF como flag de borrow. A primeira subtrai VY de VX, enquanto a segunda subtrai VX de VY.

#### Instruções de Shift

Instruções que deslocam bits:

```ts
// 8xy6 - SHIFT_VX_RIGHT
case "SHIFT_VX_RIGHT": {
    const originalVx = this.V[instruction.x];
    const originalVy = this.V[instruction.y];
    // Quirk: versões antigas usavam VY em vez de VX
    const valueToShift = this.quirks.shiftLegacy ? originalVy : originalVx;
    const shiftedValue = valueToShift >> 1;
    const lsb = valueToShift & 0x1;

    this.V[instruction.x] = shiftedValue & 0xFF;
    this.V[0xF] = lsb;
    break;
}

// 8xyE - SHIFT_VX_LEFT
case "SHIFT_VX_LEFT": {
    const originalVx = this.V[instruction.x];
    const originalVy = this.V[instruction.y];
    // Quirk: versões antigas usavam VY em vez de VX
    const valueToShift = this.quirks.shiftLegacy ? originalVy : originalVx;
    const msb = (valueToShift & 0x80) >> 7;
    const shiftedValue = (valueToShift << 1) & 0xFF;

    this.V[instruction.x] = shiftedValue;
    this.V[0xF] = msb;
    break;
}
```

Essas instruções deslocam os bits de um valor para a direita ou esquerda. O bit menos significativo (LSB) ou mais significativo (MSB) é salvo em VF antes do deslocamento.

#### Instruções de Sistema

Instruções que controlam o sistema:

```ts
case "SYSTEM_CALL":
    // Ignorado
    break;

case "CLEAR_SCREEN":
    this.display.cleanDisplay();
    break;
```

A instrução `SYSTEM_CALL` (0NNN) era usada para chamar código de máquina no COSMAC VIP original, mas é ignorada em emuladores modernos. A instrução `CLEAR_SCREEN` (00E0) limpa a tela, apagando todos os pixels.

## 5) Timers

Os timers são decrementados automaticamente a 60 Hz através do método `startTimers()`:

```ts
startTimers() {
    setInterval(() => {
        if (this.delayTimer > 0) {
            this.delayTimer--;
        }
        // soundTimer controla o beep: inicia quando > 0, para quando chega a 0
        if (this.soundTimer > 0) {
            if (!this.audio.isPlaying()) {
                this.audio.startBeep();
            }
            this.soundTimer--;
        } else if (this.audio.isPlaying()) {
            this.audio.stopBeep();
        }
    }, 1000 / 60)
}
```

O timer roda a cada 16.67ms (1000/60), que é aproximadamente 60 vezes por segundo. Quando o `soundTimer` é maior que zero, o beep é iniciado se ainda não estiver tocando. Quando chega a zero, o beep é parado.

## 6) Métodos Auxiliares

A CPU possui vários métodos auxiliares importantes:

### a) `reset()` - Reiniciar a CPU

```ts
reset() {
    // ROMs começam em 0x200 (512 em decimal)
    this.PC = 0x200;
    this.I = 0;
    this.SP = 0;
    this.V.fill(0);
    this.Stack.fill(0);
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.audio.stopBeep();
    this.display.cleanDisplay();
}
```

O método `reset()` restaura a CPU ao estado inicial, zerando todos os registradores, timers e limpando a tela. É usado quando o usuário quer reiniciar o emulador.

### b) `getState()` - Obter Estado da CPU

```ts
public getState() {
    return {
        V: Array.from(this.V),
        I: this.I,
        PC: this.PC,
        SP: this.SP,
        Stack: Array.from(this.Stack),
        delayTimer: this.delayTimer,
        soundTimer: this.soundTimer,
    };
}
```

Esse método retorna o estado atual da CPU, útil para debug e visualização do estado interno do emulador.

### c) `wrapCoordinate()` - Wrap-around de Coordenadas

```ts
private wrapCoordinate(value: number, size: number): number {
    let result = value % size;
    if (result < 0) {
        result += size;
    }
    return result;
}
```

Esse método garante que coordenadas fiquem dentro dos limites da tela, fazendo wrap-around quando necessário. É usado no desenho de sprites quando o quirk de clipping está desabilitado.

### d) `run()` - Executar Múltiplos Ciclos

```ts
run() {
    for (let i = 0; i < 100; i++) {
        this.step();
    }
}
```

O método `run()` executa 100 ciclos de instruções de uma vez. É útil para executar múltiplas instruções em sequência sem precisar chamar `step()` repetidamente. No entanto, no emulador atual, esse método não é usado diretamente pela interface do usuário, que chama `step()` individualmente para ter mais controle sobre a execução.

### e) `resumeAudio()` - Retomar Áudio

```ts
public resumeAudio() {
    this.audio.resume();
}
```

O método `resumeAudio()` retoma o contexto de áudio, necessário porque muitos navegadores bloqueiam a reprodução automática de áudio até que o usuário interaja com a página. É chamado quando o usuário inicia o emulador ou carrega uma ROM, garantindo que o som funcione corretamente.

## 7) Gerenciamento de Quirks

A CPU possui métodos para gerenciar os quirks de compatibilidade definidos na interface `Chip8Quirks`. Esses métodos permitem que o usuário configure os quirks para compatibilidade com diferentes versões do CHIP-8.

### a) Métodos de Configuração Individual

Cada quirk possui métodos específicos para ativar/desativar e consultar seu estado:

```ts
public setMemoryIncrementMode(enabled: boolean) {
    this.updateQuirks({ memoryIncrement: enabled });
}

public getMemoryIncrementMode(): boolean {
    return this.quirks.memoryIncrement;
}

public setShiftMode(enabled: boolean) {
    this.updateQuirks({ shiftLegacy: enabled });
}

public getShiftMode(): boolean {
    return this.quirks.shiftLegacy;
}

public setClippingMode(enabled: boolean) {
    this.updateQuirks({ clipping: enabled });
}

public getClippingMode(): boolean {
    return this.quirks.clipping;
}

public setVfResetMode(enabled: boolean) {
    this.updateQuirks({ vfReset: enabled });
}

public getVfResetMode(): boolean {
    return this.quirks.vfReset;
}

public setJumpWithVxMode(enabled: boolean) {
    this.updateQuirks({ jumpWithVx: enabled });
}

public getJumpWithVxMode(): boolean {
    return this.quirks.jumpWithVx;
}
```

Cada quirk possui um método `set` para configurá-lo e um método `get` para consultar seu estado atual.

### b) Métodos de Gerenciamento Geral

A CPU também possui métodos para gerenciar todos os quirks de uma vez:

```ts
public getQuirks(): Chip8Quirks {
    return { ...this.quirks };
}

public updateQuirks(partial: Partial<Chip8Quirks>) {
    this.quirks = { ...this.quirks, ...partial };
}
```

O método `getQuirks()` retorna uma cópia de todos os quirks atuais, permitindo consultar o estado completo. O método `updateQuirks()` permite atualizar múltiplos quirks de uma vez, usando um objeto parcial que contém apenas os quirks que devem ser modificados.

### c) Inicialização dos Quirks

Os quirks são inicializados no construtor com valores padrão:

```ts
this.quirks = {
    memoryIncrement: false,
    shiftLegacy: false,
    clipping: false,
    vfReset: false,
    jumpWithVx: false,
    ...quirks,
};
```

Por padrão, todos os quirks começam desativados (`false`), mas podem ser configurados através do parâmetro opcional `quirks` do construtor. Isso permite que diferentes instâncias da CPU tenham configurações diferentes de quirks.

Esses métodos garantem que o emulador possa se comportar como diferentes versões do CHIP-8, permitindo compatibilidade com ROMs que foram desenvolvidas para diferentes implementações históricas.

Este conjunto de componentes e métodos garante que a CPU funcione corretamente, executando as instruções das ROMs e coordenando todos os componentes do emulador CHIP-8.

## Trecho Completo

```ts
import { Disassembler, type IDecodedInstruction } from "./Disassembler";
import { Display } from "./Display";
import { Memory } from "./Memory";
import { Keyboard } from "./Keyboard";
import { Audio } from "./Audio";

export interface Chip8Quirks {
    memoryIncrement: boolean;
    shiftLegacy: boolean;
    clipping: boolean;
    vfReset: boolean;
    jumpWithVx: boolean;
}

export class CPU {
    private memory: Memory;
    private display: Display;
    private readonly SCREEN_WIDTH: number = 64;
    private readonly SCREEN_HEIGHT: number = 32;
    private V: Uint8Array;
    private Stack: Uint16Array;

    private aux_value: number;

    private PC: number;
    private I: number;
    private SP: number;

    private delayTimer: number;
    private soundTimer: number;

    private keyboard: Keyboard;
    private audio: Audio;

    private quirks: Chip8Quirks;

    private lastDrawTime: number = 0;
    private readonly DRAW_INTERVAL_MS: number = 1000 / 60;

    constructor(memory: Memory, display: Display, keyboard: Keyboard, quirks?: Partial<Chip8Quirks>) {
        this.memory = memory;
        this.V = new Uint8Array(16);
        this.Stack = new Uint16Array(16);
        this.display = display;
        this.aux_value = 0;

        this.PC = 0x200;
        this.I = 0;
        this.SP = 0;

        this.delayTimer = 0;
        this.soundTimer = 0;
        this.keyboard = keyboard;
        this.audio = new Audio();

        this.quirks = {
            memoryIncrement: false,
            shiftLegacy: false,
            clipping: false,
            vfReset: false,
            jumpWithVx: false,
            ...quirks,
        };
        this.lastDrawTime = performance.now() - this.DRAW_INTERVAL_MS;
        
        this.startTimers();
    }

    public getQuirks(): Chip8Quirks {
        return { ...this.quirks };
    }

    public updateQuirks(partial: Partial<Chip8Quirks>) {
        this.quirks = { ...this.quirks, ...partial };
    }

    public setMemoryIncrementMode(enabled: boolean) {
        this.updateQuirks({ memoryIncrement: enabled });
    }

    public getMemoryIncrementMode(): boolean {
        return this.quirks.memoryIncrement;
    }

    public setShiftMode(enabled: boolean) {
        this.updateQuirks({ shiftLegacy: enabled });
    }

    public getShiftMode(): boolean {
        return this.quirks.shiftLegacy;
    }

    public setClippingMode(enabled: boolean) {
        this.updateQuirks({ clipping: enabled });
    }

    public getClippingMode(): boolean {
        return this.quirks.clipping;
    }

    public setVfResetMode(enabled: boolean) {
        this.updateQuirks({ vfReset: enabled });
    }

    public getVfResetMode(): boolean {
        return this.quirks.vfReset;
    }

    public setJumpWithVxMode(enabled: boolean) {
        this.updateQuirks({ jumpWithVx: enabled });
    }

    public getJumpWithVxMode(): boolean {
        return this.quirks.jumpWithVx;
    }

    // Wrap-around de coordenadas: garante valores positivos mesmo com módulo negativo
    private wrapCoordinate(value: number, size: number): number {
        let result = value % size;
        if (result < 0) {
            result += size;
        }
        return result;
    }

    public resumeAudio() {
        this.audio.resume();
    }

    startTimers() {
        setInterval(() => {
            if (this.delayTimer > 0) {
                this.delayTimer--;
            }
            // soundTimer controla o beep: inicia quando > 0, para quando chega a 0
            if (this.soundTimer > 0) {
                if (!this.audio.isPlaying()) {
                    this.audio.startBeep();
                }
                this.soundTimer--;
            } else if (this.audio.isPlaying()) {
                this.audio.stopBeep();
            }
        }, 1000 / 60)
    }

    fetch() {
        const msb = this.memory.getByte(this.PC);
        const lsb = this.memory.getByte(this.PC + 1);
        const opcode = msb << 8 | lsb
        return opcode;
    }

    decode(opcode: number) {
        return Disassembler.decode(opcode)
    }

    step() {
        try {
            const opcode = this.fetch();
            const instruction = this.decode(opcode);
            this.execute(instruction);
            // Instruções de desvio já modificam PC, então não incrementamos aqui
            if (!this.isJumpInstruction(instruction.name)) {
                this.PC += 2;
            }
        } catch (error) {
            console.error("Erro na execução da instrução:", error);
        }
    }

    private isJumpInstruction(instructionName: string): boolean {
        return [
            "JUMP_TO_NNN", 
            "CALL_SUBROUTINE_NNN", 
            "RETURN", 
            "JUMP_TO_V0_PLUS_NNN",
            "SKIP_IF_VX_EQUALS_KK", 
            "SKIP_IF_VX_NOT_EQUALS_KK", 
            "SKIP_IF_VX_EQUALS_VY", 
            "SKIP_IF_VX_NOT_EQUALS_VY", 
            "SKIP_IF_KEY_VX_PRESSED", 
            "SKIP_IF_KEY_VX_NOT_PRESSED",
            "WAIT_FOR_KEY_PRESS",
            "DRAW_SPRITE_VX_VY_N"
        ].includes(instructionName);
    }

    run() {
        for (let i = 0; i < 100; i++) {
            this.step();
        }
    }

    reset() {
        // ROMs começam em 0x200 (512 em decimal)
        this.PC = 0x200;
        this.I = 0;
        this.SP = 0;
        this.V.fill(0);
        this.Stack.fill(0);
        this.delayTimer = 0;
        this.soundTimer = 0;
        this.audio.stopBeep();
        this.display.cleanDisplay();
    }

    public getState() {
        return {
            V: Array.from(this.V),
            I: this.I,
            PC: this.PC,
            SP: this.SP,
            Stack: Array.from(this.Stack),
            delayTimer: this.delayTimer,
            soundTimer: this.soundTimer,
        };
    }
        // Executar instrução
    execute(instruction: IDecodedInstruction) {
        switch (instruction.name) {
            case "SYSTEM_CALL":
                // Ignorado
                break;
            case "CLEAR_SCREEN":
                this.display.cleanDisplay();
                break;
            case "RETURN":
                if (this.SP > 0) {
                    this.SP--;
                    this.PC = this.Stack[this.SP];
                }
                break;
                
            // 1nnn
            case "JUMP_TO_NNN":
                this.PC = instruction.nnn;
                break;
                
            // 2nnn
            case "CALL_SUBROUTINE_NNN":
                this.Stack[this.SP++] = this.PC + 2;
                this.PC = instruction.nnn;
                break;
                
            // 3xkk
            case "SKIP_IF_VX_EQUALS_KK":
                if (this.V[instruction.x] === instruction.kk) {
                    this.PC += 4;
                } else {
                    this.PC += 2;
                }
                break;
                
            // 4xkk
            case "SKIP_IF_VX_NOT_EQUALS_KK":
                if (this.V[instruction.x] !== instruction.kk) {
                    this.PC += 4;
                } else {
                    this.PC += 2
                }
                break;
                
            // 5xy0
            case "SKIP_IF_VX_EQUALS_VY":
                if (this.V[instruction.x] === this.V[instruction.y]) {
                    this.PC += 4;
                } else {
                    this.PC += 2; 
                }
                break;
                
            // 6xkk
            case "SET_VX_TO_KK":
                this.V[instruction.x] = instruction.kk;
                
                break;
                
            // 7xkk
            case "ADD_KK_TO_VX":
                this.V[instruction.x] = (this.V[instruction.x] + instruction.kk) & 0xFF;
                break;
                
            // 8xy0
            case "SET_VX_TO_VY":
                this.V[instruction.x] = this.V[instruction.y];
                break;
                
            // 8xy1
            case "SET_VX_TO_VX_OR_VY": {
                const vxValue = this.V[instruction.x];
                const vyValue = this.V[instruction.y];
                this.V[instruction.x] = (vxValue | vyValue) & 0xFF;
                // Quirk: COSMAC VIP zerava VF antes das operações lógicas
                if (this.quirks.vfReset) {
                    this.V[0xF] = 0;
                }
                break;
            }
                
            // 8xy2
            case "SET_VX_TO_VX_AND_VY": {
                const vxValue = this.V[instruction.x];
                const vyValue = this.V[instruction.y];
                this.V[instruction.x] = (vxValue & vyValue) & 0xFF;
                // Quirk: COSMAC VIP zerava VF antes das operações lógicas
                if (this.quirks.vfReset) {
                    this.V[0xF] = 0;
                }
                break;
            }
                
            // 8xy3
            case "SET_VX_TO_VX_XOR_VY": {
                const vxValue = this.V[instruction.x];
                const vyValue = this.V[instruction.y];
                this.V[instruction.x] = (vxValue ^ vyValue) & 0xFF;
                // Quirk: COSMAC VIP zerava VF antes das operações lógicas
                if (this.quirks.vfReset) {
                    this.V[0xF] = 0;
                }
                break;
            }
                
            // 8xy4
            case "ADD_VY_TO_VX_WITH_CARRY":
                // VF = 1 se houve carry (soma > 255), 0 caso contrário
                const sum = this.V[instruction.x] + this.V[instruction.y];
                this.V[instruction.x] = sum & 0xFF;
                this.V[0xF] = sum > 255 ? 1 : 0;
                break;
                
            // 8xy5
            case "SUBTRACT_VY_FROM_VX":
                // VF = 1 se não houve borrow (VX >= VY), 0 caso contrário
                this.aux_value = this.V[instruction.x] - this.V[instruction.y];
                this.V[instruction.x] = this.aux_value & 0xFF;
                this.V[0xF] = this.aux_value < 0 ? 0 : 1;
                break;
                
            // 8xy6 - SHIFT_VX_RIGHT
            case "SHIFT_VX_RIGHT": {
                const originalVx = this.V[instruction.x];
                const originalVy = this.V[instruction.y];
                // Quirk: versões antigas usavam VY em vez de VX
                const valueToShift = this.quirks.shiftLegacy ? originalVy : originalVx;
                const shiftedValue = valueToShift >> 1;
                const lsb = valueToShift & 0x1;

                this.V[instruction.x] = shiftedValue & 0xFF;
                this.V[0xF] = lsb;
                break;
            }
                
            // 8xy7
            case "SET_VX_TO_VY_MINUS_VX":
                // VF = 1 se não houve borrow (VY >= VX), 0 caso contrário
                this.aux_value = this.V[instruction.y] - this.V[instruction.x];
                this.V[instruction.x] = this.aux_value & 0xFF;
                this.V[0xF] = this.aux_value < 0 ? 0 : 1;
                break;
                
            // 8xyE - SHIFT_VX_LEFT
            case "SHIFT_VX_LEFT": {
                const originalVx = this.V[instruction.x];
                const originalVy = this.V[instruction.y];
                // Quirk: versões antigas usavam VY em vez de VX
                const valueToShift = this.quirks.shiftLegacy ? originalVy : originalVx;
                const msb = (valueToShift & 0x80) >> 7;
                const shiftedValue = (valueToShift << 1) & 0xFF;

                this.V[instruction.x] = shiftedValue;
                this.V[0xF] = msb;
                break;
            }
                
            // 9xy0
            case "SKIP_IF_VX_NOT_EQUALS_VY":
                if (this.V[instruction.x] !== this.V[instruction.y]) {
                    this.PC += 4; 
                } else {
                    this.PC += 2; 
                }
                break;
                
            // Annn
            case "SET_I_TO_NNN":
                this.I = instruction.nnn;
                break;
                
            // Bnnn
            case "JUMP_TO_V0_PLUS_NNN":
                // Quirk: SUPER-CHIP usa VX em vez de V0
                if (this.quirks.jumpWithVx) {
                    this.PC = (instruction.nnn + this.V[instruction.x]) & 0xFFF;
                } else {
                    this.PC = (instruction.nnn + this.V[0]) & 0xFFF;
                }
                break;
                
            // Cxkk
            case "SET_VX_TO_RANDOM_AND_KK":
                this.V[instruction.x] = (Math.floor(Math.random() * 256)) & instruction.kk;
                break;
                
            // Dxyn - DRAW_SPRITE com clipping configurável e Display Wait
            case "DRAW_SPRITE_VX_VY_N":
                // Limita desenho a 60 FPS para evitar flicker
                const now = performance.now();
                const timeSinceLastDraw = now - this.lastDrawTime;
                
                if (timeSinceLastDraw < this.DRAW_INTERVAL_MS) {
                    return;
                }
                
                this.lastDrawTime = now;
                
                // VF = 1 se algum pixel foi apagado (colisão)
                this.V[0xF] = 0;
                
                const baseX = this.wrapCoordinate(this.V[instruction.x], this.SCREEN_WIDTH);
                const baseY = this.wrapCoordinate(this.V[instruction.y], this.SCREEN_HEIGHT);
                
                for (let row = 0; row < instruction.n; row++) {
                    const sprite = this.memory.getByte(this.I + row);
                    const yPosRaw = baseY + row;
                    
                    if (this.quirks.clipping) {
                        // Com clipping, para de desenhar se sair da tela
                        if (yPosRaw >= this.SCREEN_HEIGHT) {
                            break;
                        }
                    }
                    
                    const yPos = this.quirks.clipping
                        ? yPosRaw
                        : this.wrapCoordinate(baseY + row, this.SCREEN_HEIGHT);
                    
                    for (let col = 0; col < 8; col++) {
                        if ((sprite & (0x80 >> col)) !== 0) {
                            const xPosRaw = baseX + col;
                            
                            if (this.quirks.clipping && xPosRaw >= this.SCREEN_WIDTH) {
                                continue;
                            }

                            const xPos = this.quirks.clipping
                                ? xPosRaw
                                : this.wrapCoordinate(baseX + col, this.SCREEN_WIDTH);

                            const currentPixel = this.display.getPixel(xPos, yPos);
                            if (currentPixel === 1) {
                                this.V[0xF] = 1;
                            }
                            this.display.setPixel(xPos, yPos, currentPixel ^ 1);
                        }
                    }
                }
                
                this.PC += 2;
                break;
                
            // Ex9E
            case "SKIP_IF_KEY_VX_PRESSED":
                if (this.keyboard.keyIsPressed(this.V[instruction.x])) {
                    this.PC += 4;
                } else {
                    this.PC += 2;
                }
                break;
                
            // ExA1
            case "SKIP_IF_KEY_VX_NOT_PRESSED":
                if (!this.keyboard.keyIsPressed(this.V[instruction.x])) {
                    this.PC += 4;
                } else {
                    this.PC += 2;
                }
                break;
                
            // Fx07
            case "SET_VX_TO_DELAY_TIMER":
                this.V[instruction.x] = this.delayTimer;
                break;
            // Fx0A
            case "WAIT_FOR_KEY_PRESS":    
                // Bloqueia até uma tecla ser pressionada e solta
                // Se não houver tecla pronta, não incrementa PC (repetirá a instrução)
                let historyOfKeysPressed = this.keyboard.getHistoryOfKeysPressed();
                
                if (historyOfKeysPressed.length > 0) {
                    const lastKey = historyOfKeysPressed[historyOfKeysPressed.length - 1];
                    const keyCode = this.keyboard.getKeyMapping().get(lastKey);
                    
                    if (keyCode !== undefined && this.keyboard.isKeyPressReleaseCycleComplete(lastKey)) {
                        this.V[instruction.x] = keyCode;
                        this.keyboard.clearHistory();
                        this.keyboard.clearKeyPressReleaseCycle(lastKey);
                        this.PC += 2;
                    }
                }
                break;
                
            // Fx15
            case "SET_DELAY_TIMER_TO_VX":
                this.delayTimer = this.V[instruction.x];
                break;
                
            // Fx18
            case "SET_SOUND_TIMER_TO_VX":
                this.soundTimer = this.V[instruction.x];
                break;
                
            // Fx1E
            case "ADD_VX_TO_I":
                this.I = (this.I + this.V[instruction.x]) & 0xFFF;
                break;
                
            // Fx29
            case "SET_I_TO_FONT_VX":
                // Fontes começam em 0x050, cada dígito ocupa 5 bytes
                this.I = 0x050 + (this.V[instruction.x] * 5);
                break;
                
            // Fx33
            case "STORE_BCD_VX_AT_I":
                // Converte valor em BCD (Binary Coded Decimal): centenas, dezenas, unidades
                const value = this.V[instruction.x];
                this.memory.setByte(this.I, Math.floor(value / 100));
                this.memory.setByte(this.I + 1, Math.floor((value % 100) / 10));
                this.memory.setByte(this.I + 2, value % 10);
                break;
                
            // Fx55
            case "STORE_V0_TO_VX_AT_I":
                // Quirk: versões antigas incrementavam I durante o loop
                if (this.quirks.memoryIncrement) {
                    for (let i = 0; i <= instruction.x; i++) {
                        this.memory.setByte(this.I, this.V[i]);
                        this.I = (this.I + 1) & 0xFFF;
                    }
                } else {
                    for (let i = 0; i <= instruction.x; i++) {
                        this.memory.setByte(this.I + i, this.V[i]);
                    }
                }
                break;
                
            // Fx65
            case "LOAD_V0_TO_VX_FROM_I":
                // Quirk: versões antigas incrementavam I durante o loop
                if (this.quirks.memoryIncrement) {
                    for (let i = 0; i <= instruction.x; i++) {
                        this.V[i] = this.memory.getByte(this.I);
                        this.I = (this.I + 1) & 0xFFF;
                    }
                } else {
                    for (let i = 0; i <= instruction.x; i++) {
                        this.V[i] = this.memory.getByte(this.I + i);
                    }
                }
                break;
                
            default:
                console.log(`Instrução não implementada: ${instruction.name}`);
                break;
        }
    }
}

export default CPU
```

