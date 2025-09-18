export class Display {
    private display: number[][];
    private display_width: number;
    private display_height: number;

    constructor() {
        this.display_width = 64;
        this.display_height = 32;
        this.display = new Array(this.display_height).fill(0).map(() => new Array(this.display_width).fill(0));
    }

    getDisplay() {
        return this.display;
    }

    getPixel(xPos: number, yPos: number) {
        return this.display[yPos][xPos];
    }

    setPixel(xPos: number, yPos: number, value: number) {
        this.display[yPos][xPos] = value;
    }
    
    cleanDisplay() {
        this.display.forEach(row => row.fill(0));
    }
}