import { Disassembler, type IDecodedInstruction } from "./Disassembler";
import { Display } from "./Display";
import { Memory } from "./Memory";
import { Keyboard } from "./Keyboard";

export class CPU {
    private memory: Memory;
    private display: Display;
    private V: Uint8Array;
    private Stack: Uint16Array;

    private aux_value: number;

    private PC: number;
    private I: number;
    private SP: number; // Stack Pointer (Ponteiro da pilha)

    private delayTimer: number; // Delay Timer (Timer de atraso)
    private soundTimer: number; // Sound Timer (Timer de som)

    private keyboard: Keyboard;

    private CLOCK_CPU = 1000 / 500 // Clock da CPU (500 Hz)

    constructor(memory: Memory, display: Display, keyboard: Keyboard) {
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
        
        this.startTimers();
    }

    // Inicializar a contagem dos timers
    startTimers() {
        setInterval(() => {
            if (this.delayTimer > 0) {
                this.delayTimer--;
            }

            if (this.soundTimer > 0) {
                this.soundTimer--;
            }
        }, 1000 / 60)
    }

    fetch() {
        const msb = this.memory.getByte(this.PC);
        const lsb = this.memory.getByte(this.PC + 1);
        // console.log(`\n*************\nPC: ${this.PC}, MSB: ${msb.toString(16)}, LSB: ${lsb.toString(16)}\n`);
        const opcode = msb << 8 | lsb
        return opcode;
    }

    decode(opcode: number) {
        return Disassembler.decode(opcode)
    }

    // Executar uma única instrução
    step() {
        try {
            const opcode = this.fetch();
            const instruction = this.decode(opcode);
            //console.log("\nINSTRUCAO: \n", instruction, "\n*****************\n");
            this.execute(instruction);
            
            // Só incrementar PC se a instrução não foi um desvio
            if (!this.isJumpInstruction(instruction.name)) {
                this.PC += 2;
            }
        } catch (error) {
            console.error("Erro na execução da instrução:", error);
        }
    }

    // Verificar se é uma instrução de desvio
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
            "SKIP_IF_KEY_VX_NOT_PRESSED"
        ].includes(instructionName);
    }

    run() {
        for (let i = 0; i < 10; i++) {
            this.step();
        }
    }

    // Resetar o estado da CPU
    reset() {
        this.PC = 0x200;
        this.I = 0;
        this.SP = 0;
        this.V.fill(0);
        this.Stack.fill(0);
        this.delayTimer = 0;
        this.soundTimer = 0;
        this.display.cleanDisplay();
    }
        execute(instruction: IDecodedInstruction) {
        switch (instruction.name) {
            // 0xxx
            case "SYSTEM_CALL":
                // Ignorado na maioria dos interpretadores modernos
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
                this.V[instruction.x] = (this.V[instruction.x] + instruction.kk)
                break;
                
            // 8xy0
            case "SET_VX_TO_VY":
                this.V[instruction.x] = this.V[instruction.y];
                break;
                
            // 8xy1
            case "SET_VX_TO_VX_OR_VY":
                this.V[instruction.x] |= this.V[instruction.y];
                break;
                
            // 8xy2
            case "SET_VX_TO_VX_AND_VY":
                this.V[instruction.x] &= this.V[instruction.y];
                break;
                
            // 8xy3
            case "SET_VX_TO_VX_XOR_VY":
                this.V[instruction.x] ^= this.V[instruction.y];
                break;
                
            // 8xy4
            case "ADD_VY_TO_VX_WITH_CARRY":
                const sum = this.V[instruction.x] + this.V[instruction.y];
                this.V[instruction.x] = sum & 0xFF;
                this.V[0xF] = sum > 255 ? 1 : 0;
                break;
                
            // 8xy5
            case "SUBTRACT_VY_FROM_VX":
                this.aux_value = this.V[instruction.x] - this.V[instruction.y];
                this.V[instruction.x] = this.aux_value & 0xFF;
                this.V[0xF] = this.aux_value < 0 ? 0 : 1;
                break;
                
            // 8xy6
            case "SHIFT_VX_RIGHT":
                this.aux_value = this.V[instruction.x];
                this.V[instruction.x] = this.V[instruction.y] >> 1;
                this.V[0xF] = this.aux_value & 0x1; 
                break;
                
            // 8xy7
            case "SET_VX_TO_VY_MINUS_VX":
                this.aux_value = this.V[instruction.y] - this.V[instruction.x];
                this.V[instruction.x] = this.aux_value & 0xFF;
                this.V[0xF] = this.aux_value < 0 ? 0 : 1;
                break;
                
            // 8xyE
            case "SHIFT_VX_LEFT":
                this.aux_value = this.V[instruction.x];
                this.V[instruction.x] = (this.aux_value << 1) & 0xFF;
                this.V[0xF] = (this.aux_value & 0x80) >> 7; 
                break;
                
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
                this.PC = (instruction.nnn + this.V[0]) & 0xFFF;
                break;
                
            // Cxkk
            case "SET_VX_TO_RANDOM_AND_KK":
                this.V[instruction.x] = (Math.floor(Math.random() * 256)) & instruction.kk;
                break;
                
            // Dxyn
            case "DRAW_SPRITE_VX_VY_N":
                this.V[0xF] = 0; // Zerar flag de colisão
                
                const vx = this.V[instruction.x];
                const vy = this.V[instruction.y];
                
                for (let row = 0; row < instruction.n; row++) {
                    const sprite = this.memory.getByte(this.I + row);
                    
                    for (let col = 0; col < 8; col++) {
                        if ((sprite & (0x80 >> col)) !== 0) {
                            const xPos = (vx + col) % 64;
                            const yPos = (vy + row) % 32;
                            
                            // Verificar colisão
                            if (this.display.getPixel(xPos, yPos) === 1) {
                                this.V[0xF] = 1; // Definir flag de colisão
                            }
                            
                            // Aplicar XOR no pixel
                            const currentPixel = this.display.getPixel(xPos, yPos);
                            this.display.setPixel(xPos, yPos, currentPixel ^ 1);
                        }
                    }
                }
                break;
                
            // Ex9E
            case "SKIP_IF_KEY_VX_PRESSED":;
                if (this.keyboard.keyIsPressed(this.V[instruction.x])) {
                    this.keyboard.setStatusForKeyPress(true);
                    this.PC += 4;
                } else {
                    this.PC += 2;
                }
                break;
                
            // ExA1
            case "SKIP_IF_KEY_VX_NOT_PRESSED":
                console.log(`Executing SKIP_IF_KEY_VX_NOT_PRESSED for V[${instruction.x}]`);
                if (!this.keyboard.keyIsPressed(this.V[instruction.x])) {
                    console.log(`Key V[${instruction.x}] is not pressed, skipping next instruction`);
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
                // TODO: Implementar a lógica para esperar pela tecla pressionada



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
                // Definir I para localização do sprite do dígito VX
                this.I = this.V[instruction.x] * 5;
                break;
                
            // Fx33
            case "STORE_BCD_VX_AT_I":
                const value = this.V[instruction.x];
                this.memory.setByte(this.I, Math.floor(value / 100));
                this.memory.setByte(this.I + 1, Math.floor((value % 100) / 10));
                this.memory.setByte(this.I + 2, value % 10);
                break;
                
            // Fx55
            case "STORE_V0_TO_VX_AT_I":
                // Armazenar registros V0 até VX na memória começando em I
                for (let i = 0; i <= instruction.x; i++) {
                    this.memory.setByte(this.I + i, this.V[i]);
                }
                break;
                
            // Fx65
            case "LOAD_V0_TO_VX_FROM_I":
                // Ler registros V0 até VX da memória começando em I
                for (let i = 0; i <= instruction.x; i++) {
                    this.V[i] = this.memory.getByte(this.I + i);
                }
                break;
                
            default:
                console.log(`Instrução não implementada: ${instruction.name}`);
                break;
        }
    }
}

export default CPU