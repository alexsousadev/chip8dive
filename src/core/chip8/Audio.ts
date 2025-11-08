export class Audio {
    private audioContext: AudioContext | null = null;
    private oscillator: OscillatorNode | null = null;
    private gainNode: GainNode | null = null;

    constructor() {
        this.init();
    }

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

    startBeep() {
        if (!this.audioContext || !this.gainNode || this.oscillator) return;
        
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = 'square';
        this.oscillator.frequency.value = 440;
        this.oscillator.connect(this.gainNode);
        this.oscillator.start();
    }

    stopBeep() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
    }

    // Navegadores bloqueiam autoplay de áudio - precisa de interação do usuário
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    isPlaying(): boolean {
        return this.oscillator !== null;
    }
}

export default Audio;

