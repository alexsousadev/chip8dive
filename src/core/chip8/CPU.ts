import { Disassembler, type IDecodedInstruction } from "./Disassembler";
import { Display } from "./Display";
import { Memory } from "./Memory";
import { Keyboard } from "./Keyboard";
import { Audio } from "./Audio";

export interface Chip8Quirks {
    memoryIncrement: boolean;
    shiftLegacy: boolean;
    clipping: boolean;
    vfReset: boolean;
    jumpWithVx: boolean;
}

export class CPU {
    private memory: Memory;
    private display: Display;
    private readonly SCREEN_WIDTH: number = 64;
    private readonly SCREEN_HEIGHT: number = 32;
    private V: Uint8Array;
    private Stack: Uint16Array;

    private aux_value: number;

    private PC: number;
    private I: number;
    private SP: number;

    private delayTimer: number;
    private soundTimer: number;

    private keyboard: Keyboard;
    private audio: Audio;

    private quirks: Chip8Quirks;

    private lastDrawTime: number = 0;
    private readonly DRAW_INTERVAL_MS: number = 1000 / 60;

    constructor(memory: Memory, display: Display, keyboard: Keyboard, quirks?: Partial<Chip8Quirks>) {
        this.memory = memory;
        this.V = new Uint8Array(16);
        this.Stack = new Uint16Array(16);
        this.display = display;
        this.aux_value = 0;

        this.PC = 0x200;
        this.I = 0;
        this.SP = 0;

        this.delayTimer = 0;
        this.soundTimer = 0;
        this.keyboard = keyboard;
        this.audio = new Audio();

        this.quirks = {
            memoryIncrement: false,
            shiftLegacy: false,
            clipping: false,
            vfReset: false,
            jumpWithVx: false,
            ...quirks,
        };
        this.lastDrawTime = performance.now() - this.DRAW_INTERVAL_MS;
        
        this.startTimers();
    }

    public getQuirks(): Chip8Quirks {
        return { ...this.quirks };
    }

    public updateQuirks(partial: Partial<Chip8Quirks>) {
        this.quirks = { ...this.quirks, ...partial };
    }

    public setMemoryIncrementMode(enabled: boolean) {
        this.updateQuirks({ memoryIncrement: enabled });
    }

    public getMemoryIncrementMode(): boolean {
        return this.quirks.memoryIncrement;
    }

    public setShiftMode(enabled: boolean) {
        this.updateQuirks({ shiftLegacy: enabled });
    }

    public getShiftMode(): boolean {
        return this.quirks.shiftLegacy;
    }

    public setClippingMode(enabled: boolean) {
        this.updateQuirks({ clipping: enabled });
    }

    public getClippingMode(): boolean {
        return this.quirks.clipping;
    }

    public setVfResetMode(enabled: boolean) {
        this.updateQuirks({ vfReset: enabled });
    }

    public getVfResetMode(): boolean {
        return this.quirks.vfReset;
    }

    public setJumpWithVxMode(enabled: boolean) {
        this.updateQuirks({ jumpWithVx: enabled });
    }

    public getJumpWithVxMode(): boolean {
        return this.quirks.jumpWithVx;
    }

    // Wrap-around de coordenadas: garante valores positivos mesmo com módulo negativo
    private wrapCoordinate(value: number, size: number): number {
        let result = value % size;
        if (result < 0) {
            result += size;
        }
        return result;
    }

    public resumeAudio() {
        this.audio.resume();
    }

    startTimers() {
        setInterval(() => {
            if (this.delayTimer > 0) {
                this.delayTimer--;
            }
            // soundTimer controla o beep: inicia quando > 0, para quando chega a 0
            if (this.soundTimer > 0) {
                if (!this.audio.isPlaying()) {
                    this.audio.startBeep();
                }
                this.soundTimer--;
            } else if (this.audio.isPlaying()) {
                this.audio.stopBeep();
            }
        }, 1000 / 60)
    }

    fetch() {
        const msb = this.memory.getByte(this.PC);
        const lsb = this.memory.getByte(this.PC + 1);
        const opcode = msb << 8 | lsb
        return opcode;
    }

    decode(opcode: number) {
        return Disassembler.decode(opcode)
    }

    step() {
        try {
            const opcode = this.fetch();
            const instruction = this.decode(opcode);
            this.execute(instruction);
            // Instruções de desvio já modificam PC, então não incrementamos aqui
            if (!this.isJumpInstruction(instruction.name)) {
                this.PC += 2;
            }
        } catch (error) {
            console.error("Erro na execução da instrução:", error);
        }
    }

    private isJumpInstruction(instructionName: string): boolean {
        return [
            "JUMP_TO_NNN", 
            "CALL_SUBROUTINE_NNN", 
            "RETURN", 
            "JUMP_TO_V0_PLUS_NNN",
            "SKIP_IF_VX_EQUALS_KK", 
            "SKIP_IF_VX_NOT_EQUALS_KK", 
            "SKIP_IF_VX_EQUALS_VY", 
            "SKIP_IF_VX_NOT_EQUALS_VY", 
            "SKIP_IF_KEY_VX_PRESSED", 
            "SKIP_IF_KEY_VX_NOT_PRESSED",
            "WAIT_FOR_KEY_PRESS",
            "DRAW_SPRITE_VX_VY_N"
        ].includes(instructionName);
    }

    run() {
        for (let i = 0; i < 100; i++) {
            this.step();
        }
    }

    reset() {
        // ROMs começam em 0x200 (512 em decimal)
        this.PC = 0x200;
        this.I = 0;
        this.SP = 0;
        this.V.fill(0);
        this.Stack.fill(0);
        this.delayTimer = 0;
        this.soundTimer = 0;
        this.audio.stopBeep();
        this.display.cleanDisplay();
    }

    public getState() {
        return {
            V: Array.from(this.V),
            I: this.I,
            PC: this.PC,
            SP: this.SP,
            Stack: Array.from(this.Stack),
            delayTimer: this.delayTimer,
            soundTimer: this.soundTimer,
        };
    }
        // Executar instrução
    execute(instruction: IDecodedInstruction) {
        switch (instruction.name) {
            case "SYSTEM_CALL":
                // Ignorado
                break;
            case "CLEAR_SCREEN":
                this.display.cleanDisplay();
                break;
            case "RETURN":
                if (this.SP > 0) {
                    this.SP--;
                    this.PC = this.Stack[this.SP];
                }
                break;
                
            // 1nnn
            case "JUMP_TO_NNN":
                this.PC = instruction.nnn;
                break;
                
            // 2nnn
            case "CALL_SUBROUTINE_NNN":
                this.Stack[this.SP++] = this.PC + 2;
                this.PC = instruction.nnn;
                break;
                
            // 3xkk
            case "SKIP_IF_VX_EQUALS_KK":
                if (this.V[instruction.x] === instruction.kk) {
                    this.PC += 4;
                } else {
                    this.PC += 2;
                }
                break;
                
            // 4xkk
            case "SKIP_IF_VX_NOT_EQUALS_KK":
                if (this.V[instruction.x] !== instruction.kk) {
                    this.PC += 4;
                } else {
                    this.PC += 2
                }
                break;
                
            // 5xy0
            case "SKIP_IF_VX_EQUALS_VY":
                if (this.V[instruction.x] === this.V[instruction.y]) {
                    this.PC += 4;
                } else {
                    this.PC += 2; 
                }
                break;
                
            // 6xkk
            case "SET_VX_TO_KK":
                this.V[instruction.x] = instruction.kk;
                
                break;
                
            // 7xkk
            case "ADD_KK_TO_VX":
                this.V[instruction.x] = (this.V[instruction.x] + instruction.kk) & 0xFF;
                break;
                
            // 8xy0
            case "SET_VX_TO_VY":
                this.V[instruction.x] = this.V[instruction.y];
                break;
                
            // 8xy1
            case "SET_VX_TO_VX_OR_VY": {
                const vxValue = this.V[instruction.x];
                const vyValue = this.V[instruction.y];
                this.V[instruction.x] = (vxValue | vyValue) & 0xFF;
                // Quirk: COSMAC VIP zerava VF antes das operações lógicas
                if (this.quirks.vfReset) {
                    this.V[0xF] = 0;
                }
                break;
            }
                
            // 8xy2
            case "SET_VX_TO_VX_AND_VY": {
                const vxValue = this.V[instruction.x];
                const vyValue = this.V[instruction.y];
                this.V[instruction.x] = (vxValue & vyValue) & 0xFF;
                // Quirk: COSMAC VIP zerava VF antes das operações lógicas
                if (this.quirks.vfReset) {
                    this.V[0xF] = 0;
                }
                break;
            }
                
            // 8xy3
            case "SET_VX_TO_VX_XOR_VY": {
                const vxValue = this.V[instruction.x];
                const vyValue = this.V[instruction.y];
                this.V[instruction.x] = (vxValue ^ vyValue) & 0xFF;
                // Quirk: COSMAC VIP zerava VF antes das operações lógicas
                if (this.quirks.vfReset) {
                    this.V[0xF] = 0;
                }
                break;
            }
                
            // 8xy4
            case "ADD_VY_TO_VX_WITH_CARRY":
                // VF = 1 se houve carry (soma > 255), 0 caso contrário
                const sum = this.V[instruction.x] + this.V[instruction.y];
                this.V[instruction.x] = sum & 0xFF;
                this.V[0xF] = sum > 255 ? 1 : 0;
                break;
                
            // 8xy5
            case "SUBTRACT_VY_FROM_VX":
                // VF = 1 se não houve borrow (VX >= VY), 0 caso contrário
                this.aux_value = this.V[instruction.x] - this.V[instruction.y];
                this.V[instruction.x] = this.aux_value & 0xFF;
                this.V[0xF] = this.aux_value < 0 ? 0 : 1;
                break;
                
            // 8xy6 - SHIFT_VX_RIGHT
            case "SHIFT_VX_RIGHT": {
                const originalVx = this.V[instruction.x];
                const originalVy = this.V[instruction.y];
                // Quirk: versões antigas usavam VY em vez de VX
                const valueToShift = this.quirks.shiftLegacy ? originalVy : originalVx;
                const shiftedValue = valueToShift >> 1;
                const lsb = valueToShift & 0x1;

                this.V[instruction.x] = shiftedValue & 0xFF;
                this.V[0xF] = lsb;
                break;
            }
                
            // 8xy7
            case "SET_VX_TO_VY_MINUS_VX":
                // VF = 1 se não houve borrow (VY >= VX), 0 caso contrário
                this.aux_value = this.V[instruction.y] - this.V[instruction.x];
                this.V[instruction.x] = this.aux_value & 0xFF;
                this.V[0xF] = this.aux_value < 0 ? 0 : 1;
                break;
                
            // 8xyE - SHIFT_VX_LEFT
            case "SHIFT_VX_LEFT": {
                const originalVx = this.V[instruction.x];
                const originalVy = this.V[instruction.y];
                // Quirk: versões antigas usavam VY em vez de VX
                const valueToShift = this.quirks.shiftLegacy ? originalVy : originalVx;
                const msb = (valueToShift & 0x80) >> 7;
                const shiftedValue = (valueToShift << 1) & 0xFF;

                this.V[instruction.x] = shiftedValue;
                this.V[0xF] = msb;
                break;
            }
                
            // 9xy0
            case "SKIP_IF_VX_NOT_EQUALS_VY":
                if (this.V[instruction.x] !== this.V[instruction.y]) {
                    this.PC += 4; 
                } else {
                    this.PC += 2; 
                }
                break;
                
            // Annn
            case "SET_I_TO_NNN":
                this.I = instruction.nnn;
                break;
                
            // Bnnn
            case "JUMP_TO_V0_PLUS_NNN":
                // Quirk: SUPER-CHIP usa VX em vez de V0
                if (this.quirks.jumpWithVx) {
                    this.PC = (instruction.nnn + this.V[instruction.x]) & 0xFFF;
                } else {
                    this.PC = (instruction.nnn + this.V[0]) & 0xFFF;
                }
                break;
                
            // Cxkk
            case "SET_VX_TO_RANDOM_AND_KK":
                this.V[instruction.x] = (Math.floor(Math.random() * 256)) & instruction.kk;
                break;
                
            // Dxyn - DRAW_SPRITE com clipping configurável e Display Wait
            case "DRAW_SPRITE_VX_VY_N":
                // Limita desenho a 60 FPS para evitar flicker
                const now = performance.now();
                const timeSinceLastDraw = now - this.lastDrawTime;
                
                if (timeSinceLastDraw < this.DRAW_INTERVAL_MS) {
                    return;
                }
                
                this.lastDrawTime = now;
                
                // VF = 1 se algum pixel foi apagado (colisão)
                this.V[0xF] = 0;
                
                const baseX = this.wrapCoordinate(this.V[instruction.x], this.SCREEN_WIDTH);
                const baseY = this.wrapCoordinate(this.V[instruction.y], this.SCREEN_HEIGHT);
                
                for (let row = 0; row < instruction.n; row++) {
                    const sprite = this.memory.getByte(this.I + row);
                    const yPosRaw = baseY + row;
                    
                    if (this.quirks.clipping) {
                        // Com clipping, para de desenhar se sair da tela
                        if (yPosRaw >= this.SCREEN_HEIGHT) {
                            break;
                        }
                    }
                    
                    const yPos = this.quirks.clipping
                        ? yPosRaw
                        : this.wrapCoordinate(baseY + row, this.SCREEN_HEIGHT);
                    
                    for (let col = 0; col < 8; col++) {
                        if ((sprite & (0x80 >> col)) !== 0) {
                            const xPosRaw = baseX + col;
                            
                            if (this.quirks.clipping && xPosRaw >= this.SCREEN_WIDTH) {
                                continue;
                            }

                            const xPos = this.quirks.clipping
                                ? xPosRaw
                                : this.wrapCoordinate(baseX + col, this.SCREEN_WIDTH);

                            const currentPixel = this.display.getPixel(xPos, yPos);
                            if (currentPixel === 1) {
                                this.V[0xF] = 1;
                            }
                            this.display.setPixel(xPos, yPos, currentPixel ^ 1);
                        }
                    }
                }
                
                this.PC += 2;
                break;
                
            // Ex9E
            case "SKIP_IF_KEY_VX_PRESSED":
                if (this.keyboard.keyIsPressed(this.V[instruction.x])) {
                    this.PC += 4;
                } else {
                    this.PC += 2;
                }
                break;
                
            // ExA1
            case "SKIP_IF_KEY_VX_NOT_PRESSED":
                if (!this.keyboard.keyIsPressed(this.V[instruction.x])) {
                    this.PC += 4;
                } else {
                    this.PC += 2;
                }
                break;
                
            // Fx07
            case "SET_VX_TO_DELAY_TIMER":
                this.V[instruction.x] = this.delayTimer;
                break;
            // Fx0A
            case "WAIT_FOR_KEY_PRESS":    
                // Bloqueia até uma tecla ser pressionada e solta
                // Se não houver tecla pronta, não incrementa PC (repetirá a instrução)
                let historyOfKeysPressed = this.keyboard.getHistoryOfKeysPressed();
                
                if (historyOfKeysPressed.length > 0) {
                    const lastKey = historyOfKeysPressed[historyOfKeysPressed.length - 1];
                    const keyCode = this.keyboard.getKeyMapping().get(lastKey);
                    
                    if (keyCode !== undefined && this.keyboard.isKeyPressReleaseCycleComplete(lastKey)) {
                        this.V[instruction.x] = keyCode;
                        this.keyboard.clearHistory();
                        this.keyboard.clearKeyPressReleaseCycle(lastKey);
                        this.PC += 2;
                    }
                }
                break;
                
            // Fx15
            case "SET_DELAY_TIMER_TO_VX":
                this.delayTimer = this.V[instruction.x];
                break;
                
            // Fx18
            case "SET_SOUND_TIMER_TO_VX":
                this.soundTimer = this.V[instruction.x];
                break;
                
            // Fx1E
            case "ADD_VX_TO_I":
                this.I = (this.I + this.V[instruction.x]) & 0xFFF;
                break;
                
            // Fx29
            case "SET_I_TO_FONT_VX":
                // Fontes começam em 0x050, cada dígito ocupa 5 bytes
                this.I = 0x050 + (this.V[instruction.x] * 5);
                break;
                
            // Fx33
            case "STORE_BCD_VX_AT_I":
                // Converte valor em BCD (Binary Coded Decimal): centenas, dezenas, unidades
                const value = this.V[instruction.x];
                this.memory.setByte(this.I, Math.floor(value / 100));
                this.memory.setByte(this.I + 1, Math.floor((value % 100) / 10));
                this.memory.setByte(this.I + 2, value % 10);
                break;
                
            // Fx55
            case "STORE_V0_TO_VX_AT_I":
                // Quirk: versões antigas incrementavam I durante o loop
                if (this.quirks.memoryIncrement) {
                    for (let i = 0; i <= instruction.x; i++) {
                        this.memory.setByte(this.I, this.V[i]);
                        this.I = (this.I + 1) & 0xFFF;
                    }
                } else {
                    for (let i = 0; i <= instruction.x; i++) {
                        this.memory.setByte(this.I + i, this.V[i]);
                    }
                }
                break;
                
            // Fx65
            case "LOAD_V0_TO_VX_FROM_I":
                // Quirk: versões antigas incrementavam I durante o loop
                if (this.quirks.memoryIncrement) {
                    for (let i = 0; i <= instruction.x; i++) {
                        this.V[i] = this.memory.getByte(this.I);
                        this.I = (this.I + 1) & 0xFFF;
                    }
                } else {
                    for (let i = 0; i <= instruction.x; i++) {
                        this.V[i] = this.memory.getByte(this.I + i);
                    }
                }
                break;
                
            default:
                console.log(`Instrução não implementada: ${instruction.name}`);
                break;
        }
    }
}

export default CPU