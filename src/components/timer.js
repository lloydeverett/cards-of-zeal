import { html, LitElement } from 'lit';

export class Timer extends LitElement {
    static properties = {
        startDurationSeconds: { type: Number },
        running: { type: Boolean },
        _endEpochMs: { type: Number, state: true },
    }

    startTimer() {
      this._endEpochMs = Date.now() + (this.startDurationSeconds * 1000);
      this.resumeTimer();
    }

    resumeTimer() {
      this.stopTimer(); // Prevent multiple intervals
      this._timerId = setInterval(() => {
          this.requestUpdate();
          if (this._getSecondsLeft() <= 0) {
              this.stopTimer();
              this.dispatchEvent(new CustomEvent('timer-finished'));
          }
      }, 1000);
    }

    stopTimer() {
        if (this._timerId) {
            clearInterval(this._timerId);
            this._timerId = null;
        }
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.running) {
            this.resumeTimer();
        }
    }

    disconnectedCallback() {
        this.stopTimer();
        super.disconnectedCallback();
    }

    createRenderRoot() {
        return this;
    }

    updated(changedProperties) {
        if (changedProperties.has("running")) {
            if (this.running) {
                this.startTimer();
            } else {
                this.stopTimer();
            }
        }
    }

    render() {
        const secondsLeft = this._getSecondsLeft();
        return html`
            <div>
                ${this._formatTime(secondsLeft)}
            </div>
        `;
    }

    _getSecondsLeft() {
        if (!this._endEpochMs) {
            return this.startDurationSeconds ?? 0;
        }
        const millisecondsLeft = this._endEpochMs - Date.now();
        return Math.max(0, Math.ceil(millisecondsLeft / 1000));
    }

    _formatTime(totalSeconds) {
        const safeTotalSeconds = Math.max(0, Math.floor(totalSeconds));
        const hours = Math.floor(safeTotalSeconds / 3600);
        const minutes = Math.floor((safeTotalSeconds % 3600) / 60);
        const seconds = safeTotalSeconds % 60;

        const paddedMinutes = String(minutes).padStart(2, '0');
        const paddedSeconds = String(seconds).padStart(2, '0');

        if (hours > 0) {
            return `${hours}:${paddedMinutes}:${paddedSeconds}`;
        }

        if (minutes > 0) {
            return `${minutes}:${paddedSeconds}`;
        }

        return `${seconds}s`;
    }
}
customElements.define('coz-timer', Timer);
