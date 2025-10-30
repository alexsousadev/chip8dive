import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chip8 } from "../../../core/chip8/chip8";
import "./Menu.css";

const Menu = () => {
  const [romLoaded, setRomLoaded] = useState(false);            // carregou rom?
  const [isRunning, setIsRunning] = useState(false);            // está rodando?
  const [cpuState, setCPUState] = useState<any>(null); // estado da CPU
  const [romName, setRomName] = useState<string>(""); // nome do arquivo

  const chipRef = useRef(new Chip8());
  const chip = chipRef.current;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Renderizar tela
  const renderScreen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const screenData = chip.getScreen();
    
    ctx.fillStyle = '#001100';
    ctx.fillRect(0, 0, 640, 320);
    ctx.fillStyle = '#00ff00';
    
    for (let y = 0; y < screenData.length; y++) {
      for (let x = 0; x < screenData[y].length; x++) {
        if (screenData[y][x]) {
          ctx.fillRect(x * 10, y * 10, 10, 10);
        }
      }
    }
  }, [chip]);

  useEffect(() => {
    let cpuIntervalId: NodeJS.Timeout | undefined;
    let lastCpuStateUpdate = Date.now();
    let lastScreenUpdate = Date.now();

    const gameLoop = () => {
      if (!isRunning) return;

      try {
        // 10 instruções por ciclo
        for (let i = 0; i < 10; i++) {
          chip.step();
        }

        const now = Date.now();
        
        // atualizar tela ~30 FPS
        if (now - lastScreenUpdate >= 33) {
          renderScreen();
          lastScreenUpdate = now;
        }

        // atualizar estado CPU a cada 100ms
        if (now - lastCpuStateUpdate >= 100) {
          const state = chip.getCPUState();
          setCPUState(state);
          lastCpuStateUpdate = now;
        }
      } catch (error) {
        console.error("CPU Error:", error);
        setIsRunning(false);
      }
    };

    if (romLoaded && isRunning) {
      cpuIntervalId = setInterval(gameLoop, 16);
    }

    return () => {
      if (cpuIntervalId) clearInterval(cpuIntervalId);
    };
  }, [romLoaded, isRunning, chip, renderScreen]);


  // teclas > chip8
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

  // inicializar ao carregar ROM
  useEffect(() => {
    if (romLoaded) {
      renderScreen();
      setCPUState(chip.getCPUState());
    }
  }, [romLoaded, chip, renderScreen]);


  // carrega arquivo
  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onloadend = (event) => {
        const result = event.target?.result;
        if (result instanceof ArrayBuffer) {
          const romData = new Uint8Array(result);
          chip.loadROM(romData);
          chip.resumeAudio(); // Retomar contexto de áudio
          setRomLoaded(true);
          setIsRunning(true);
          setRomName(file.name || "");
        }
      };

      reader.readAsArrayBuffer(file);
    }
  };


  // Play/Pause
  const toggleExecution = () => {
    if (!isRunning) {
      chip.resumeAudio(); // Retomar contexto de áudio ao continuar
    }
    setIsRunning(!isRunning);
  };

  // resetar estado
  const resetEmulator = () => {
    setIsRunning(false);
    chip.reset();
    setRomLoaded(false);
    setCPUState(null);
    
    // limpar canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#001100';
        ctx.fillRect(0, 0, 640, 320);
      }
    }
  };

  // (Step removido) execução apenas contínua/pausada; painel mostra o estado

  return (
    <div className="container">
      {/* Card de controles */}
      <div className="controls-panel">
        <div className="header">
          {!romLoaded && (
            <>
              <p>Selecione um arquivo ROM (.ch8) para começar:</p>
              <input type="file" onChange={handleFile} accept=".ch8" />
            </>
          )}
          {romLoaded && !isRunning && (
            <>
              <p>Selecione um arquivo ROM (.ch8) para começar:</p>
              <input type="file" onChange={handleFile} accept=".ch8" />
            </>
          )}
          {romLoaded && (
            <div className="controls">
              <button onClick={toggleExecution}>
                {isRunning ? 'Pausar' : 'Continuar'}
              </button>
              <button onClick={resetEmulator}>Reset</button>
            </div>
          )}
        </div>
      </div>
      
      {/* Card de visualização */}
      <div className="panel-row">
        <div className="state-visual-panel">
          {romLoaded && cpuState && (
            <div className="registers-panel">
              <h2>Registradores e Estado</h2>
              <div className="registers-row">
                {cpuState.V && cpuState.V.map((v:number,i:number)=>(
                  <span key={i}>V{i.toString(16).toUpperCase()}: <b>{v.toString(16).toUpperCase().padStart(2,'0')}</b> </span>
                ))}
              </div>
              <div className="registers-row"><b>PC:</b> {cpuState.PC?.toString(16).toUpperCase()} &nbsp; <b>I:</b> {cpuState.I?.toString(16).toUpperCase()} &nbsp;<b>SP:</b> {cpuState.SP?.toString(16).toUpperCase()}</div>
              <div className="registers-row"><b>Stack:</b> {[...(cpuState.Stack||[])].map((v:number,i:number)=>(v!==0 ? <span key={i}>{v.toString(16).toUpperCase()} </span> : null))}</div>
              <div className="registers-row"><b>Delay Timer:</b> {cpuState.delayTimer} &nbsp; <b>Sound Timer:</b> {cpuState.soundTimer}</div>
            </div>
          )}
          {romLoaded && (
            <div className="screen">
              <canvas 
                ref={canvasRef}
                width="640" 
                height="320"
                style={{
                  imageRendering: 'pixelated'
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;
