import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaFileUpload, FaPause, FaPlay, FaFolderOpen } from "react-icons/fa";
import { RiResetLeftFill } from "react-icons/ri";
import { VscDebug, VscDebugStepOver } from "react-icons/vsc";
import { Chip8 } from "../../../core/chip8/chip8";
import "./Menu.css";

interface RomFile {
  name: string;
  data: Uint8Array;
}

const Menu = () => {
  const [romLoaded, setRomLoaded] = useState(false);            // carregou rom?
  const [isRunning, setIsRunning] = useState(false);            // está rodando?
  const [debugMode, setDebugMode] = useState(false); // modo debug
  const [loadedRoms, setLoadedRoms] = useState<RomFile[]>([]); // ROMs carregadas da pasta
  const [selectedRomIndex, setSelectedRomIndex] = useState<number | null>(null); // ROM selecionada
  const [showConfirmModal, setShowConfirmModal] = useState(false); // mostra modal de confirmação
  const [pendingRomIndex, setPendingRomIndex] = useState<number | null>(null); // ROM pendente de carregamento

  const chipRef = useRef(new Chip8());
  const chip = chipRef.current;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  

  // Renderizar tela
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

  useEffect(() => {
    let cpuIntervalId: NodeJS.Timeout | undefined;
    let lastScreenUpdate = Date.now();

    const gameLoop = () => {
      if (!isRunning || debugMode) return;

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
  }, [romLoaded, isRunning, debugMode, chip, renderScreen]);


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
        }
      };

      reader.readAsArrayBuffer(file);
    }
  };

  const triggerFileDialog = () => {
    fileInputRef.current?.click();
  };

  const triggerFolderDialog = () => {
    folderInputRef.current?.click();
  };

  // carrega pasta
  const handleFolder = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files).filter(file => 
        file.name.toLowerCase().endsWith('.ch8')
      );

      if (files.length === 0) {
        alert('Nenhum arquivo .ch8 encontrado na pasta selecionada.');
        return;
      }

      const romFiles: RomFile[] = [];

      // Carregar todos os arquivos .ch8 da pasta
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
      // Carregar automaticamente a primeira ROM
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

  // carrega ROM da lista
  const loadRomFromList = (index: number) => {
    if (index >= 0 && index < loadedRoms.length) {
      const romFile = loadedRoms[index];
      chip.loadROM(romFile.data);
      chip.resumeAudio();
      setRomLoaded(true);
      setIsRunning(true);
      setSelectedRomIndex(index);
    }
  };


  // Play/Pause
  const toggleExecution = () => {
    if (!isRunning) {
      chip.resumeAudio(); // Retomar contexto de áudio ao continuar
    }
    setIsRunning(!isRunning);
  };

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

  // resetar estado
  const resetEmulator = () => {
    setIsRunning(false);
    setDebugMode(false);
    chip.reset();
    setRomLoaded(false);
    setSelectedRomIndex(null);
    
    // limpar canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 640, 320);
      }
    }
  };

  // confirmar troca de ROM
  const confirmRomChange = () => {
    if (pendingRomIndex !== null) {
      resetEmulator();
      loadRomFromList(pendingRomIndex);
      setShowConfirmModal(false);
      setPendingRomIndex(null);
    }
  };

  // cancelar troca de ROM
  const cancelRomChange = () => {
    setShowConfirmModal(false);
    setPendingRomIndex(null);
  };

  // (Step removido) execução apenas contínua/pausada; painel mostra o estado

  return (
    <>
      {/* Modal de confirmação */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={cancelRomChange}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Trocar de ROM</h3>
            </div>
            <div className="modal-body">
              <p>A ROM atual está em execução.</p>
              <p>Trocar de ROM irá <strong>reiniciar o emulador</strong> e você perderá o progresso atual.</p>
              <p className="modal-question">Deseja continuar?</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={cancelRomChange}>
                Cancelar
              </button>
              <button className="modal-btn modal-btn-confirm" onClick={confirmRomChange}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    <div className="container">
      {/* GitHub icon floating */}
      <a className="gh-float" href="https://github.com/alexsousadev/chip8dive" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
        <svg viewBox="0 0 16 16" width="22" height="22" aria-hidden="true">
          <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"></path>
        </svg>
      </a>
      {/* Debug button floating */}
      {romLoaded && (
        <button className="debug-float" onClick={toggleDebugMode}>
          {debugMode ? <> <VscDebug /> Sair do Debug </> : <> <VscDebug /> Debug </>}
        </button>
      )}
      {/* Card de controles */}
      <div className="controls-panel">
        <div className="header">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFile}
            accept=".ch8"
            style={{ display: 'none' }}
          />
          <input
            ref={folderInputRef}
            type="file"
            onChange={handleFolder}
            // @ts-ignore - webkitdirectory is not in the type definitions
            webkitdirectory=""
            style={{ display: 'none' }}
          />
          <div className="controls">
            <button onClick={triggerFileDialog}> <FaFileUpload /> Carregar ROM</button>
            <button onClick={triggerFolderDialog}> <FaFolderOpen /> Carregar Pasta</button>
            {loadedRoms.length > 0 && (
              <div className="rom-selector-menu">
                <select
                  className="rom-select"
                  value={selectedRomIndex !== null ? selectedRomIndex : ''}
                  onChange={(e) => {
                    const index = parseInt(e.target.value);
                    if (isNaN(index)) return;
                    if (index === selectedRomIndex) return;
                    if (isRunning) {
                      // Mostrar modal de confirmação
                      setPendingRomIndex(index);
                      setShowConfirmModal(true);
                    } else {
                      loadRomFromList(index);
                    }
                  }}
                >
                  <option value="">Selecione uma ROM...</option>
                  {loadedRoms.map((rom, index) => (
                    <option key={index} value={index}>
                      {rom.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {romLoaded && (
              <>
                <button onClick={toggleExecution} disabled={debugMode}>
                  {isRunning ? <> <FaPause /> Pausar </> : <> <FaPlay /> Continuar </>}
                </button>
                <button onClick={resetEmulator}> <RiResetLeftFill /> Reset</button>
                {debugMode && (
                  <button onClick={stepDebug}> <VscDebugStepOver /> Step</button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Card de visualização */}
      <div className="panel-row">
        <div className="state-visual-panel">
          <div className="screen">
            {romLoaded ? (
              <canvas 
                ref={canvasRef}
                width="640" 
                height="320"
                style={{
                  imageRendering: 'pixelated'
                }}
              />
            ) : (
              <div className="load-hint">CARREGUE UMA ROM</div>
            )}
          </div>
          <div className="info-panel">
            <h3>Informações</h3>
            <ul>
              <li>O emulador aceita as ROMS no formato .ch8</li>
              <li>Se você não estiver ouvindo nenhum som durante a execução dos jogos, verifique se o seu navegador está permitindo a reprodução de áudio</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Menu;
