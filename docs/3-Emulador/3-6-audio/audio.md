# Áudio do Emulador CHIP-8

A próxima parte do emulador é o Audio, responsável por simular o som do CHIP-8. No CHIP-8 original, existia um beep simples que era ativado quando o registrador de som (`soundTimer`) tinha um valor maior que zero.

Para reproduzir isso em TypeScript, criamos uma classe `Audio` que utiliza a Web Audio API do navegador para gerar um tom contínuo enquanto o `soundTimer` estiver ativo. Isso permite que os jogos emitam sons quando necessário, como em alertas ou efeitos sonoros.

## 1) Estrutura do Áudio

No TypeScript usamos a Web Audio API, que é a interface do navegador para trabalhar com áudio. Ela nos permite criar e controlar sons programaticamente.

### a) `audioContext` - Contexto de áudio

```ts
private audioContext: AudioContext | null = null;
```

O `AudioContext` é o ponto de entrada para toda a funcionalidade de áudio na Web Audio API. Ele representa um gráfico de processamento de áudio, onde podemos conectar diferentes nós de áudio para criar sons. Sem ele, não conseguimos gerar nenhum som.

Inicializamos o contexto no método `init()`, que é chamado no construtor:

```ts
private init() {
    try {
        this.audioContext = new AudioContext();
        // ...
    } catch (error) {
        console.warn("Web Audio API não disponível", error);
    }
}
```

Usamos um bloco `try-catch` porque alguns navegadores ou ambientes podem não suportar a Web Audio API. Se isso acontecer, o emulador continua funcionando, apenas sem som.

### b) `gainNode` - Controle de volume

```ts
private gainNode: GainNode | null = null;
```

O `GainNode` é um nó de áudio que controla o volume do som. Ele funciona como um amplificador que pode aumentar ou diminuir a intensidade do sinal de áudio. No nosso caso, usamos ele para manter o volume em um nível confortável.

Configuramos o ganho (volume) para 0.1, que é 10% do volume máximo:

```ts
this.gainNode = this.audioContext.createGain();
this.gainNode.gain.value = 0.1;
this.gainNode.connect(this.audioContext.destination);
```

O valor 0.1 foi escolhido para que o beep não seja muito alto ou irritante. Conectamos o `gainNode` ao destino do áudio (`audioContext.destination`), que geralmente são os alto-falantes do computador.

### c) `oscillator` - Gerador de som

```ts
private oscillator: OscillatorNode | null = null;
```

O `OscillatorNode` é o nó que realmente gera o som. Ele cria uma onda sonora periódica que, quando conectada ao sistema de áudio, produz um tom audível. No CHIP-8, o som é um beep simples e contínuo, então um oscilador é perfeito para isso.

Inicialmente, o oscilador é `null` porque só criamos ele quando precisamos tocar o som. Isso evita criar recursos desnecessários quando o emulador não está emitindo nenhum som.

## 2) Controle do Áudio

O controle do áudio acontece através de dois métodos principais: `startBeep()` para iniciar o som e `stopBeep()` para pará-lo. A CPU chama esses métodos baseado no valor do `soundTimer`.

### a) `startBeep()` - Iniciar o beep

```ts
startBeep() {
    if (!this.audioContext || !this.gainNode || this.oscillator) return;
```

Primeiro, verificamos se temos todos os recursos necessários. Se o `audioContext` ou `gainNode` não existirem, não podemos tocar som. Também verificamos se já existe um oscilador ativo (`this.oscillator`), porque não queremos criar múltiplos osciladores ao mesmo tempo.

Se todas as condições forem atendidas, criamos um novo oscilador:

```ts
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'square';
    this.oscillator.frequency.value = 440;
    this.oscillator.connect(this.gainNode);
    this.oscillator.start();
}
```

Configuramos o oscilador com:
* `type = 'square'` - Cria uma onda quadrada, que produz um som mais "digital" e característico, similar ao beep do CHIP-8 original.
* `frequency.value = 440` - Define a frequência em 440 Hz, que é a nota Lá (A4) na escala musical. É um tom agradável e facilmente audível.

Depois, conectamos o oscilador ao `gainNode` (que já está conectado ao destino) e iniciamos o som com `start()`.

### b) `stopBeep()` - Parar o beep

```ts
stopBeep() {
    if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
    }
}
```

Quando precisamos parar o som, verificamos se existe um oscilador ativo. Se existir, chamamos `stop()` para parar a geração do som, `disconnect()` para desconectá-lo do gráfico de áudio, e definimos `oscillator` como `null` para indicar que não há mais som tocando.

É importante limpar o oscilador corretamente para evitar vazamentos de memória e garantir que possamos criar um novo oscilador quando necessário.

## 3) Integração com a CPU

O áudio é controlado pela CPU através do `soundTimer`. A CPU decrementa o `soundTimer` a cada frame (60 vezes por segundo) e gerencia o estado do beep:

```ts
if (this.soundTimer > 0) {
    if (!this.audio.isPlaying()) {
        this.audio.startBeep();
    }
    this.soundTimer--;
} else if (this.audio.isPlaying()) {
    this.audio.stopBeep();
}
```

Quando o `soundTimer` é maior que zero, verificamos se o áudio já está tocando. Se não estiver, iniciamos o beep. Depois, decrementamos o timer. Quando o `soundTimer` chega a zero, paramos o beep se ele ainda estiver tocando.

Isso garante que o som seja reproduzido enquanto o `soundTimer` estiver ativo, e pare automaticamente quando o timer chegar a zero.

## 4) Métodos Auxiliares

Além dos métodos principais, a classe `Audio` possui métodos auxiliares importantes:

### a) `resume()` - Retomar o contexto de áudio

```ts
resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
    }
}
```

Muitos navegadores modernos bloqueiam a reprodução automática de áudio para evitar que sites toquem sons sem a interação do usuário. Quando isso acontece, o `AudioContext` fica em estado `'suspended'` e precisa ser retomado manualmente.

O método `resume()` verifica se o contexto está suspenso e, se estiver, o retoma. Isso permite que o áudio funcione após o usuário interagir com a página (por exemplo, clicando em um botão para iniciar o emulador).

### b) `isPlaying()` - Verificar se está tocando

```ts
isPlaying(): boolean {
    return this.oscillator !== null;
}
```

Esse método verifica se há um oscilador ativo, o que indica que o som está sendo reproduzido. É usado pela CPU para evitar iniciar múltiplos beeps quando o `soundTimer` ainda está ativo.

Este conjunto de métodos garante que o sistema de áudio funcione corretamente, reproduzindo o beep do CHIP-8 quando necessário e lidando adequadamente com as restrições dos navegadores modernos.

## Trecho Completo

```ts
export class Audio {
    private audioContext: AudioContext | null = null;
    private oscillator: OscillatorNode | null = null;
    private gainNode: GainNode | null = null;

    constructor() {
        this.init();
    }

    private init() {
        try {
            this.audioContext = new AudioContext();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 0.1;
            this.gainNode.connect(this.audioContext.destination);
        } catch (error) {
            console.warn("Web Audio API não disponível", error);
        }
    }

    startBeep() {
        if (!this.audioContext || !this.gainNode || this.oscillator) return;
        
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = 'square';
        this.oscillator.frequency.value = 440;
        this.oscillator.connect(this.gainNode);
        this.oscillator.start();
    }

    stopBeep() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
    }

    // Navegadores bloqueiam autoplay de áudio - precisa de interação do usuário
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    isPlaying(): boolean {
        return this.oscillator !== null;
    }
}

export default Audio;
```
