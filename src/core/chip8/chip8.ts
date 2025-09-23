import { CPU } from "./CPU";
import { Display } from "./Display";
import { Keyboard } from "./Keyboard";
import { Memory } from "./Memory";

export class Chip8 {
    private cpu: CPU;
    private memory: Memory;
    private display: Display;
    private keyboard: Keyboard;

    constructor() {
        this.memory = new Memory();
        this.display = new Display();
        this.keyboard = new Keyboard();
        this.cpu = new CPU(this.memory, this.display, this.keyboard);
    }

    // debugar a memória
    debugMemory() {
        return `memória: ${this.memory.getByte(0x200)}\n`;
    }

    loadROM(romContent: Uint8Array) {
        this.memory.loadROMInRAM(romContent as Buffer);
    }

    start() {
        this.cpu.run();
    }

    // Executar uma única instrução
    step() {
        this.cpu.step();
    }

    // Resetar o emulador
    reset() {
        this.cpu.reset();
    }

    getScreen() {
        return this.display.getDisplay();
    }

    setKeyState(key: string, value: boolean) {
        this.keyboard.setKeyState(key, value);
    }
}