O gerenciamento de estado do componente `Menu` começa pela necessidade de controlar o que está acontecendo no emulador e na interface. O componente usa vários estados para gerenciar toda a lógica da interface e do emulador.

Vamos começar pelos estados de execução, que controlam o ciclo de vida básico do emulador:

```js
const [romLoaded, setRomLoaded] = useState(false);
const [isRunning, setIsRunning] = useState(false);
const [debugMode, setDebugMode] = useState(false);
```

O estado `romLoaded` indica se uma ROM foi carregada no emulador. Quando é `true`, significa que há um jogo pronto para ser executado. O estado `isRunning` controla se o emulador está rodando ou pausado — é como um botão de play/pause. O estado `debugMode` ativa o modo debug, onde o emulador executa instrução por instrução, permitindo inspecionar o que está acontecendo passo a passo.

Para permitir que o usuário carregue múltiplas ROMs de uma vez, precisamos de mais estados:

```js
const [loadedRoms, setLoadedRoms] = useState<RomFile[]>([]);
const [selectedRomIndex, setSelectedRomIndex] = useState<number | null>(null);
const [showConfirmModal, setShowConfirmModal] = useState(false);
const [pendingRomIndex, setPendingRomIndex] = useState<number | null>(null);
```

Quando o usuário carrega uma pasta inteira, todas as ROMs são armazenadas em `loadedRoms`. O `selectedRomIndex` guarda qual ROM está atualmente selecionada. Se o usuário tentar trocar de ROM enquanto o jogo está rodando, mostramos um modal de confirmação — por isso temos `showConfirmModal` e `pendingRomIndex`, que guarda qual ROM o usuário quer carregar enquanto aguarda a confirmação.

Para controlar a exibição de seções expansíveis na interface, usamos estados de toggle:

```js
const [infoToggleOpen, setInfoToggleOpen] = useState(false);
const [controlsToggleOpen, setControlsToggleOpen] = useState(false);
const [configToggleOpen, setConfigToggleOpen] = useState(false);
```

Cada toggle controla uma seção diferente: `infoToggleOpen` controla a seção de informações, `controlsToggleOpen` controla a seção de controles/mapeamento de teclas, e `configToggleOpen` controla a seção de configurações de compatibilidade. Quando um toggle é `true`, a seção correspondente está expandida e visível.

Agora, vamos pensar nas configurações de compatibilidade. O emulador oferece cinco configurações que podem ser ajustadas, e cada uma tem seu próprio estado:

```js
const chipRef = useRef(new Chip8());
const chip = chipRef.current;
const [memoryIncrementMode, setMemoryIncrementMode] = useState(chip.getMemoryIncrementMode());
const [shiftMode, setShiftMode] = useState(chip.getShiftMode());
const [clippingMode, setClippingMode] = useState(chip.getClippingMode());
const [vfResetMode, setVfResetMode] = useState(chip.getVfResetMode());
const [jumpWithVxMode, setJumpWithVxMode] = useState(chip.getJumpWithVxMode());
```

Cada estado corresponde a uma configuração de compatibilidade. Inicializamos cada estado com o valor atual do emulador através dos métodos getter correspondentes. Isso garante que a interface reflita o estado atual do emulador quando o componente é montado.

O `memoryIncrementMode` controla se o registrador I é incrementado durante operações de memória. O `shiftMode` controla o comportamento legado das operações de shift. O `clippingMode` controla se sprites são cortados nas bordas da tela. O `vfResetMode` controla se VF é zerado antes de operações lógicas. O `jumpWithVxMode` controla o comportamento de salto com VX.

Para controlar quais descrições de configuração estão visíveis, usamos um objeto de estado:

```js
const [configDescriptionOpen, setConfigDescriptionOpen] = useState({
  vfReset: false,
  memoryIncrement: false,
  shiftLegacy: false,
  clipping: false,
  jumpWithVx: false,
});
```

Cada propriedade do objeto corresponde a uma configuração e indica se a descrição dela está expandida ou não. Isso permite que cada opção de configuração tenha sua própria descrição expansível, melhorando a usabilidade sem poluir a interface.

Agora, vamos pensar nas referências (refs). O componente usa refs para acessar elementos DOM e manter instâncias:

```js
const canvasRef = useRef<HTMLCanvasElement>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
const folderInputRef = useRef<HTMLInputElement>(null);
const chipRef = useRef(new Chip8());
```

O `canvasRef` é uma referência ao canvas onde o display CHIP-8 é renderizado. Precisamos dessa referência para poder desenhar no canvas. O `fileInputRef` e `folderInputRef` são referências aos inputs de arquivo e pasta, que são ocultos na interface. Usamos essas referências para acionar programaticamente os diálogos de seleção de arquivo/pasta quando o usuário clica nos botões correspondentes.

O `chipRef` é especial: ele mantém a instância do emulador CHIP-8. Usamos `useRef` aqui porque não queremos que o emulador seja recriado toda vez que o componente renderiza. Se usássemos `useState`, o emulador seria recriado a cada render, fazendo perder todo o estado do jogo. Com `useRef`, o emulador é criado apenas uma vez quando o componente é montado pela primeira vez, e a mesma instância é mantida entre renderizações.

Para sincronizar os estados de configuração com o emulador, usamos `useEffect`:

```js
useEffect(() => {
  chip.setMemoryIncrementMode(memoryIncrementMode);
}, [memoryIncrementMode, chip]);
```

Cada mudança em um estado de configuração é imediatamente aplicada ao emulador através do método setter correspondente. Isso garante que as alterações tenham efeito instantâneo, sem precisar reiniciar o emulador. O `useEffect` observa mudanças no estado da configuração e na instância do emulador, e aplica a mudança sempre que qualquer um deles muda.

Assim, os estados e refs trabalham juntos para gerenciar toda a lógica da interface e do emulador, permitindo que o usuário controle completamente o sistema.
