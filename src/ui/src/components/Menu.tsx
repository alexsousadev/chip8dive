import React, { useState, useEffect, useRef } from "react";
import { Chip8 } from "../../../core/chip8/chip8";
import "./Menu.css";

const Menu = () => {
  const [romLoaded, setRomLoaded] = useState(false);            // Já carregou o rom?
  const [screenData, setScreenData] = useState<number[][]>([]); // Dados da tela
  const [isRunning, setIsRunning] = useState(false);            // Está rodando?

  const chipRef = useRef(new Chip8());
  const chip = chipRef.current;

  useEffect(() => {
    let cpuIntervalId: NodeJS.Timeout;
    let screenUpdateId: NodeJS.Timeout;

    // A cada ms, executa 10 instruções = 600 instruções por segundo
    const runCpu = () => {
        if (isRunning) {
        try {
          for (let i = 0; i < 10; i++) {
            chip.step();
          }
        } catch (error) {
          console.error("CPU Error:", error);
          setIsRunning(false);
        }
      }
    };

    // Atualiza a tela com o estado atual da tela da instância do chip8
    const updateScreen = () => {
      const currentScreen = chip.getScreen();
      setScreenData([...currentScreen]);
    };

    // Se o rom está carregado e está rodando, executa o cpu e a tela a cada 16ms e 33ms
    if (romLoaded && isRunning) {
      cpuIntervalId = setInterval(runCpu, 16); 
      screenUpdateId = setInterval(updateScreen, 33); 
    }

    return () => {
      if (cpuIntervalId) clearInterval(cpuIntervalId);
      if (screenUpdateId) clearInterval(screenUpdateId);
    };
  }, [romLoaded, isRunning, chip]);


  // Carrega o arquivo e envia o conteúdo para o chip8
  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onloadend = (event) => {
        const result = event.target?.result;
        if (result instanceof ArrayBuffer) {
          const romData = new Uint8Array(result);
          chip.loadROM(romData);
          setRomLoaded(true);
          setIsRunning(true);
        }
      };

      reader.readAsArrayBuffer(file);
    }
  };

  // Inicia ou para a execução do chip8
  const toggleExecution = () => {
    setIsRunning(!isRunning);
  };

  // Reseta o chip8 e limpa a tela
  const resetEmulator = () => {
    setIsRunning(false);
    chip.reset();
    setScreenData([]);
    setRomLoaded(false);
  };

  return (
    <div className="container">
      <div className="header">
        <p>Selecione um arquivo ROM (.ch8) para começar:</p>
        <input type="file" onChange={handleFile} accept=".ch8" />
        {romLoaded && (
          <div className="controls">
            <button onClick={toggleExecution}>
              {isRunning ? 'Pausar' : 'Continuar'}
            </button>
            <button onClick={resetEmulator}>Reset</button>
          </div>
        )}
      </div>
      
      {romLoaded && (
        <div className="screen">
          <canvas 
            width="640" 
            height="320"
            style={{
              imageRendering: 'pixelated',
              width: '640px',
              height: '320px'
            }}
            ref={(canvas) => {
            // Só desenha se o canvas existe e se a tela não está vazia
              if (canvas && screenData.length > 0) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.fillStyle = '#001100';
                  ctx.fillRect(0, 0, 640, 320);
                  ctx.fillStyle = '#00ff00';
                  
                  for (let y = 0; y < screenData.length; y++) {
                    for (let x = 0; x < screenData[y].length; x++) {
                      // Verifica se o pixel está ligado
                      // Se estiver, desenha um pixel verde (retângulo) na posição x,y
                      if (screenData[y][x]) {
                        ctx.fillRect(x * 10, y * 10, 10, 10);
                      }
                    }
                  }
                }
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Menu;
