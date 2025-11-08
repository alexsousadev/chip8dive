export class Keyboard {
    private keys: Map<string, number>;
    private keysState: Map<number, boolean>;
    private historyOfKeysPressed: string[] = []; // Histórico de teclas pressionadas
    private keyPressTimers: Map<string, NodeJS.Timeout> = new Map(); // Timers para delay das teclas
    private keyPressDelay: number = 200; // Delay em ms antes de adicionar ao histórico
    private keyPressReleaseCycle: Map<string, boolean> = new Map(); // Rastrear ciclo pressionar->soltar
    
    constructor() {
        this.historyOfKeysPressed = [];

        // Map of keys and their corresponding values
        this.keys = new Map([
            ["1", 0x1], ["2", 0x2], ['3', 0x3], ['4', 0xC],
            ['q', 0x4], ['w', 0x5], ['e', 0x6], ['r', 0xD],
            ['a', 0x7], ['s', 0x8], ['d', 0x9], ['f', 0xE],
            ['z', 0xA], ['x', 0x0], ['c', 0xB], ['v', 0xF]
          ]);

          // Map of keys and their corresponding states
          this.keysState = new Map([
            [0x1, false], [0x2, false], [0x3, false], [0x4, false],
            [0x5, false], [0x6, false], [0x7, false], [0x8, false],
            [0x9, false], [0xA, false], [0xB, false], [0xC, false],
            [0xD, false], [0xE, false], [0xF, false], [0x0, false]
          ]);
    }

    setKeyState(key: string, value: boolean) {
        if (this.keys.has(key)) {
            const keyCode = this.keys.get(key)!;
            this.keysState.set(keyCode, value);
            
            if (value) {
                // Tecla pressionada: aguarda delay antes de adicionar ao histórico
                this.keyPressReleaseCycle.set(key, false);
                
                if (this.keyPressTimers.has(key)) {
                    clearTimeout(this.keyPressTimers.get(key)!);
                }
                
                const timer = setTimeout(() => {
                    this.addKeyToHistory(key);
                    this.keyPressTimers.delete(key);
                }, this.keyPressDelay);
                
                this.keyPressTimers.set(key, timer);
            } else {
                // Tecla solta: marca ciclo completo para Fx0A
                this.keyPressReleaseCycle.set(key, true);
                
                if (this.keyPressTimers.has(key)) {
                    clearTimeout(this.keyPressTimers.get(key)!);
                    this.keyPressTimers.delete(key);
                }
            }
        }
    }

    addKeyToHistory(key: string) {
        this.historyOfKeysPressed.push(key);
    }
    
    clearHistory() {
        this.historyOfKeysPressed = [];
    }
    
    getHistoryOfKeysPressed(): string[] {
        return this.historyOfKeysPressed;
    }

    keyIsPressed(key: number): boolean {
        return this.keysState.get(key) || false;
    }

    getKeyMapping(): Map<string, number> {
        return new Map(this.keys);
    }


    isKeyPressReleaseCycleComplete(key: string): boolean {
        return this.keyPressReleaseCycle.get(key) === true;
    }

    clearKeyPressReleaseCycle(key: string) {
        this.keyPressReleaseCycle.delete(key);
    }
}
