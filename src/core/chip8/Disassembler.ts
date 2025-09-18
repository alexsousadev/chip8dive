export interface IDecodedInstruction {
    opcode: number;
    name: string;
    x: number;
    y: number;
    kk: number;
    n: number;
    nnn: number;
}

export const Disassembler = {
    decode: (opcode: number): IDecodedInstruction => {
        const x = (opcode & 0x0f00) >> 8;
        const y = (opcode & 0x00f0) >> 4;
        const kk = opcode & 0x00ff;
        const nnn = opcode & 0x0fff;
        const n = opcode & 0x000f;

        let instructionName = "UNKNOWN";

        // Decodificar instruções baseado no padrão do opcode
        switch (opcode & 0xF000) {
            case 0x0000:
                if (opcode === 0x00E0) instructionName = "CLS";
                else if (opcode === 0x00EE) instructionName = "RET";
                break;
            case 0x1000:
                instructionName = "JP";
                break;
            case 0x2000:
                instructionName = "CALL";
                break;
            case 0x6000:
                instructionName = "LD_VX";
                break;
            case 0x7000:
                instructionName = "ADD_VX";
                break;
            case 0xA000:
                instructionName = "LD_I";
                break;
            case 0xD000:
                instructionName = "DRW";
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
