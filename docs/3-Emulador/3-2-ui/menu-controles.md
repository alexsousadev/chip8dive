Os controles do emulador começam pela necessidade de permitir que o usuário controle a execução do jogo. O componente oferece várias formas de fazer isso: pausar e continuar a execução, resetar o emulador, e ativar o modo debug para executar instrução por instrução.

Vamos começar pelo controle de execução. O botão de Play/Pause alterna entre pausar e continuar a execução:

```js
const toggleExecution = () => {
  // Retoma áudio ao continuar (navegadores bloqueiam autoplay)
  if (!isRunning) {
    chip.resumeAudio();
  }
  setIsRunning(!isRunning);
};
```

Quando o usuário clica no botão, verificamos se o emulador está pausado. Se estiver, retomamos o áudio antes de continuar, porque os navegadores modernos bloqueiam autoplay de áudio — então precisamos de uma interação do usuário para poder tocar áudio. Depois, alternamos o estado `isRunning`, que controla se o emulador está rodando ou pausado.

O botão Reset reinicia completamente o emulador:

```js
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

Primeiro, paramos a execução e desativamos o modo debug. Depois, resetamos o emulador através de `chip.reset()`, que limpa a memória, os registradores e todos os estados internos. Removemos a ROM carregada do estado e limpamos o índice selecionado. Por fim, limpamos o canvas visualmente para garantir que nenhum pixel antigo permaneça visível.

O modo debug permite executar o emulador instrução por instrução, o que é útil para entender como o jogo funciona ou para debugar problemas:

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

Quando o modo debug é ativado, pausamos automaticamente a execução. Isso faz sentido porque no modo debug queremos controlar manualmente cada instrução. A função `stepDebug` executa uma única instrução através de `chip.step()` e renderiza a tela para mostrar o resultado. Se ocorrer um erro, apenas logamos no console sem travar o emulador.

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

Quando uma tecla é pressionada, definimos o estado dela como `true` no emulador. Quando é solta, definimos como `false`. Os eventos são capturados globalmente na `window`, então o emulador responde às teclas mesmo quando o foco não está diretamente no componente. Isso é importante porque o usuário pode estar interagindo com outros elementos da interface.

O componente exibe uma tabela visual mostrando o mapeamento entre o teclado do computador e o teclado CHIP-8. O CHIP-8 original tinha um teclado hexadecimal com 16 teclas (0-9 e A-F), e mapeamos isso para o teclado do computador de forma intuitiva:

```
Teclado → CHIP-8
1 2 3 4  →  1 2 3 C
Q W E R  →  4 5 6 D
A S D F  →  7 8 9 E
Z X C V  →  A 0 B F
```

Cada tecla do teclado corresponde a uma tecla CHIP-8 na mesma posição visual. Por exemplo, a tecla `1` do teclado mapeia para a tecla `1` do CHIP-8, a tecla `Q` mapeia para a tecla `4`, e assim por diante.

Agora, vamos pensar nas configurações de compatibilidade. O CHIP-8 original tinha algumas variações e comportamentos diferentes entre diferentes implementações. Para permitir que o emulador seja compatível com diferentes ROMs, oferecemos cinco configurações que podem ser ajustadas:

```js
const handleVfResetModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setVfResetMode(event.target.checked);
};

useEffect(() => {
  chip.setVfResetMode(vfResetMode);
}, [vfResetMode, chip]);
```

Cada configuração tem seu próprio handler que atualiza o estado quando o usuário altera o checkbox. O `useEffect` detecta a mudança e aplica imediatamente ao emulador através do método correspondente. Isso garante que as mudanças tenham efeito instantâneo, sem precisar reiniciar o emulador.

A primeira configuração é o **Reset de VF**. Quando ativada, zera o registrador VF antes das operações lógicas 8XY1/8XY2/8XY3, refletindo o comportamento original do COSMAC VIP. Isso é importante porque algumas ROMs esperam esse comportamento específico.

A segunda configuração é o **Incremento do Registrador I**. Quando ativada, as instruções FX55 e FX65 avançam o registrador I a cada byte salvo ou carregado, como nos intérpretes da década de 1970. Isso é necessário para compatibilidade com ROMs antigas.

A terceira configuração é a **Operação de Shift Legada**. Quando ativada, faz com que 8XY6 e 8XYE copiem VY para VX antes de aplicar o deslocamento, compatível com o COSMAC VIP. Isso é importante porque algumas ROMs esperam esse comportamento específico.

A quarta configuração é o **Clipping de Sprites**. Quando ativada, mantém os sprites dentro da tela sem wrap-around. Quando desativada, permite que os sprites ultrapassem as bordas e reapareçam do outro lado. Isso afeta como os sprites são desenhados na tela.

A quinta configuração é a **Operação Jumping Legada**. Quando ativada, faz com que o salto BNNN use VX como offset em vez de V0, igual às variantes CHIP-48 e SUPER-CHIP. Isso é necessário para compatibilidade com ROMs dessas variantes.

Cada configuração tem uma descrição expansível que explica o que ela faz. Quando o usuário clica no título da configuração, a descrição é expandida ou colapsada, permitindo que o usuário entenda o que cada opção faz sem poluir a interface.

A interface de configurações usa overlays que aparecem acima dos toggles. Isso permite que o usuário veja as configurações sem perder o contexto da interface principal. Em telas pequenas, os overlays mudam para `position: fixed` e se ajustam ao tamanho da tela, garantindo melhor visualização em dispositivos móveis.

Assim, os controles e configurações permitem que o usuário controle completamente o emulador e ajuste o comportamento conforme necessário para compatibilidade com diferentes ROMs.
