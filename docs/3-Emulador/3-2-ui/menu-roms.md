O carregamento de ROMs começa pela necessidade de permitir que o usuário carregue jogos no emulador. O componente oferece três formas de fazer isso: carregar um arquivo individual, carregar uma pasta inteira, ou selecionar uma ROM de uma lista já carregada.

Vamos começar pelo carregamento de um arquivo individual. Quando o usuário seleciona um arquivo, precisamos lê-lo e carregá-lo no emulador:

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

Primeiro, verificamos se há arquivos selecionados. Pegamos o primeiro arquivo da lista (o input de arquivo permite selecionar apenas um arquivo por vez). Depois, validamos se o arquivo é uma ROM válida — aceitamos arquivos com extensão `.ch8` ou arquivos binários sem extensão.

Se o arquivo não for válido, mostramos um alerta e retornamos sem fazer nada. Se for válido, criamos um `FileReader`, que é a API do navegador para ler arquivos. Quando a leitura termina (`onloadend`), o resultado vem como um `ArrayBuffer`, que é um buffer de dados binários brutos. Precisamos converter isso para um `Uint8Array`, que é uma view tipada que permite acessar os bytes individuais.

Depois de converter, carregamos a ROM no emulador através de `chip.loadROM()`. Retomamos o áudio manualmente porque os navegadores modernos bloqueiam autoplay de áudio — então precisamos de uma interação do usuário (neste caso, selecionar o arquivo) para poder tocar áudio. Por fim, atualizamos os estados para indicar que uma ROM foi carregada e está rodando.

A função `isValidRomFile` verifica se um arquivo é uma ROM válida:

```js
const isValidRomFile = (fileName: string): boolean => {
  const lowerName = fileName.toLowerCase();
  // Aceita arquivos .ch8 ou arquivos binários sem extensão
  return lowerName.endsWith('.ch8') || !lowerName.includes('.');
};
```

Convertemos o nome para minúsculas antes de verificar, garantindo que arquivos como `PONG.CH8` ou `pong.ch8` sejam aceitos. Aceitamos arquivos com extensão `.ch8` ou arquivos sem extensão (sem ponto no nome), que são tratados como binários puros.

Agora, vamos pensar no carregamento de uma pasta inteira. Quando o usuário seleciona uma pasta, precisamos processar todos os arquivos válidos dela:

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

Primeiro, convertemos a lista de arquivos para um array e filtramos apenas os arquivos válidos. Se não houver arquivos válidos, mostramos um alerta e retornamos.

Para cada arquivo válido, criamos uma Promise que lê o arquivo de forma assíncrona. Quando a leitura termina com sucesso, resolvemos a Promise com um objeto contendo o nome do arquivo e os dados como `Uint8Array`. Se ocorrer um erro, rejeitamos a Promise.

O loop `for...of` aguarda cada Promise antes de processar o próximo arquivo. Isso garante que os arquivos sejam processados sequencialmente, evitando sobrecarregar o navegador com múltiplas leituras simultâneas. Quando todas as ROMs são carregadas, armazenamos elas no estado `loadedRoms` e carregamos automaticamente a primeira ROM da lista.

A interface `RomFile` define a estrutura de dados para uma ROM carregada:

```js
interface RomFile {
  name: string;
  data: Uint8Array;
}
```

Cada ROM carregada tem um nome (o nome do arquivo) e os dados binários como um `Uint8Array`. Isso permite que o usuário troque entre diferentes ROMs sem precisar recarregá-las do disco.

Para carregar uma ROM específica da lista já carregada, usamos a função `loadRomFromList`:

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

Primeiro, validamos se o índice é válido. Se for, pegamos a ROM correspondente da lista, carregamos ela no emulador, retomamos o áudio, atualizamos os estados e definimos o índice selecionado.

Mas há um problema: se o usuário tentar trocar de ROM enquanto o emulador está rodando, ele perderá o progresso atual. Por isso, mostramos um modal de confirmação:

```js
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
```

Quando o usuário confirma a troca, resetamos o emulador completamente, carregamos a ROM pendente, fechamos o modal e limpamos o índice pendente. Se cancelar, apenas fechamos o modal e limpamos o índice pendente, sem fazer alterações no emulador.

O seletor de ROMs aparece quando há ROMs carregadas e permite que o usuário escolha qual ROM carregar:

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
```

Quando o usuário seleciona uma ROM diferente, verificamos se o emulador está rodando. Se estiver, mostramos o modal de confirmação. Se não estiver, carregamos a ROM imediatamente.

A função `resetEmulator` limpa completamente o estado do emulador:

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

Ela para a execução, desativa o debug, reseta o emulador (limpa memória, registradores, etc.), remove a ROM carregada do estado, limpa o índice selecionado e limpa o canvas visualmente. Isso garante que nenhum pixel antigo permaneça visível quando o emulador é resetado.
