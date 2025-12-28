import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaFileUpload, FaPause, FaPlay, FaFolderOpen } from "react-icons/fa";
import { RiResetLeftFill } from "react-icons/ri";
import { VscDebug, VscDebugStepOver } from "react-icons/vsc";
import { Chip8 } from "../../../core/chip8/chip8";
import { GitHubLink } from "./shared/GitHubLink";
import "./Menu.css";

interface RomFile {
  name: string;
  data: Uint8Array;
}

const Menu = () => {
  const [romLoaded, setRomLoaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [loadedRoms, setLoadedRoms] = useState<RomFile[]>([]);
  const [selectedRomIndex, setSelectedRomIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingRomIndex, setPendingRomIndex] = useState<number | null>(null);
  const [infoToggleOpen, setInfoToggleOpen] = useState(false);
  const [controlsToggleOpen, setControlsToggleOpen] = useState(false);
  const [configToggleOpen, setConfigToggleOpen] = useState(false);
  const chipRef = useRef(new Chip8());
  const chip = chipRef.current;
  const currentRomRef = useRef<Uint8Array | null>(null);
  const [memoryIncrementMode, setMemoryIncrementMode] = useState(chip.getMemoryIncrementMode());
  const [shiftMode, setShiftMode] = useState(chip.getShiftMode());
  const [clippingMode, setClippingMode] = useState(chip.getClippingMode());
  const [vfResetMode, setVfResetMode] = useState(chip.getVfResetMode());
  const [jumpWithVxMode, setJumpWithVxMode] = useState(chip.getJumpWithVxMode());
  const [configDescriptionOpen, setConfigDescriptionOpen] = useState({
    vfReset: false,
    memoryIncrement: false,
    shiftLegacy: false,
    clipping: false,
    jumpWithVx: false,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  

  // Renderiza o display CHIP-8 no canvas: cada pixel 64x32 é desenhado como 10x10
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


  // Mapeia eventos de teclado do navegador para o emulador CHIP-8
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

  useEffect(() => {
    if (romLoaded) {
      renderScreen();
    }
  }, [romLoaded, chip, renderScreen]);

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

  const handleMemoryIncrementModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMemoryIncrementMode(event.target.checked);
  };

  const handleShiftModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShiftMode(event.target.checked);
  };

  const handleClippingModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setClippingMode(event.target.checked);
  };

  const handleVfResetModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVfResetMode(event.target.checked);
  };

  const handleJumpWithVxModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setJumpWithVxMode(event.target.checked);
  };


  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      
      // Valida se o arquivo é uma ROM válida
      if (!isValidRomFile(file.name)) {
        alert('Por favor, selecione um arquivo ROM válido (.ch8 ou binário sem extensão).');
        return;
      }
      
      const reader = new FileReader();

      reader.onloadend = (event) => {
        const result = event.target?.result;
        if (result instanceof ArrayBuffer) {
          const romData = new Uint8Array(result);
          currentRomRef.current = romData;
          chip.loadROM(romData);
          chip.resumeAudio();
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

  const isValidRomFile = (fileName: string): boolean => {
    const lowerName = fileName.toLowerCase();
    // Aceita arquivos .ch8 ou arquivos binários sem extensão
    return lowerName.endsWith('.ch8') || !lowerName.includes('.');
  };

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
      // Carrega automaticamente a primeira ROM da pasta
      if (romFiles.length > 0) {
        const firstRom = romFiles[0];
        currentRomRef.current = firstRom.data;
        chip.loadROM(firstRom.data);
        chip.resumeAudio();
        setRomLoaded(true);
        setIsRunning(true);
        setSelectedRomIndex(0);
      }
    }
  };

  const loadRomFromList = (index: number) => {
    if (index >= 0 && index < loadedRoms.length) {
      const romFile = loadedRoms[index];
      currentRomRef.current = romFile.data;
      chip.loadROM(romFile.data);
      chip.resumeAudio();
      setRomLoaded(true);
      setIsRunning(true);
      setSelectedRomIndex(index);
    }
  };


  const toggleExecution = () => {
    // Retoma áudio ao continuar (navegadores bloqueiam autoplay)
    if (!isRunning) {
      chip.resumeAudio();
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

  const restartCurrentGame = () => {
    if (!romLoaded || !currentRomRef.current) {
      return;
    }

    setIsRunning(false);
    setDebugMode(false);
    chip.reset();
    chip.loadROM(currentRomRef.current);
    chip.resumeAudio();
    setIsRunning(true);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 640, 320);
      }
    }
  };

  const confirmRomChange = () => {
    if (pendingRomIndex !== null) {
      resetEmulator();
      loadRomFromList(pendingRomIndex);
      setShowConfirmModal(false);
      setPendingRomIndex(null);
    }
  };

  const cancelRomChange = () => {
    setShowConfirmModal(false);
    setPendingRomIndex(null);
  };

  return (
    <>
      {showConfirmModal && (
        <div className="modal-overlay" onClick={cancelRomChange}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>[!] Trocar de ROM</h3>
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
      <GitHubLink />
      {romLoaded && (
        <button className="debug-float" onClick={toggleDebugMode}>
          {debugMode ? <> <VscDebug /> Sair do Debug </> : <> <VscDebug /> Debug </>}
        </button>
      )}
      <div className="controls-panel">
        <div className="header">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
          <input
            ref={folderInputRef}
            type="file"
            onChange={handleFolder}
            // @ts-ignore - webkitdirectory não está nas definições de tipo do React
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
                    // Se em execução, pede confirmação antes de trocar ROM
                    if (isRunning) {
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
                <button onClick={restartCurrentGame}> <RiResetLeftFill /> Reset</button>
                {debugMode && (
                  <button onClick={stepDebug}> <VscDebugStepOver /> Step</button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
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
            <div className="toggle-list">
              <button 
                className="toggle-header"
                onClick={() => setInfoToggleOpen(!infoToggleOpen)}
              >
                <span>Informações</span>
                <span className="toggle-icon">{infoToggleOpen ? '−' : '+'}</span>
              </button>
              {infoToggleOpen && (
                <div className="toggle-content">
                  <ul>
                    <li>O emulador aceita ROMs no formato .ch8 ou arquivos binários sem extensão</li>
                    <li>Se você não estiver ouvindo nenhum som durante a execução dos jogos, verifique se o seu navegador está permitindo a reprodução de áudio</li>
                    <li>Você pode obter ROMs em Domínio Público em sites como <a href="https://www.zophar.net/pdroms/chip8.html" target="_blank" rel="noopener noreferrer">Zophar's Domain</a></li>
                  
                  </ul>
                </div>
              )}
              <div className="config-wrapper">
                <button 
                  className="toggle-header"
                  onClick={() => setControlsToggleOpen(!controlsToggleOpen)}
                >
                  <span>Controles</span>
                  <span className="toggle-icon">{controlsToggleOpen ? '−' : '+'}</span>
                </button>
                {controlsToggleOpen && (
                  <div className="config-overlay controls-overlay">
                    <div className="config-overlay-header">
                      <span>Mapeamento de Teclas</span>
                      <button
                        type="button"
                        className="config-overlay-close"
                        onClick={() => setControlsToggleOpen(false)}
                        aria-label="Fechar controles"
                      >
                        ×
                      </button>
                    </div>
                    <div className="controls-table-container">
                      <div className="keyboard-grid">
                        <div className="grid-title">Teclado</div>
                        <table className="retro-grid-table">
                          <tbody>
                            <tr>
                              <td>1</td>
                              <td>2</td>
                              <td>3</td>
                              <td>4</td>
                            </tr>
                            <tr>
                              <td>Q</td>
                              <td>W</td>
                              <td>E</td>
                              <td>R</td>
                            </tr>
                            <tr>
                              <td>A</td>
                              <td>S</td>
                              <td>D</td>
                              <td>F</td>
                            </tr>
                            <tr>
                              <td>Z</td>
                              <td>X</td>
                              <td>C</td>
                              <td>V</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="arrow-container">
                        <span className="arrow">→</span>
                      </div>
                      <div className="chip8-grid">
                        <div className="grid-title">CHIP-8</div>
                        <table className="retro-grid-table">
                          <tbody>
                            <tr>
                              <td>1</td>
                              <td>2</td>
                              <td>3</td>
                              <td>C</td>
                            </tr>
                            <tr>
                              <td>4</td>
                              <td>5</td>
                              <td>6</td>
                              <td>D</td>
                            </tr>
                            <tr>
                              <td>7</td>
                              <td>8</td>
                              <td>9</td>
                              <td>E</td>
                            </tr>
                            <tr>
                              <td>A</td>
                              <td>0</td>
                              <td>B</td>
                              <td>F</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="config-wrapper">
                <button 
                  className="toggle-header"
                  onClick={() => setConfigToggleOpen(!configToggleOpen)}
                >
                  <span>Configurações</span>
                  <span className="toggle-icon">{configToggleOpen ? '−' : '+'}</span>
                </button>
                {configToggleOpen && (
                  <div className="config-overlay">
                    <div className="config-overlay-header">
                      <span>Ajustes de Compatibilidade</span>
                      <button
                        type="button"
                        className="config-overlay-close"
                        onClick={() => setConfigToggleOpen(false)}
                        aria-label="Fechar configurações"
                      >
                        ×
                      </button>
                    </div>
                    <div className="config-options">
                      <div className={`config-option ${configDescriptionOpen.vfReset ? "active" : ""}`}>
                        <label className="config-label">
                          <input
                            type="checkbox"
                            checked={vfResetMode}
                            onChange={handleVfResetModeChange}
                            className="config-checkbox"
                          />
                          <button
                            type="button"
                            className="config-text"
                            onClick={() =>
                              setConfigDescriptionOpen(prev => ({
                                ...prev,
                                vfReset: !prev.vfReset,
                              }))
                            }
                          >
                            <strong>Reset de VF</strong>
                            <span className={`config-description ${configDescriptionOpen.vfReset ? "visible" : ""}`}>
                              Zera o registrador VF antes das operações 8XY1/8XY2/8XY3, refletindo o comportamento original do COSMAC VIP.
                            </span>
                          </button>
                        </label>
                      </div>
                      <div className={`config-option ${configDescriptionOpen.memoryIncrement ? "active" : ""}`}>
                        <label className="config-label">
                          <input
                            type="checkbox"
                            checked={memoryIncrementMode}
                            onChange={handleMemoryIncrementModeChange}
                            className="config-checkbox"
                          />
                          <button
                            type="button"
                            className="config-text"
                            onClick={() =>
                              setConfigDescriptionOpen(prev => ({
                                ...prev,
                                memoryIncrement: !prev.memoryIncrement,
                              }))
                            }
                          >
                            <strong>Incremento do Registrador I</strong>
                            <span className={`config-description ${configDescriptionOpen.memoryIncrement ? "visible" : ""}`}>
                              Quando ativo, as instruções FX55 e FX65 avançam o registrador I a cada byte salvo ou carregado, como nos intérpretes da década de 1970.
                            </span>
                          </button>
                        </label>
                      </div>
                      <div className={`config-option ${configDescriptionOpen.shiftLegacy ? "active" : ""}`}>
                        <label className="config-label">
                          <input
                            type="checkbox"
                            checked={shiftMode}
                            onChange={handleShiftModeChange}
                            className="config-checkbox"
                          />
                          <button
                            type="button"
                            className="config-text"
                            onClick={() =>
                              setConfigDescriptionOpen(prev => ({
                                ...prev,
                                shiftLegacy: !prev.shiftLegacy,
                              }))
                            }
                          >
                            <strong>Operação de Shift Legada</strong>
                            <span className={`config-description ${configDescriptionOpen.shiftLegacy ? "visible" : ""}`}>
                              Faz com que 8XY6 e 8XYE copiem VY para VX antes de aplicar o deslocamento, compatível com o COSMAC VIP.
                            </span>
                          </button>
                        </label>
                      </div>
                      <div className={`config-option ${configDescriptionOpen.clipping ? "active" : ""}`}>
                        <label className="config-label">
                          <input
                            type="checkbox"
                            checked={clippingMode}
                            onChange={handleClippingModeChange}
                            className="config-checkbox"
                          />
                          <button
                            type="button"
                            className="config-text"
                            onClick={() =>
                              setConfigDescriptionOpen(prev => ({
                                ...prev,
                                clipping: !prev.clipping,
                              }))
                            }
                          >
                            <strong>Clipping de Sprites</strong>
                            <span className={`config-description ${configDescriptionOpen.clipping ? "visible" : ""}`}>
                              Mantém os sprites dentro da tela sem wrap-around. Desative para permitir que ultrapassem as bordas e reapareçam do outro lado.
                            </span>
                          </button>
                        </label>
                      </div>
                      <div className={`config-option ${configDescriptionOpen.jumpWithVx ? "active" : ""}`}>
                        <label className="config-label">
                          <input
                            type="checkbox"
                            checked={jumpWithVxMode}
                            onChange={handleJumpWithVxModeChange}
                            className="config-checkbox"
                          />
                          <button
                            type="button"
                            className="config-text"
                            onClick={() =>
                              setConfigDescriptionOpen(prev => ({
                                ...prev,
                                jumpWithVx: !prev.jumpWithVx,
                              }))
                            }
                          >
                            <strong>Operação Jumping Legada</strong>
                            <span className={`config-description ${configDescriptionOpen.jumpWithVx ? "visible" : ""}`}>
                              Faz com que o salto BNNN use VX como offset em vez de V0, igual às variantes CHIP-48 e SUPER-CHIP.
                            </span>
                          </button>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Menu;
