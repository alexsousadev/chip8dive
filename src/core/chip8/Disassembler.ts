export interface IDecodedInstruction {
    opcode: number;
    name: string;
    x: number;
    y: number;
    kk: number;
    n: number;
    nnn: number;
}

// Enum de intruções (baseadas no Cowgod's Chip-8 Technical Reference)
const InstructionEnum = {
    "0nnn": "SYSTEM_CALL",
    "00E0": "CLEAR_SCREEN",
    "00EE": "RETURN",
    "1nnn": "JUMP_TO_NNN",
    "2nnn": "CALL_SUBROUTINE_NNN",
    "3xkk": "SKIP_IF_VX_EQUALS_KK",
    "4xkk": "SKIP_IF_VX_NOT_EQUALS_KK",
    "5xy0": "SKIP_IF_VX_EQUALS_VY",
    "6xkk": "SET_VX_TO_KK",
    "7xkk": "ADD_KK_TO_VX",
    "8xy0": "SET_VX_TO_VY",
    "8xy1": "SET_VX_TO_VX_OR_VY",
    "8xy2": "SET_VX_TO_VX_AND_VY",
    "8xy3": "SET_VX_TO_VX_XOR_VY",
    "8xy4": "ADD_VY_TO_VX_WITH_CARRY",
    "8xy5": "SUBTRACT_VY_FROM_VX",
    "8xy6": "SHIFT_VX_RIGHT",
    "8xy7": "SET_VX_TO_VY_MINUS_VX",
    "8xyE": "SHIFT_VX_LEFT",
    "9xy0": "SKIP_IF_VX_NOT_EQUALS_VY",
    "Annn": "SET_I_TO_NNN",
    "Bnnn": "JUMP_TO_V0_PLUS_NNN",
    "Cxkk": "SET_VX_TO_RANDOM_AND_KK",
    "Dxyn": "DRAW_SPRITE_VX_VY_N",
    "Ex9E": "SKIP_IF_KEY_VX_PRESSED",
    "ExA1": "SKIP_IF_KEY_VX_NOT_PRESSED",
    "Fx07": "SET_VX_TO_DELAY_TIMER",
    "Fx0A": "WAIT_FOR_KEY_PRESS",
    "Fx15": "SET_DELAY_TIMER_TO_VX",
    "Fx18": "SET_SOUND_TIMER_TO_VX",
    "Fx1E": "ADD_VX_TO_I",
    "Fx29": "SET_I_TO_FONT_VX",
    "Fx33": "STORE_BCD_VX_AT_I",
    "Fx55": "STORE_V0_TO_VX_AT_I",
    "Fx65": "LOAD_V0_TO_VX_FROM_I"
} as const;

export const Disassembler = {
    decode: (opcode: number): IDecodedInstruction => {
        const x = (opcode & 0x0f00) >> 8;
        const y = (opcode & 0x00f0) >> 4;
        const kk = opcode & 0x00ff;
        const nnn = opcode & 0x0fff;
        const n = opcode & 0x000f;

        let instructionName = "UNKNOWN";

        switch (opcode & 0xF000) {
            case 0x0000:
                if (opcode === 0x00E0) instructionName = InstructionEnum["00E0"];
                else if (opcode === 0x00EE) instructionName = InstructionEnum["00EE"];
                else instructionName = InstructionEnum["0nnn"];
                break;
            case 0x1000:
                instructionName = InstructionEnum["1nnn"];
                break;
            case 0x2000:
                instructionName = InstructionEnum["2nnn"];
                break;
            case 0x3000:
                instructionName = InstructionEnum["3xkk"];
                break;
            case 0x4000:
                instructionName = InstructionEnum["4xkk"];
                break;
            case 0x5000:
                instructionName = InstructionEnum["5xy0"];
                break;
            case 0x6000:
                instructionName = InstructionEnum["6xkk"];
                break;
            case 0x7000:
                instructionName = InstructionEnum["7xkk"];
                break;
            case 0x8000:
                switch (n) {
                    case 0x0: instructionName = InstructionEnum["8xy0"]; break;
                    case 0x1: instructionName = InstructionEnum["8xy1"]; break;
                    case 0x2: instructionName = InstructionEnum["8xy2"]; break;
                    case 0x3: instructionName = InstructionEnum["8xy3"]; break;
                    case 0x4: instructionName = InstructionEnum["8xy4"]; break;
                    case 0x5: instructionName = InstructionEnum["8xy5"]; break;
                    case 0x6: instructionName = InstructionEnum["8xy6"]; break;
                    case 0x7: instructionName = InstructionEnum["8xy7"]; break;
                    case 0xE: instructionName = InstructionEnum["8xyE"]; break;
                    default: instructionName = "UNKNOWN_8"; break;
                }
                break;
            case 0x9000:
                instructionName = InstructionEnum["9xy0"];
                break;
            case 0xA000:
                instructionName = InstructionEnum["Annn"];
                break;
            case 0xB000:
                instructionName = InstructionEnum["Bnnn"];
                break;
            case 0xC000:
                instructionName = InstructionEnum["Cxkk"];
                break;
            case 0xD000:
                instructionName = InstructionEnum["Dxyn"];
                break;
            case 0xE000:
                if (kk === 0x9E) instructionName = InstructionEnum["Ex9E"];
                else if (kk === 0xA1) instructionName = InstructionEnum["ExA1"];
                else instructionName = "UNKNOWN_E";
                break;
            case 0xF000:
                switch (kk) {
                    case 0x07: instructionName = InstructionEnum["Fx07"]; break;
                    case 0x0A: instructionName = InstructionEnum["Fx0A"]; break;
                    case 0x15: instructionName = InstructionEnum["Fx15"]; break;
                    case 0x18: instructionName = InstructionEnum["Fx18"]; break;
                    case 0x1E: instructionName = InstructionEnum["Fx1E"]; break;
                    case 0x29: instructionName = InstructionEnum["Fx29"]; break;
                    case 0x33: instructionName = InstructionEnum["Fx33"]; break;
                    case 0x55: instructionName = InstructionEnum["Fx55"]; break;
                    case 0x65: instructionName = InstructionEnum["Fx65"]; break;
                    default: instructionName = "UNKNOWN_F"; break;
                }
                break;
            default:
                console.warn(`Instrução não reconhecida: ${opcode.toString(16)}`);
                break;
        }

        return {
            opcode,
            name: instructionName,
            x,
            y,
            kk,
            nnn,
            n
        };
    }
};
