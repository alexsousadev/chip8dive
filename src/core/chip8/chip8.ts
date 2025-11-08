import { CPU, type Chip8Quirks } from "./CPU";
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

    debugMemory() {
        return `memória: ${this.memory.getByte(0x200)}\n`;
    }

    loadROM(romContent: Uint8Array) {
        this.memory.loadROMInRAM(romContent as Buffer);
    }

    start() {
        this.cpu.run();
    }

    step() {
        this.cpu.step();
    }

    reset() {
        this.cpu.reset();
    }

    getScreen() {
        return this.display.getDisplay();
    }

    setKeyState(key: string, value: boolean) {
        this.keyboard.setKeyState(key, value);
    }

    resumeAudio() {
        this.cpu.resumeAudio();
    }

    getCPUState() {
        return this.cpu.getState();
    }

    setMemoryIncrementMode(enabled: boolean) {
        this.cpu.setMemoryIncrementMode(enabled);
    }

    getMemoryIncrementMode(): boolean {
        return this.cpu.getMemoryIncrementMode();
    }

    setShiftMode(enabled: boolean) {
        this.cpu.setShiftMode(enabled);
    }

    getShiftMode(): boolean {
        return this.cpu.getShiftMode();
    }

    setClippingMode(enabled: boolean) {
        this.cpu.setClippingMode(enabled);
    }

    getClippingMode(): boolean {
        return this.cpu.getClippingMode();
    }

    getQuirks(): Chip8Quirks {
        return this.cpu.getQuirks();
    }

    updateQuirks(partial: Partial<Chip8Quirks>) {
        this.cpu.updateQuirks(partial);
    }

    setVfResetMode(enabled: boolean) {
        this.cpu.setVfResetMode(enabled);
    }

    getVfResetMode(): boolean {
        return this.cpu.getVfResetMode();
    }

    setJumpWithVxMode(enabled: boolean) {
        this.cpu.setJumpWithVxMode(enabled);
    }

    getJumpWithVxMode(): boolean {
        return this.cpu.getJumpWithVxMode();
    }
}