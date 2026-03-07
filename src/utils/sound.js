
let audioContext = null;

export class Sound {
    constructor(url, gain) {
        this.url = url;
        this.gain = gain;
        this.loading = null;
    }
    load() {
        if (!this.loading) {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            this.loading = fetch(this.url)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
                .then(buffer => this._buffer = buffer);
        }
        return this.loading;
    }
    async play() {
        await this.load();
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        source.buffer = this._buffer;
        gainNode.gain.value = this.gain;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        source.start(0);
    }
}
