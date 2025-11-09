A construção do componente `Menu` começa pela criação da interface principal do emulador, onde o usuário pode interagir com o sistema. Este componente é o ponto central que conecta o usuário ao emulador CHIP-8, permitindo carregar ROMs, controlar a execução e visualizar o display.

O componente começa com as importações necessárias:

```js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaFileUpload, FaPause, FaPlay, FaFolderOpen } from "react-icons/fa";
import { RiResetLeftFill } from "react-icons/ri";
import { VscDebug, VscDebugStepOver } from "react-icons/vsc";
import { Chip8 } from "../../../core/chip8/chip8";
import { GitHubLink } from "./shared/GitHubLink";
import "./Menu.css";
```

Aqui, importamos os hooks do React que vamos usar para gerenciar o estado e os efeitos colaterais, os ícones que aparecem nos botões, a classe principal do emulador, o componente compartilhado do GitHub e os estilos específicos do Menu.

Agora, precisamos criar a instância do emulador. Mas aqui há um detalhe importante: não queremos que o emulador seja recriado toda vez que o componente renderiza, porque isso faria perder todo o estado do jogo. Por isso, usamos `useRef`:

```js
const chipRef = useRef(new Chip8());
const chip = chipRef.current;
```

O `useRef` cria uma referência que persiste entre renderizações, então o emulador é criado apenas uma vez quando o componente é montado pela primeira vez. Assim, quando o usuário pausa e continua o jogo, o estado do emulador é mantido.

Com o emulador criado, precisamos gerenciar os estados da interface. O componente usa vários estados para controlar o que está acontecendo:

```js
const [romLoaded, setRomLoaded] = useState(false);
const [isRunning, setIsRunning] = useState(false);
const [debugMode, setDebugMode] = useState(false);
```

Esses três estados controlam o ciclo de vida básico do emulador:
- **`romLoaded`**: Indica se uma ROM foi carregada. Quando é `true`, significa que há um jogo pronto para ser executado.
- **`isRunning`**: Controla se o emulador está rodando ou pausado. É como um botão de play/pause.
- **`debugMode`**: Ativa o modo debug, onde o emulador executa instrução por instrução, permitindo inspecionar o que está acontecendo passo a passo.

Para permitir que o usuário carregue múltiplas ROMs de uma vez, precisamos de mais estados:

```js
const [loadedRoms, setLoadedRoms] = useState<RomFile[]>([]);
const [selectedRomIndex, setSelectedRomIndex] = useState<number | null>(null);
const [showConfirmModal, setShowConfirmModal] = useState(false);
const [pendingRomIndex, setPendingRomIndex] = useState<number | null>(null);
```

Quando o usuário carrega uma pasta inteira, todas as ROMs são armazenadas em `loadedRoms`. O `selectedRomIndex` guarda qual ROM está atualmente selecionada. Se o usuário tentar trocar de ROM enquanto o jogo está rodando, mostramos um modal de confirmação — por isso temos `showConfirmModal` e `pendingRomIndex`, que guarda qual ROM o usuário quer carregar enquanto aguarda a confirmação.

Agora, vamos pensar na renderização do display. O CHIP-8 tem uma tela de 64×32 pixels, mas isso seria muito pequeno para ver na tela do computador. Então, vamos ampliar cada pixel para 10×10 pixels, resultando em um canvas de 640×320 pixels:

```js
const renderScreen = useCallback(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const screenData = chip.getScreen();
  
  ctx.clearRect(0, 0, 640, 320);
  ctx.fillStyle = '#ffffff';
  
  for (let y = 0; y < screenData.length; y++) {
    for (let x = 0; x < screenData[y].length; x++) {
      if (screenData[y][x]) {
        ctx.fillRect(x * 10, y * 10, 10, 10);
      }
    }
  }
}, [chip]);
```

A função `renderScreen` pega os dados do display do emulador e desenha cada pixel ativo como um quadrado branco de 10×10 pixels no canvas. Primeiro, limpamos o canvas para remover o frame anterior. Depois, percorremos cada pixel do display CHIP-8 — se o pixel estiver ativo (valor `true`), desenhamos um quadrado branco na posição correspondente.

O `useCallback` aqui é importante: ele garante que a função não seja recriada a cada render, o que otimiza o desempenho do game loop que vamos criar em seguida.

Agora vem a parte mais importante: o game loop. Este é o coração da execução do emulador. Ele precisa executar o emulador continuamente, mas também precisa atualizar a tela a uma taxa adequada:

```js
useEffect(() => {
  let animationFrameId: number | undefined;
  let lastScreenUpdate = Date.now();
  let shouldRun = true;

  const gameLoop = () => {
    if (!shouldRun || !isRunning || debugMode) {
      shouldRun = false;
      return;
    }

    try {
      // Executa muitas instruções por frame para garantir determinismo
      for (let i = 0; i < 10000; i++) {
        chip.step();
      }

      const now = Date.now();
      
      // Atualiza tela a ~60 FPS (16.67ms por frame)
      if (now - lastScreenUpdate >= 16.67) {
        renderScreen();
        lastScreenUpdate = now;
      }
    } catch (error) {
      console.error("CPU Error:", error);
      setIsRunning(false);
      shouldRun = false;
      return;
    }

    if (shouldRun && isRunning && !debugMode) {
      animationFrameId = requestAnimationFrame(gameLoop);
    }
  };

  if (romLoaded && isRunning && !debugMode) {
    shouldRun = true;
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  return () => {
    shouldRun = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  };
}, [romLoaded, isRunning, debugMode, chip, renderScreen]);
```

O game loop funciona assim: em cada iteração, executamos 10.000 instruções do emulador. Esse número alto garante que o emulador execute em velocidade adequada, independente da velocidade do navegador. Mas a tela só é atualizada a aproximadamente 60 FPS (a cada 16.67ms), mesmo que muitas instruções sejam executadas entre atualizações. Isso cria uma experiência visual suave enquanto mantém a precisão temporal.

O loop só executa se houver uma ROM carregada, se o emulador estiver rodando e se o modo debug estiver desativado. Quando qualquer uma dessas condições muda, o loop é cancelado através da função de limpeza do `useEffect`.

Para capturar as teclas do teclado, precisamos adicionar event listeners globais:

```js
useEffect(() => {
  const handleKeyPress = (event: KeyboardEvent) => {
    chip.setKeyState(event.key, true);
  };

  const handleKeyRelease = (event: KeyboardEvent) => {
    chip.setKeyState(event.key, false);
  };

  window.addEventListener('keydown', handleKeyPress);
  window.addEventListener('keyup', handleKeyRelease);

  return () => {
    window.removeEventListener('keydown', handleKeyPress);
    window.removeEventListener('keyup', handleKeyRelease);
  };
}, [chip]);
```

Quando uma tecla é pressionada, definimos o estado dela como `true` no emulador. Quando é solta, definimos como `false`. Os eventos são capturados globalmente na `window`, então o emulador responde às teclas mesmo quando o foco não está diretamente no componente.

Agora, vamos pensar no carregamento de ROMs. O usuário pode carregar um arquivo individual ou uma pasta inteira. Quando um arquivo é selecionado, precisamos lê-lo e carregá-lo no emulador:

```js
const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
  if (event.target.files) {
    const file = event.target.files[0];
    
    if (!isValidRomFile(file.name)) {
      alert('Por favor, selecione um arquivo ROM válido (.ch8 ou binário sem extensão).');
      return;
    }
    
    const reader = new FileReader();

    reader.onloadend = (event) => {
      const result = event.target?.result;
      if (result instanceof ArrayBuffer) {
        const romData = new Uint8Array(result);
        chip.loadROM(romData);
        chip.resumeAudio();
        setRomLoaded(true);
        setIsRunning(true);
      }
    };

    reader.readAsArrayBuffer(file);
  }
};
```

Primeiro, validamos se o arquivo é uma ROM válida (extensão `.ch8` ou sem extensão). Depois, usamos o `FileReader` do navegador para ler o arquivo como um `ArrayBuffer`. Quando a leitura termina, convertemos o `ArrayBuffer` para `Uint8Array` (que é o formato que o emulador espera), carregamos a ROM no emulador, retomamos o áudio (necessário devido às políticas de autoplay dos navegadores) e atualizamos os estados para indicar que uma ROM foi carregada e está rodando.

Para carregar uma pasta inteira, o processo é similar, mas precisamos processar múltiplos arquivos:

```js
const handleFolder = async (event: React.ChangeEvent<HTMLInputElement>) => {
  if (event.target.files) {
    const files = Array.from(event.target.files).filter(file => 
      isValidRomFile(file.name)
    );

    if (files.length === 0) {
      alert('Nenhum arquivo ROM (.ch8 ou binário sem extensão) encontrado na pasta selecionada.');
      return;
    }

    const romFiles: RomFile[] = [];

    for (const file of files) {
      const reader = new FileReader();
      const romFile = await new Promise<RomFile>((resolve, reject) => {
        reader.onloadend = (e) => {
          const result = e.target?.result;
          if (result instanceof ArrayBuffer) {
            resolve({
              name: file.name,
              data: new Uint8Array(result)
            });
          } else {
            reject(new Error('Erro ao ler arquivo'));
          }
        };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsArrayBuffer(file);
      });
      romFiles.push(romFile);
    }

    setLoadedRoms(romFiles);
    if (romFiles.length > 0) {
      const firstRom = romFiles[0];
      chip.loadROM(firstRom.data);
      chip.resumeAudio();
      setRomLoaded(true);
      setIsRunning(true);
      setSelectedRomIndex(0);
    }
  }
};
```

Filtramos apenas os arquivos válidos da pasta. Para cada arquivo, criamos uma Promise que lê o arquivo de forma assíncrona. Quando todas as ROMs são carregadas, armazenamos elas no estado `loadedRoms` e carregamos automaticamente a primeira ROM da lista.

Para controlar a execução, temos duas funções principais:

```js
const toggleExecution = () => {
  if (!isRunning) {
    chip.resumeAudio();
  }
  setIsRunning(!isRunning);
};

const resetEmulator = () => {
  setIsRunning(false);
  setDebugMode(false);
  chip.reset();
  setRomLoaded(false);
  setSelectedRomIndex(null);
  
  const canvas = canvasRef.current;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 640, 320);
    }
  }
};
```

A função `toggleExecution` alterna entre pausar e continuar. Quando retomamos a execução, precisamos retomar o áudio manualmente, porque os navegadores bloqueiam autoplay de áudio. A função `resetEmulator` limpa completamente o estado: para a execução, desativa o debug, reseta o emulador, remove a ROM carregada e limpa o canvas visualmente.

O modo debug permite executar o emulador instrução por instrução:

```js
const toggleDebugMode = () => {
  setDebugMode(!debugMode);
  if (!debugMode) {
    setIsRunning(false);
  }
};

const stepDebug = () => {
  if (!romLoaded || !debugMode) return;
  try {
    chip.step();
    renderScreen();
  } catch (error) {
    console.error("CPU Error:", error);
  }
};
```

Quando o modo debug é ativado, pausamos automaticamente a execução. A função `stepDebug` executa uma única instrução e renderiza a tela, permitindo inspecionar o estado do emulador passo a passo.

Para as configurações de compatibilidade, cada uma tem seu próprio handler que atualiza o estado e sincroniza com o emulador através de `useEffect`:

```js
const handleVfResetModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setVfResetMode(event.target.checked);
};

useEffect(() => {
  chip.setVfResetMode(vfResetMode);
}, [vfResetMode, chip]);
```

Quando o usuário altera um checkbox de configuração, o estado é atualizado e o `useEffect` detecta a mudança e aplica imediatamente ao emulador. Isso garante que as mudanças tenham efeito instantâneo, sem precisar reiniciar o emulador.

A interface JSX retorna uma estrutura complexa que inclui o modal de confirmação, o container principal com os controles, o canvas do display e o painel de informações com os toggles expansíveis. Cada parte da interface tem sua função específica, trabalhando junto para criar uma experiência de usuário completa e intuitiva.

Assim, o componente `Menu` é o coração da interface do emulador, conectando o usuário ao emulador CHIP-8 de forma intuitiva e eficiente.

## Documentação Detalhada

Para entender melhor cada aspecto do componente, consulte os seguintes documentos:

### [Estados e Gerenciamento de Estado](./menu-estados.md)

Explica todos os estados utilizados pelo componente, incluindo:
- Estados de execução (romLoaded, isRunning, debugMode)
- Estados de ROMs (loadedRoms, selectedRomIndex)
- Estados de interface (toggles)
- Estados de configuração (modos de compatibilidade)
- Referências (refs)

### [Renderização e Game Loop](./menu-renderizacao.md)

Detalha como o display é renderizado e como o emulador é executado:
- Função `renderScreen` e renderização do canvas
- Game loop usando `requestAnimationFrame`
- Atualização da tela a 60 FPS
- Execução de instruções

### [Carregamento de ROMs](./menu-roms.md)

Explica os diferentes métodos de carregamento de ROMs:
- Carregamento de arquivo individual
- Carregamento de pasta inteira
- Seleção de ROM da lista
- Modal de confirmação ao trocar ROMs
- Reset do emulador

### [Controles e Configurações](./menu-controles.md)

Descreve os controles disponíveis e as configurações de compatibilidade:
- Controles de execução (Play/Pause, Reset)
- Modo Debug
- Mapeamento de teclas
- Configurações de compatibilidade (5 opções)
- Sincronização com o emulador

### [Estrutura JSX e Interface](./menu-estrutura.md)

Explica a estrutura completa do JSX e como cada parte da interface é renderizada:
- Modal de confirmação
- Container principal
- Painel de controles
- Seletor de ROMs
- Painel visual e canvas
- Painel de informações
- Overlays e toggles

### [Handlers de Eventos e Funções](./menu-handlers.md)

Detalha todas as funções e handlers de eventos:
- Handlers de carregamento de ROMs
- Handlers de controle de execução
- Handlers de debug
- Handlers de modal
- Handlers de configuração
- Funções auxiliares
- Gerenciamento de áudio

### [Efeitos e Ciclo de Vida](./menu-efeitos.md)

Explica todos os `useEffect` e como gerenciam o ciclo de vida:
- Game loop e execução
- Captura de eventos de teclado
- Renderização inicial
- Sincronização de configurações
- Ordem de execução
- Considerações de performance
