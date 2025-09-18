import { Display } from "./Display";
import { Memory } from "./Memory";

export class Chip8 {
    private memory: Memory;
    private display: Display;

    constructor() {
        this.memory = new Memory();
        this.display = new Display();
    }

    // Debugar a memória
    showMemory() {
        return `memoria: ${this.memory.getByte(0x200)}\n`;
    }

    loadROM(romContent: Uint8Array) {
        this.memory.loadROMInRAM(romContent as Buffer);
    }

    getScreen() {
        return this.display.getDisplay();
    }
}