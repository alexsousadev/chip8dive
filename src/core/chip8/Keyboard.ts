export class Keyboard {
    private keys: Map<string, number>;
    private keysState: Map<number, boolean>;
    private statusForKeyPress: boolean; // Status da tecla pressionada
    private lastKeyPressed: string; // Última tecla pressionada
    private keyPressReleaseFlag: boolean = false; // Flag para indicar que a tecla foi solta

    constructor() {
        this.statusForKeyPress = false;
        this.lastKeyPressed = "";

        this.keys = new Map([
            ["1", 0x1], ["2", 0x2], ['3', 0x3], ['4', 0xC],
            ['q', 0x4], ['w', 0x5], ['e', 0x6], ['r', 0xD],
            ['a', 0x7], ['s', 0x8], ['d', 0x9], ['f', 0xE],
            ['z', 0xA], ['x', 0x0], ['c', 0xB], ['v', 0xF]
          ]);

          this.keysState = new Map([
            [0x1, false], [0x2, false], [0x3, false], [0x4, false],
            [0x5, false], [0x6, false], [0x7, false], [0x8, false],
            [0x9, false], [0xA, false], [0xB, false], [0xC, false],
            [0xD, false], [0xE, false], [0xF, false], [0x0, false]
          ]);
    }

    getKeyState(key: number): boolean {
        return this.keysState.get(key) || false;
    }


    setKeyState(key: string, value: boolean) {
        if (this.keys.has(key)) {
            const keyCode = this.keys.get(key)!;
            this.keysState.set(keyCode, value);
            console.log(`Key ${key} (${keyCode}) set to ${value}`);
            if (!value) { // Key released
                this.keyPressReleaseFlag = true;
                this.lastKeyPressed = key;
            }
        }
        console.log(this.keysState);
    }

    keyIsPressed(key: number): boolean {
        return this.keysState.get(key) || false;
    }

    setStatusForKeyPress(status: boolean) {
        this.statusForKeyPress = status;
    }

    getStatusForKeyPress(): boolean {
        return this.statusForKeyPress;
    }

    isKeyPressReleased(): boolean {
        return this.keyPressReleaseFlag;
    }

    resetKeyPressReleaseFlag() {
        this.keyPressReleaseFlag = false;
    }

    getLastKeyPressed(): string {
        return this.lastKeyPressed;
    }

    getKeysState(): Map<number, boolean> {
        return new Map(this.keysState);
    }

    getKeyMapping(): Map<string, number> {
        return new Map(this.keys);
    }

}
