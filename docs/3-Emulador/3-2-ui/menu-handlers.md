# Handlers de Eventos e Funções

O componente `Menu` possui várias funções que lidam com eventos do usuário e gerenciam a lógica do emulador. Esta seção explica cada handler e função em detalhes.

## Handlers de Carregamento de ROMs

### handleFile

Processa o carregamento de um arquivo ROM individual:

```js
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

**Processo**:
1. Verifica se há arquivos selecionados
2. Pega o primeiro arquivo da lista
3. Valida o nome do arquivo
4. Cria um `FileReader` para ler o arquivo
5. Quando a leitura termina (`onloadend`), converte o `ArrayBuffer` para `Uint8Array`
6. Carrega a ROM no emulador
7. Retoma o áudio (necessário devido a políticas de autoplay dos navegadores)
8. Atualiza os estados para indicar que uma ROM foi carregada e está rodando

### handleFolder

Processa o carregamento de múltiplas ROMs de uma pasta:

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
    // Carrega automaticamente a primeira ROM da pasta
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

**Processo**:
1. Converte a lista de arquivos para um array
2. Filtra apenas arquivos válidos
3. Verifica se há arquivos válidos
4. Para cada arquivo, cria uma Promise que lê o arquivo
5. Quando todas as Promises são resolvidas, armazena as ROMs no estado
6. Carrega automaticamente a primeira ROM da lista

**Uso de Promises**: Cada arquivo é lido de forma assíncrona usando uma Promise, permitindo que múltiplos arquivos sejam processados sequencialmente.

### loadRomFromList

Carrega uma ROM específica da lista de ROMs já carregadas:

```js
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
```

**Validação**: Verifica se o índice é válido antes de carregar a ROM.

## Handlers de Controle de Execução

### toggleExecution

Alterna entre pausar e continuar a execução:

```js
const toggleExecution = () => {
  // Retoma áudio ao continuar (navegadores bloqueiam autoplay)
  if (!isRunning) {
    chip.resumeAudio();
  }
  setIsRunning(!isRunning);
};
```

**Comportamento**:
- Quando pausado (`!isRunning`): Retoma o áudio antes de continuar
- Quando rodando: Apenas pausa a execução

**Áudio**: O áudio precisa ser retomado manualmente devido a políticas de autoplay dos navegadores modernos.

### resetEmulator

Reinicia completamente o emulador:

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

**Processo**:
1. Para a execução
2. Desativa o modo debug
3. Reseta o emulador (limpa memória, registradores, etc.)
4. Remove a ROM carregada do estado
5. Limpa o índice da ROM selecionada
6. Limpa o canvas visualmente

**Limpeza do Canvas**: O canvas é limpo manualmente para garantir que nenhum pixel antigo permaneça visível.

## Handlers de Debug

### toggleDebugMode

Alterna o modo debug:

```js
const toggleDebugMode = () => {
  setDebugMode(!debugMode);
  if (!debugMode) {
    setIsRunning(false);
  }
};
```

**Comportamento**:
- Quando ativado: Pausa automaticamente a execução
- Quando desativado: Permite que a execução continue normalmente

### stepDebug

Executa uma única instrução no modo debug:

```js
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

**Validação**: Verifica se há uma ROM carregada e se o modo debug está ativo.

**Processo**:
1. Executa uma única instrução através de `chip.step()`
2. Renderiza a tela para mostrar o resultado
3. Trata erros silenciosamente (apenas loga no console)

## Handlers de Modal

### confirmRomChange

Confirma a troca de ROM:

```js
const confirmRomChange = () => {
  if (pendingRomIndex !== null) {
    resetEmulator();
    loadRomFromList(pendingRomIndex);
    setShowConfirmModal(false);
    setPendingRomIndex(null);
  }
};
```

**Processo**:
1. Reseta o emulador completamente
2. Carrega a ROM pendente
3. Fecha o modal
4. Limpa o índice pendente

### cancelRomChange

Cancela a troca de ROM:

```js
const cancelRomChange = () => {
  setShowConfirmModal(false);
  setPendingRomIndex(null);
};
```

**Processo**: Apenas fecha o modal e limpa o índice pendente, sem fazer alterações no emulador.

## Handlers de Configuração

Cada configuração tem seu próprio handler que atualiza o estado correspondente:

```js
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
```

**Padrão**: Todos seguem o mesmo padrão - pegam o valor do checkbox (`event.target.checked`) e atualizam o estado correspondente.

**Sincronização**: Os estados são sincronizados com o emulador através de `useEffect`, garantindo que as mudanças tenham efeito imediato.

## Funções Auxiliares

### triggerFileDialog

Abre o diálogo de seleção de arquivo:

```js
const triggerFileDialog = () => {
  fileInputRef.current?.click();
};
```

**Uso**: Simula um clique no input de arquivo oculto, abrindo o diálogo nativo do sistema operacional.

### triggerFolderDialog

Abre o diálogo de seleção de pasta:

```js
const triggerFolderDialog = () => {
  folderInputRef.current?.click();
};
```

**Uso**: Simula um clique no input de pasta oculto, abrindo o diálogo nativo do sistema operacional.

### isValidRomFile

Valida se um arquivo é uma ROM válida:

```js
const isValidRomFile = (fileName: string): boolean => {
  const lowerName = fileName.toLowerCase();
  // Aceita arquivos .ch8 ou arquivos binários sem extensão
  return lowerName.endsWith('.ch8') || !lowerName.includes('.');
};
```

**Validação**:
- Aceita arquivos com extensão `.ch8`
- Aceita arquivos sem extensão (arquivos binários puros)

**Case-insensitive**: A validação é feita em minúsculas para evitar problemas com diferentes casos.

## Gerenciamento de Áudio

O áudio é gerenciado através de `chip.resumeAudio()`, que é chamado:

1. **Ao carregar uma ROM**: Garante que o áudio esteja pronto para tocar
2. **Ao continuar a execução**: Retoma o áudio após pausar
3. **Ao carregar uma ROM da lista**: Garante que o áudio esteja ativo

**Política de Autoplay**: Navegadores modernos bloqueiam autoplay de áudio, então o áudio precisa ser retomado manualmente após uma interação do usuário.

