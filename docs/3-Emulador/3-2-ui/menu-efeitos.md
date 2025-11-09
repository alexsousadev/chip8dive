# Efeitos e Ciclo de Vida

O componente `Menu` utiliza vários `useEffect` para gerenciar efeitos colaterais e sincronizar estados. Esta seção explica cada efeito e como ele funciona.

## Game Loop

O efeito mais complexo gerencia o loop de execução do emulador:

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

### Variáveis Locais

O efeito usa variáveis locais para manter o estado do loop:

- **`animationFrameId`**: ID do frame de animação atual, usado para cancelar o loop
- **`lastScreenUpdate`**: Timestamp da última atualização da tela
- **`shouldRun`**: Flag que controla se o loop deve continuar executando

### Função gameLoop

A função `gameLoop` é definida dentro do efeito e é chamada recursivamente:

1. **Verificação de Condições**: Verifica se o loop deve continuar
2. **Execução de Instruções**: Executa 10.000 instruções por frame
3. **Atualização da Tela**: Atualiza a tela a aproximadamente 60 FPS
4. **Tratamento de Erros**: Pausa o emulador se ocorrer um erro
5. **Recursão**: Agenda o próximo frame usando `requestAnimationFrame`

### Inicialização

O loop é iniciado quando:
- Uma ROM está carregada (`romLoaded`)
- O emulador está rodando (`isRunning`)
- O modo debug está desativado (`!debugMode`)

### Limpeza

A função de limpeza:
1. Define `shouldRun` como `false` para parar o loop
2. Cancela o frame de animação pendente

### Dependências

O efeito depende de:
- `romLoaded`: Para saber se há uma ROM carregada
- `isRunning`: Para saber se deve executar
- `debugMode`: Para saber se está em modo debug
- `chip`: Instância do emulador
- `renderScreen`: Função de renderização

## Captura de Eventos de Teclado

Este efeito captura eventos de teclado globalmente:

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

### Handlers

- **`handleKeyPress`**: Chamado quando uma tecla é pressionada. Define o estado da tecla como `true` no emulador
- **`handleKeyRelease`**: Chamado quando uma tecla é solta. Define o estado da tecla como `false` no emulador

### Escopo Global

Os eventos são adicionados à `window`, permitindo que o emulador capture teclas mesmo quando o foco não está no componente.

### Limpeza

A função de limpeza remove os event listeners para evitar vazamentos de memória.

### Dependências

O efeito depende apenas de `chip`, pois os handlers usam a instância do emulador.

## Renderização Inicial

Este efeito renderiza a tela quando uma ROM é carregada:

```js
useEffect(() => {
  if (romLoaded) {
    renderScreen();
  }
}, [romLoaded, chip, renderScreen]);
```

### Propósito

Garante que o usuário veja o estado inicial do display assim que uma ROM for carregada, antes do game loop começar.

### Dependências

- `romLoaded`: Para saber quando renderizar
- `chip`: Instância do emulador
- `renderScreen`: Função de renderização

## Sincronização de Configurações

Cada configuração tem seu próprio efeito para sincronizar com o emulador:

```js
useEffect(() => {
  chip.setMemoryIncrementMode(memoryIncrementMode);
}, [memoryIncrementMode, chip]);

useEffect(() => {
  chip.setShiftMode(shiftMode);
}, [shiftMode, chip]);

useEffect(() => {
  chip.setClippingMode(clippingMode);
}, [clippingMode, chip]);

useEffect(() => {
  chip.setVfResetMode(vfResetMode);
}, [vfResetMode, chip]);

useEffect(() => {
  chip.setJumpWithVxMode(jumpWithVxMode);
}, [jumpWithVxMode, chip]);
```

### Padrão

Todos seguem o mesmo padrão:
1. Observam mudanças no estado da configuração
2. Aplicam a mudança ao emulador imediatamente
3. Dependem do estado da configuração e da instância do emulador

### Sincronização Imediata

As configurações são aplicadas imediatamente quando o usuário altera um checkbox, sem necessidade de reiniciar o emulador.

## Ordem de Execução

Os efeitos são executados na seguinte ordem:

1. **Configurações**: Sincronizam os estados iniciais com o emulador
2. **Teclado**: Adiciona os event listeners
3. **Renderização Inicial**: Renderiza a tela se houver ROM carregada
4. **Game Loop**: Inicia o loop se as condições forem atendidas

## Considerações de Performance

### useCallback

A função `renderScreen` é envolvida em `useCallback` para evitar recriações desnecessárias:

```js
const renderScreen = useCallback(() => {
  // ...
}, [chip]);
```

Isso garante que a função seja recriada apenas quando `chip` mudar, otimizando o desempenho do game loop.

### requestAnimationFrame

O uso de `requestAnimationFrame` garante que o loop seja executado na taxa de atualização do navegador, geralmente 60 FPS, otimizando o uso de recursos.

### Limpeza Adequada

Todos os efeitos têm funções de limpeza adequadas para evitar vazamentos de memória e comportamentos inesperados quando o componente é desmontado ou as dependências mudam.

