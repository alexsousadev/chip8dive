import { Disassembler, type IDecodedInstruction } from "./Disassembler";
import { Display } from "./Display";
import { Memory } from "./Memory";

export class CPU {
    private memory: Memory;
    private display: Display;
    private V: Uint8Array;
    private Stack: Uint16Array;

    private PC: number;
    private I: number;
    private SP: number; // Stack Pointer (Ponteiro da pilha)

    private delayTimer: number; // Delay Timer (Timer de atraso)
    private soundTimer: number; // Sound Timer (Timer de som)

    private CLOCK_CPU = 1000 / 500 // Clock da CPU (500 Hz)

    constructor(memory: Memory, display: Display) {
        this.memory = memory;
        this.V = new Uint8Array(16);
        this.Stack = new Uint16Array(16);
        this.display = display;

        this.PC = 0x200;
        this.I = 0;
        this.SP = 0;

        this.delayTimer = 0;
        this.soundTimer = 0;
        
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
        console.log(`\n*************\nPC: ${this.PC}, MSB: ${msb.toString(16)}, LSB: ${lsb.toString(16)}\n`);
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
            console.log("\nINSTRUCAO: \n", instruction, "\n*****************\n");
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
        return ["JP", "CALL", "RET"].includes(instructionName);
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
            case "CLS": 
                this.display.cleanDisplay();
                break;
            case "RET":
                if (this.SP > 0) {
                    this.SP--;
                    this.PC = this.Stack[this.SP];
                }
                break;
            case "JP":
                this.PC = instruction.nnn;
                break;
            case "CALL":
                this.Stack[this.SP] = this.PC;
                this.SP++;
                this.PC = instruction.nnn;
                break;
            case "LD_I":
                this.I = instruction.nnn;
                break;
            case "LD_VX":
                this.V[instruction.x] = instruction.kk;
                break;
            case "ADD_VX":
                this.V[instruction.x] = (this.V[instruction.x] + instruction.kk) & 0xFF;
                break;
            case "DRW":
                console.log("Desenhando na tela");
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
            default:
                console.log(`Instrução não implementada: ${instruction.name}`);
                break;
        }
    }
}

export default CPU