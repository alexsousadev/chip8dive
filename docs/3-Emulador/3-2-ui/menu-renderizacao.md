A renderização do display CHIP-8 começa pela necessidade de mostrar os gráficos do emulador na tela do navegador. O CHIP-8 original tinha uma tela de 64×32 pixels, mas isso seria muito pequeno para ver no computador. Então, vamos ampliar cada pixel para 10×10 pixels, resultando em um canvas de 640×320 pixels.

A função `renderScreen` é responsável por desenhar cada pixel do display no canvas:

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

Primeiro, precisamos acessar o canvas através da referência `canvasRef`. Se o canvas não existir ainda, simplesmente retornamos sem fazer nada. Depois, obtemos o contexto 2D do canvas, que é o que nos permite desenhar nele.

Agora, pegamos os dados do display do emulador através de `chip.getScreen()`. Isso retorna uma matriz bidimensional de booleanos, onde cada posição indica se o pixel está ativo ou não. O display CHIP-8 tem 32 linhas e 64 colunas, então `screenData[y][x]` indica se o pixel na posição (x, y) está ativo.

Antes de desenhar, limpamos o canvas completamente para remover o frame anterior. Depois, definimos a cor de preenchimento como branco (`#ffffff`), porque o CHIP-8 usa pixels branos sobre fundo preto.

Agora vem o loop que percorre cada pixel do display. Para cada linha (`y`) e cada coluna (`x`), verificamos se o pixel está ativo. Se estiver (`screenData[y][x] === true`), desenhamos um quadrado branco de 10×10 pixels na posição correspondente do canvas. Como cada pixel CHIP-8 é ampliado 10 vezes, multiplicamos as coordenadas por 10.

O `useCallback` aqui é importante porque garante que a função não seja recriada a cada render. Isso otimiza o desempenho do game loop, que chama essa função muitas vezes por segundo.

Agora, vamos pensar no game loop. Este é o coração da execução do emulador. Ele precisa executar o emulador continuamente, mas também precisa atualizar a tela a uma taxa adequada para que a animação seja suave:

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

O game loop funciona assim: em cada iteração, executamos 10.000 instruções do emulador. Esse número alto garante que o emulador execute em velocidade adequada, independente da velocidade do navegador. O CHIP-8 original executava a aproximadamente 500-700 instruções por segundo, então executar 10.000 instruções por frame (a 60 FPS) garante que o emulador execute em velocidade adequada.

Mas a tela só é atualizada a aproximadamente 60 FPS (a cada 16.67ms), mesmo que muitas instruções sejam executadas entre atualizações. Isso cria uma experiência visual suave enquanto mantém a precisão temporal. Usamos `Date.now()` para medir o tempo desde a última atualização e só renderizamos quando passaram pelo menos 16.67ms.

O loop só executa se houver uma ROM carregada, se o emulador estiver rodando e se o modo debug estiver desativado. Quando qualquer uma dessas condições muda, o loop é cancelado através da função de limpeza do `useEffect`.

Usamos `requestAnimationFrame` para agendar o próximo frame. Isso garante que o loop seja executado na taxa de atualização do navegador, geralmente 60 FPS, otimizando o uso de recursos. Quando o componente é desmontado ou as condições mudam, cancelamos o frame pendente através de `cancelAnimationFrame`.

Se ocorrer um erro durante a execução, capturamos ele no bloco `try-catch`, logamos no console e pausamos o emulador automaticamente. Isso evita que o emulador trave completamente se algo der errado.

Quando uma ROM é carregada, queremos renderizar a tela imediatamente para que o usuário veja o estado inicial do display:

```js
useEffect(() => {
  if (romLoaded) {
    renderScreen();
  }
}, [romLoaded, chip, renderScreen]);
```

Este efeito simples verifica se uma ROM foi carregada e, se sim, renderiza a tela. Isso garante que o usuário veja o estado inicial do display assim que a ROM for carregada, antes do game loop começar a executar.

O canvas é renderizado no JSX com configurações específicas:

```js
<canvas 
  ref={canvasRef}
  width="640" 
  height="320"
  style={{
    imageRendering: 'pixelated'
  }}
/>
```

A propriedade `imageRendering: 'pixelated'` é crucial aqui. Ela garante que os pixels sejam renderizados de forma nítida, sem suavização. Isso mantém a estética retro do CHIP-8, onde cada pixel é claramente visível. Sem essa propriedade, o navegador tentaria suavizar os pixels, o que estragaria a aparência pixelada característica do CHIP-8.

O método `chip.getScreen()` retorna uma matriz bidimensional de booleanos, onde cada posição indica se o pixel está ativo ou não. O display CHIP-8 tem 32 linhas e 64 colunas, então `screenData[y][x]` indica se o pixel na posição (x, y) está ativo.

O algoritmo de renderização percorre cada pixel do display CHIP-8 e desenha um quadrado branco de 10×10 pixels para cada pixel ativo. É um algoritmo simples e eficiente, mas poderia ser otimizado usando técnicas como dirty rectangles (renderizar apenas áreas que mudaram) ou WebGL (usar aceleração de hardware). No entanto, para um display de 64×32 pixels, a abordagem atual é mais que suficiente em termos de performance.
