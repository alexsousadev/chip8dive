import { Chip8 } from "./chip8/chip8";
import { readFileSync } from "fs";
import { join } from "path";

const readRom = (file: string) => {
    const buffer = readFileSync(file);
    return buffer;
}

function main() {
    const romPath = join(__dirname, "roms", "chip8-logo.ch8");
    const rom = readRom(romPath);
    const chip = new Chip8();
    chip.loadROM(rom);
    chip.start();
}

main();