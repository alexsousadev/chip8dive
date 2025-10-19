export class Audio {
    private audioContext: AudioContext | null = null;
    private oscillator: OscillatorNode | null = null;
    private gainNode: GainNode | null = null;

    constructor() {
        this.init();
    }

    // Inicializar contexto de áudio
    private init() {
        try {
            this.audioContext = new AudioContext();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 0.1;
            this.gainNode.connect(this.audioContext.destination);
        } catch (error) {
            console.warn("Web Audio API não disponível", error);
        }
    }

    // Iniciar o som de beep
    startBeep() {
        if (!this.audioContext || !this.gainNode || this.oscillator) return;
        
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = 'square'; // beep clássico
        this.oscillator.frequency.value = 440; // 440 Hz
        this.oscillator.connect(this.gainNode);
        this.oscillator.start();
    }

    // Parar o som de beep
    stopBeep() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
    }

    // Retomar o áudio (necessário para política de autoplay dos navegadores)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Verificar se o beep está tocando
    isPlaying(): boolean {
        return this.oscillator !== null;
    }
}

export default Audio;

