Com a arquitetura do emulador definida, o próximo passo é entender como o código começa a ganhar vida — ou seja, como cada parte vai sendo construída e passa a se comunicar com as outras. Tudo começa com um arquivo principal, onde o emulador realmente “acorda”. A ideia inicial é simples: criar um ambiente onde possamos juntar todos os elementos do sistema e coordenar a execução. O CHIP-8 pode ser dividido em 4 componentes principais, e cada um tem uma função bem específica dentro da engrenagem:

1) **CPU:** É ela que vai ler as instruções dos jogos, entender o que precisam fazer e executar essas ações
2) **Memória:** O local onde as informações ficam guardadas — tanto o código do jogo quanto os dados temporários usados pela CPU
3) **Display:** Ele é o “rosto” do emulador, exibindo os gráficos em uma tela simples de 64x32 pixels
4) **Teclado:** O meio pelo qual o jogador interage com o sistema

<p align="center">
    <img src="./components.png" alt="Componentes_chip8" width="400"/>
</p>

Vamos começar primeiro pelas partes independentes, ou seja, aquelas que não dependem de outros componentes para funcionar corretamente. Isso facilita o desenvolvimento, porque podemos testar e entender cada módulo separadamente antes de conectá-los.

> Por exemplo, pense na CPU: ela é o cérebro do sistema, responsável por executar as instruções. No entanto, para fazer isso, ela precisa que o programa já esteja armazenado na memória — afinal, é de lá que as instruções são lidas. **Isso significa que não podemos começar pela CPU, já que ela depende diretamente da memória para funcionar.**

Assim, o ideal é iniciar pelos módulos mais simples e autônomos, como a **memória** e o **display**. A memória pode ser criada de forma isolada, pois seu papel é apenas guardar e fornecer dados quando solicitada. O display também pode ser implementado à parte, já que ele apenas desenha pixels na tela com base nas informações que receberá mais tarde. Podemos ver esses passos abaixo:

### [3.1) Memória](./3-1-memoria/memoria.md)
### [3.2) Display](./3-2-display/display.md)
### [3.3) Disassembler](./3-3-disassembler/disassembler.md)
### [3.4) Teclado](./3-4-teclado/teclado.md)
### [3.5) Audio](./3-6-audio/audio.md)
### [3.6) CPU](./3-5-cpu/cpu.md)

## A Classe Principal

Agora que todos os componentes estão prontos, precisamos de uma forma de juntá-los e coordenar sua execução. É aqui que entra a classe `Chip8` — ela é o ponto central do emulador, o "maestro" que reúne a CPU, a memória, o display e o teclado, e permite que eles trabalhem juntos de forma harmoniosa.

A construção da classe principal começa pela classe `Chip8`, que é responsável por coordenar todos os componentes do emulador. Ela mantém referências privadas para cada um dos componentes principais:

```js
export class Chip8 {
    private cpu: CPU;
    private memory: Memory;
    private display: Display;
    private keyboard: Keyboard;
```

Essa estrutura encapsula todos os detalhes internos do emulador, expondo apenas as operações que o usuário precisa para controlar o sistema. Isso segue o princípio de **encapsulamento**: os componentes internos não são acessíveis diretamente, mas sim através de métodos específicos da classe.

### Inicialização

No construtor, todos os componentes são criados e inicializados na ordem correta:

```js
constructor() {
    this.memory = new Memory();
    this.display = new Display();
    this.keyboard = new Keyboard();
    this.cpu = new CPU(this.memory, this.display, this.keyboard);
}
```

A ordem de criação é importante aqui:
1. **Memória** é criada primeiro, pois é o componente mais fundamental
2. **Display** e **Teclado** são criados em seguida, pois são independentes
3. **CPU** é criada por último, pois ela depende dos outros três componentes para funcionar

A CPU recebe referências para memória, display e teclado no construtor, estabelecendo a comunicação entre todos os componentes.

### Carregamento de ROMs

Para executar um jogo, precisamos primeiro carregar o código do jogo na memória:

```js
loadROM(romContent: Uint8Array) {
    this.memory.loadROMInRAM(romContent as Buffer);
}
```

Esse método recebe o conteúdo da ROM como um array de bytes e delega o carregamento para a memória. A memória, por sua vez, copia esses bytes para a região de memória de programa (a partir do endereço `0x200`).

### Controle de Execução

A classe oferece três formas diferentes de executar o emulador:

**Execução Contínua:**
```js
start() {
    this.cpu.run();
}
```

O método `start()` inicia a execução contínua do emulador. A CPU entra em um loop que executa instruções continuamente até ser interrompida.

**Execução Passo a Passo:**
```js
step() {
    this.cpu.step();
}
```

O método `step()` executa apenas uma instrução por vez. Isso é útil para debug, permitindo que você veja exatamente o que acontece em cada ciclo de execução.

**Reset:**
```js
reset() {
    this.cpu.reset();
}
```

O método `reset()` reinicia o emulador para seu estado inicial, limpando todos os registradores e voltando o contador de programa para o início.

### Interação com o Display

Para obter o estado atual da tela:

```js
getScreen() {
    return this.display.getDisplay();
}
```

Esse método retorna o array bidimensional que representa os pixels da tela. A aplicação pode usar essa informação para renderizar os gráficos na interface do usuário.

### Interação com o Teclado

Para atualizar o estado de uma tecla:

```js
setKeyState(key: string, value: boolean) {
    this.keyboard.setKeyState(key, value);
}
```

Quando o usuário pressiona ou solta uma tecla na interface, esse método é chamado para informar o emulador sobre a mudança de estado. A CPU pode então verificar essas teclas durante a execução das instruções.

### Controle de Áudio

```js
resumeAudio() {
    this.cpu.resumeAudio();
}
```

O método `resumeAudio()` permite retomar a reprodução do som. Isso é necessário porque muitos navegadores bloqueiam a reprodução automática de áudio até que o usuário interaja com a página.

### Estado da CPU

Para obter informações sobre o estado atual da CPU (útil para debug ou exibição de informações):

```js
getCPUState() {
    return this.cpu.getState();
}
```

Esse método retorna um objeto contendo todos os registradores, o contador de programa, o ponteiro de stack e outras informações internas da CPU.

### Configuração de Quirks

O CHIP-8 teve várias implementações ao longo dos anos, e cada uma tinha pequenas diferenças de comportamento (chamadas de "quirks"). A classe `Chip8` oferece métodos para configurar esses comportamentos:

- **Modo de Incremento de Memória**: Controla se a instrução `LD [I], Vx` incrementa o registrador `I` após cada escrita
- **Modo de Shift**: Controla qual registrador é usado nas instruções de shift (`SHL` e `SHR`)
- **Modo de Clipping**: Controla se sprites que ultrapassam as bordas da tela são cortados ou "enrolam" para o outro lado
- **Modo de Reset do VF**: Controla se o registrador `VF` é resetado antes de operações de load e move
- **Modo de Jump com Vx**: Controla o comportamento da instrução `JP V0, addr`

Para obter ou atualizar todos os quirks de uma vez:

```js
getQuirks(): Chip8Quirks {
    return this.cpu.getQuirks();
}

updateQuirks(partial: Partial<Chip8Quirks>) {
    this.cpu.updateQuirks(partial);
}
```

## Trecho Completo

```js
import { CPU, type Chip8Quirks } from "./CPU";
import { Display } from "./Display";
import { Keyboard } from "./Keyboard";
import { Memory } from "./Memory";

export class Chip8 {
    private cpu: CPU;
    private memory: Memory;
    private display: Display;
    private keyboard: Keyboard;

    constructor() {
        this.memory = new Memory();
        this.display = new Display();
        this.keyboard = new Keyboard();
        this.cpu = new CPU(this.memory, this.display, this.keyboard);
    }
    
    loadROM(romContent: Uint8Array) {
        this.memory.loadROMInRAM(romContent as Buffer);
    }

    start() {
        this.cpu.run();
    }

    step() {
        this.cpu.step();
    }

    reset() {
        this.cpu.reset();
    }

    getScreen() {
        return this.display.getDisplay();
    }

    setKeyState(key: string, value: boolean) {
        this.keyboard.setKeyState(key, value);
    }

    resumeAudio() {
        this.cpu.resumeAudio();
    }

    getCPUState() {
        return this.cpu.getState();
    }

    setMemoryIncrementMode(enabled: boolean) {
        this.cpu.setMemoryIncrementMode(enabled);
    }

    getMemoryIncrementMode(): boolean {
        return this.cpu.getMemoryIncrementMode();
    }

    setShiftMode(enabled: boolean) {
        this.cpu.setShiftMode(enabled);
    }

    getShiftMode(): boolean {
        return this.cpu.getShiftMode();
    }

    setClippingMode(enabled: boolean) {
        this.cpu.setClippingMode(enabled);
    }

    getClippingMode(): boolean {
        return this.cpu.getClippingMode();
    }

    getQuirks(): Chip8Quirks {
        return this.cpu.getQuirks();
    }

    updateQuirks(partial: Partial<Chip8Quirks>) {
        this.cpu.updateQuirks(partial);
    }

    setVfResetMode(enabled: boolean) {
        this.cpu.setVfResetMode(enabled);
    }

    getVfResetMode(): boolean {
        return this.cpu.getVfResetMode();
    }

    setJumpWithVxMode(enabled: boolean) {
        this.cpu.setJumpWithVxMode(enabled);
    }

    getJumpWithVxMode(): boolean {
        return this.cpu.getJumpWithVxMode();
    }
}
```