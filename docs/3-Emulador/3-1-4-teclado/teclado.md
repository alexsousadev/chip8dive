# Teclado do Emulador CHIP-8

A próxima parte do emulador é o Keyboard, responsável por simular o teclado do CHIP-8. No CHIP-8 original, existia um teclado hexadecimal, com 16 teclas (0–F), que o jogador usava para interagir com os jogos.

Para reproduzir isso em TypeScript, criamos uma classe `Keyboard` que controla o estado de cada tecla, o histórico de teclas pressionadas e o ciclo pressionar->soltar, algo importante para instruções como `Fx0A`.

## 1) Estrutura do Teclado

No TypeScript usamos `Map`, que é como uma tabela de correspondência, para organizar duas coisas importantes:

### a) `keys` - Tradução de teclado físico para o CHIP-8

```ts
this.keys = new Map([
    ["1", 0x1], ["2", 0x2], ["3", 0x3], ["4", 0xC],
    ["q", 0x4], ["w", 0x5], ["e", 0x6], ["r", 0xD],
    ["a", 0x7], ["s", 0x8], ["d", 0x9], ["f", 0xE],
    ["z", 0xA], ["x", 0x0], ["c", 0xB], ["v", 0xF]
]);
```

A tecla que você aperta no teclado do PC ("1", "q", "a", etc) tem um valor correspondente no CHIP-8. Isso ajuda a CPU a entender qual botão foi pressionado. Esse mapeamento pode ser acessado através do método `getKeyMapping()`.

### b) `keysState` – Estado de cada tecla

```ts
this.keysState = new Map([
    [0x1, false], [0x2, false], [0x3, false], [0x4, false],
    [0x5, false], [0x6, false], [0x7, false], [0x8, false],
    [0x9, false], [0xA, false], [0xB, false], [0xC, false],
    [0xD, false], [0xE, false], [0xF, false], [0x0, false]
]);
```

Cada valor do CHIP-8 começa desligado (`false`), porque nenhuma tecla foi pressionada ainda. Quando o jogador aperta a tecla, mudamos para `true`. Quando solta, volta para `false`.

### c) `historyOfKeysPressed` - Histórico de teclas pressionadas

```ts
private historyOfKeysPressed: string[] = [];
```

Essa propriedade armazena a ordem em que as teclas foram pressionadas. No código, ela serve para instruções que precisam do histórico do jogador, como a `Fx0A`, que espera uma tecla ser pressionada antes de continuar. Também permite que o emulador registre entradas mesmo que o jogador pressione rapidamente várias teclas em sequência, sem perder nenhum input.

Ela é acompanhada de métodos para remover todas as entradas do histórico (`clearHistory`) e para adicionar teclas que foram pressionadas ao histórico (`addKeyToHistory`). Além disso, é necessário acessar esse histórico quando necessário, e é por isso que criamos o método `getHistoryOfKeysPressed()`:

```ts
addKeyToHistory(key: string) {
    this.historyOfKeysPressed.push(key);
}

clearHistory() {
    this.historyOfKeysPressed = [];
}

getHistoryOfKeysPressed(): string[] {
    return this.historyOfKeysPressed;
}
```

### d) `keyPressTimers` – Timers para delay de registro

```ts
private keyPressTimers: Map<string, NodeJS.Timeout> = new Map();
```

Esse mapa controla timers para cada tecla pressionada. Ele é usado para criar um pequeno delay antes de adicionar a tecla ao histórico, evitando que pressionamentos rápidos sejam registrados múltiplas vezes. Ou seja, ele garante que o mesmo botão não seja contado duas vezes em milissegundos.

### e) `keyPressDelay` – Tempo de delay

```ts
private keyPressDelay: number = 200;
```

Esse valor define quanto tempo o emulador espera antes de registrar a tecla no histórico. No código, serve para prevenir que uma tecla apertada rapidamente seja registrada repetidamente, funcionando como um filtro de "debounce" para entradas rápidas do jogador.

### f) `keyPressReleaseCycle` – Ciclo pressionar->soltar

```ts
private keyPressReleaseCycle: Map<string, boolean> = new Map();
```

Rastreia se cada tecla completou o ciclo pressionar e soltar. Ele é essencial para a instrução `Fx0A`, que aguarda o jogador apertar e soltar uma tecla antes de continuar. Sem isso, o emulador não conseguiria identificar se o input foi realmente completo.

## 2) Controle do Teclado

O método principal que controla isso é `setKeyState(key: string, value: boolean)`. Ele recebe:

* `key` → a tecla do teclado físico que foi pressionada ou solta.
* `value` → `true` se está pressionada, `false` se foi solta.

Primeiro, verificamos se a tecla existe no mapeamento:

```ts
if (this.keys.has(key)) {
    const keyCode = this.keys.get(key)!;
    this.keysState.set(keyCode, value);
```

Se a tecla existe, obtemos o código correspondente no CHIP-8 e atualizamos o estado dessa tecla. Agora vamos ver o que acontece quando a tecla é pressionada ou solta.

### a) Quando a tecla é pressionada (`value = true`)

Nesse momento, iniciamos o ciclo de pressionar e soltar, marcando que a tecla foi pressionada mas ainda não solta:

```ts
if (value) {
    // Tecla pressionada: aguarda delay antes de adicionar ao histórico
    this.keyPressReleaseCycle.set(key, false);
```

Para evitar que teclas rápidas gerem múltiplos registros, usamos um timer que adiciona a tecla ao histórico apenas após um pequeno delay, garantindo que a CPU só registre a tecla uma vez:

```ts
    if (this.keyPressTimers.has(key)) {
        clearTimeout(this.keyPressTimers.get(key)!);
    }
    
    const timer = setTimeout(() => {
        this.addKeyToHistory(key);
        this.keyPressTimers.delete(key);
    }, this.keyPressDelay);
    
    this.keyPressTimers.set(key, timer);
}
```

Se já existe um timer para essa tecla, cancelamos ele antes de criar um novo. Isso evita que múltiplos timers sejam criados se o jogador pressionar a mesma tecla rapidamente.

### b) Quando a tecla é solta (`value = false`)

Se a tecla for solta antes do timer completar, o timer é cancelado. Quando a tecla é solta, chamamos novamente `setKeyState`, agora com `false`, e marcamos que o ciclo pressionar->soltar foi concluído:

```ts
} else {
    // Tecla solta: marca ciclo completo para Fx0A
    this.keyPressReleaseCycle.set(key, true);
    
    if (this.keyPressTimers.has(key)) {
        clearTimeout(this.keyPressTimers.get(key)!);
        this.keyPressTimers.delete(key);
    }
}
```

Isso é importante para instruções do CHIP-8 que aguardam o jogador pressionar e soltar uma tecla antes de continuar, como a `Fx0A`.

## 3) Métodos Auxiliares

Além do método principal `setKeyState`, a classe `Keyboard` possui outros métodos importantes:

### a) `keyIsPressed(key: number)` - Verificar se uma tecla está pressionada

```ts
keyIsPressed(key: number): boolean {
    return this.keysState.get(key) || false;
}
```

Esse método permite que a CPU verifique se uma tecla específica do CHIP-8 está pressionada no momento. É usado por instruções como `Ex9E` (pula próxima instrução se tecla pressionada) e `ExA1` (pula próxima instrução se tecla não pressionada).

### b) `isKeyPressReleaseCycleComplete(key: string)` - Verificar ciclo completo

```ts
isKeyPressReleaseCycleComplete(key: string): boolean {
    return this.keyPressReleaseCycle.get(key) === true;
}
```

Esse método verifica se uma tecla completou o ciclo de pressionar e soltar. É essencial para a instrução `Fx0A`, que aguarda o jogador pressionar e soltar uma tecla antes de continuar a execução.

### c) `clearKeyPressReleaseCycle(key: string)` - Limpar ciclo

```ts
clearKeyPressReleaseCycle(key: string) {
    this.keyPressReleaseCycle.delete(key);
}
```

Após processar uma tecla na instrução `Fx0A`, é necessário limpar o ciclo para que a próxima tecla possa ser detectada corretamente.

Este conjunto de métodos garante que o teclado virtual funcione corretamente, controlando o estado de cada tecla, o histórico e o ciclo pressionar->soltar, mesmo quando o jogador pressiona ou solta teclas rapidamente.

## Trecho Completo

```ts
export class Keyboard {
    private keys: Map<string, number>;
    private keysState: Map<number, boolean>;
    private historyOfKeysPressed: string[] = []; // Histórico de teclas pressionadas
    private keyPressTimers: Map<string, NodeJS.Timeout> = new Map(); // Timers para delay das teclas
    private keyPressDelay: number = 200; // Delay em ms antes de adicionar ao histórico
    private keyPressReleaseCycle: Map<string, boolean> = new Map(); // Rastrear ciclo pressionar->soltar
    
    constructor() {
        this.historyOfKeysPressed = [];

        // Map of keys and their corresponding values
        this.keys = new Map([
            ["1", 0x1], ["2", 0x2], ['3', 0x3], ['4', 0xC],
            ['q', 0x4], ['w', 0x5], ['e', 0x6], ['r', 0xD],
            ['a', 0x7], ['s', 0x8], ['d', 0x9], ['f', 0xE],
            ['z', 0xA], ['x', 0x0], ['c', 0xB], ['v', 0xF]
          ]);

          // Map of keys and their corresponding states
          this.keysState = new Map([
            [0x1, false], [0x2, false], [0x3, false], [0x4, false],
            [0x5, false], [0x6, false], [0x7, false], [0x8, false],
            [0x9, false], [0xA, false], [0xB, false], [0xC, false],
            [0xD, false], [0xE, false], [0xF, false], [0x0, false]
          ]);
    }

    setKeyState(key: string, value: boolean) {
        if (this.keys.has(key)) {
            const keyCode = this.keys.get(key)!;
            this.keysState.set(keyCode, value);
            
            if (value) {
                // Tecla pressionada: aguarda delay antes de adicionar ao histórico
                this.keyPressReleaseCycle.set(key, false);
                
                if (this.keyPressTimers.has(key)) {
                    clearTimeout(this.keyPressTimers.get(key)!);
                }
                
                const timer = setTimeout(() => {
                    this.addKeyToHistory(key);
                    this.keyPressTimers.delete(key);
                }, this.keyPressDelay);
                
                this.keyPressTimers.set(key, timer);
            } else {
                // Tecla solta: marca ciclo completo para Fx0A
                this.keyPressReleaseCycle.set(key, true);
                
                if (this.keyPressTimers.has(key)) {
                    clearTimeout(this.keyPressTimers.get(key)!);
                    this.keyPressTimers.delete(key);
                }
            }
        }
    }

    addKeyToHistory(key: string) {
        this.historyOfKeysPressed.push(key);
    }
    
    clearHistory() {
        this.historyOfKeysPressed = [];
    }
    
    getHistoryOfKeysPressed(): string[] {
        return this.historyOfKeysPressed;
    }

    keyIsPressed(key: number): boolean {
        return this.keysState.get(key) || false;
    }

    getKeyMapping(): Map<string, number> {
        return new Map(this.keys);
    }

    isKeyPressReleaseCycleComplete(key: string): boolean {
        return this.keyPressReleaseCycle.get(key) === true;
    }

    clearKeyPressReleaseCycle(key: string) {
        this.keyPressReleaseCycle.delete(key);
    }
}
```
