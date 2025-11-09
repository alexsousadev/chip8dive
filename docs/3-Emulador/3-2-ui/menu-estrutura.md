# Estrutura JSX e Interface

O componente `Menu` retorna uma estrutura JSX complexa que organiza todos os elementos da interface. Esta seção explica cada parte da estrutura e como ela é renderizada.

## Estrutura Geral

O componente retorna um Fragment (`<>...</>`) que contém dois elementos principais:

1. **Modal de Confirmação**: Renderizado condicionalmente quando necessário
2. **Container Principal**: Contém toda a interface do emulador

```js
return (
  <>
    {showConfirmModal && (
      // Modal de confirmação
    )}
    <div className="container">
      // Interface principal
    </div>
  </>
);
```

## Modal de Confirmação

O modal aparece quando o usuário tenta trocar de ROM enquanto o emulador está em execução:

```js
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
```

### Estrutura do Modal

- **`modal-overlay`**: Camada de fundo escura que cobre toda a tela. Clicar nela fecha o modal
- **`modal-content`**: Container do conteúdo do modal. `stopPropagation()` impede que cliques dentro do modal fechem ele
- **`modal-header`**: Cabeçalho com o título do modal
- **`modal-body`**: Corpo com a mensagem de aviso
- **`modal-footer`**: Rodapé com os botões de ação

### Comportamento

- **Cancelar**: Fecha o modal sem fazer nada
- **Confirmar**: Reseta o emulador e carrega a ROM pendente

## Container Principal

O container principal (`div.container`) envolve toda a interface:

```js
<div className="container">
  <GitHubLink />
  {romLoaded && (
    <button className="debug-float" onClick={toggleDebugMode}>
      {debugMode ? <> <VscDebug /> Sair do Debug </> : <> <VscDebug /> Debug </>}
    </button>
  )}
  <div className="controls-panel">
    // Painel de controles
  </div>
  <div className="panel-row">
    // Painel visual e informações
  </div>
</div>
```

### Elementos do Container

1. **GitHubLink**: Componente compartilhado que exibe um link para o repositório GitHub
2. **Botão de Debug**: Aparece apenas quando uma ROM está carregada. É um botão flutuante no canto superior direito
3. **Painel de Controles**: Contém os botões de ação e o seletor de ROMs
4. **Painel Visual**: Contém o canvas do display e o painel de informações

## Painel de Controles

O painel de controles (`controls-panel`) contém os inputs ocultos e os botões de ação:

```js
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
      webkitdirectory=""
      style={{ display: 'none' }}
    />
    <div className="controls">
      // Botões de ação
    </div>
  </div>
</div>
```

### Inputs Ocultos

Os inputs de arquivo são ocultos (`display: 'none'`) e acionados programaticamente:

- **`fileInputRef`**: Input para selecionar um arquivo individual
- **`folderInputRef`**: Input para selecionar uma pasta inteira. O atributo `webkitdirectory=""` permite selecionar pastas

### Botões de Ação

Os botões são renderizados dentro de `div.controls`:

```js
<div className="controls">
  <button onClick={triggerFileDialog}>
    <FaFileUpload /> Carregar ROM
  </button>
  <button onClick={triggerFolderDialog}>
    <FaFolderOpen /> Carregar Pasta
  </button>
  {loadedRoms.length > 0 && (
    // Seletor de ROMs
  )}
  {romLoaded && (
    <>
      <button onClick={toggleExecution} disabled={debugMode}>
        {isRunning ? <> <FaPause /> Pausar </> : <> <FaPlay /> Continuar </>}
      </button>
      <button onClick={resetEmulator}>
        <RiResetLeftFill /> Reset
      </button>
      {debugMode && (
        <button onClick={stepDebug}>
          <VscDebugStepOver /> Step
        </button>
      )}
    </>
  )}
</div>
```

### Funções de Trigger

As funções `triggerFileDialog` e `triggerFolderDialog` acionam os inputs ocultos:

```js
const triggerFileDialog = () => {
  fileInputRef.current?.click();
};

const triggerFolderDialog = () => {
  folderInputRef.current?.click();
};
```

Essas funções simulam um clique no input, abrindo o diálogo de seleção de arquivo/pasta do sistema operacional.

## Seletor de ROMs

O seletor de ROMs aparece quando há ROMs carregadas:

```js
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
```

### Lógica do Seletor

1. **Validação**: Verifica se o índice é válido e diferente do atual
2. **Execução**: Se o emulador está rodando, mostra o modal de confirmação
3. **Carregamento**: Se não está rodando, carrega a ROM imediatamente

## Painel Visual

O painel visual (`panel-row`) contém o display e o painel de informações:

```js
<div className="panel-row">
  <div className="state-visual-panel">
    <div className="screen">
      {romLoaded ? (
        <canvas 
          ref={canvasRef}
          width="640" 
          height="320"
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        <div className="load-hint">CARREGUE UMA ROM</div>
      )}
    </div>
    <div className="info-panel">
      // Painel de informações
    </div>
  </div>
</div>
```

### Canvas do Display

O canvas é renderizado apenas quando uma ROM está carregada:

- **Dimensões**: 640x320 pixels (10x ampliação do display CHIP-8 de 64x32)
- **Estilo**: `imageRendering: 'pixelated'` garante pixels nítidos sem suavização
- **Referência**: `canvasRef` permite acesso direto ao elemento DOM

### Mensagem de Carregamento

Quando não há ROM carregada, uma mensagem é exibida: "CARREGUE UMA ROM"

## Painel de Informações

O painel de informações (`info-panel`) contém três seções expansíveis:

1. **Informações**: Dicas gerais sobre o emulador
2. **Controles**: Tabela de mapeamento de teclas
3. **Configurações**: Opções de compatibilidade

### Estrutura de Toggles

Cada seção usa um padrão de toggle (expansível/colapsável):

```js
<button 
  className="toggle-header"
  onClick={() => setInfoToggleOpen(!infoToggleOpen)}
>
  <span>Informações</span>
  <span className="toggle-icon">{infoToggleOpen ? '−' : '+'}</span>
</button>
{infoToggleOpen && (
  <div className="toggle-content">
    // Conteúdo da seção
  </div>
)}
```

### Seção de Informações

A seção de informações exibe dicas gerais:

```js
{infoToggleOpen && (
  <div className="toggle-content">
    <ul>
      <li>O emulador aceita ROMs no formato .ch8 ou arquivos binários sem extensão</li>
      <li>Se você não estiver ouvindo nenhum som durante a execução dos jogos, verifique se o seu navegador está permitindo a reprodução de áudio</li>
    </ul>
  </div>
)}
```

### Seção de Controles

A seção de controles exibe uma tabela visual do mapeamento de teclas. Esta seção usa um overlay posicionado acima do toggle.

### Seção de Configurações

A seção de configurações exibe as opções de compatibilidade. Cada opção tem um checkbox e uma descrição expansível.

## Overlays

As seções de Controles e Configurações usam overlays que aparecem acima do toggle:

```js
<div className="config-overlay">
  <div className="config-overlay-header">
    <span>Título</span>
    <button
      type="button"
      className="config-overlay-close"
      onClick={() => setControlsToggleOpen(false)}
      aria-label="Fechar"
    >
      ×
    </button>
  </div>
  <div className="config-options">
    // Conteúdo do overlay
  </div>
</div>
```

### Características dos Overlays

- **Posicionamento**: Posicionados acima do toggle usando CSS `position: absolute`
- **Fechamento**: Podem ser fechados clicando no botão × ou clicando fora (para controles)
- **Responsividade**: Em telas pequenas, mudam para `position: fixed` para melhor visualização

## Estrutura CSS

A estrutura CSS está organizada em `Menu.css` e define:

- Layout principal e containers
- Estilos de botões e controles
- Estilos do canvas e display
- Estilos dos toggles e overlays
- Estilos do modal
- Responsividade para diferentes tamanhos de tela

Cada classe CSS corresponde a um elemento específico do JSX, criando uma interface visual consistente e responsiva.

