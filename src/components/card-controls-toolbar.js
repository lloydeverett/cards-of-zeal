import { play, infinity, circlePause, rocket, dice, stop, lock } from '../literals/icons.js';
import { repeat } from 'lit/directives/repeat.js';
import { html, LitElement } from 'lit';

import './timer.js';

export class CardControlsToolbar extends LitElement {
    static properties = {
        // TODO: Consider whether we need to manage state further up the tree and rethink these props
        _timerDurationSeconds: { type: String, state: true },
        _running: { type: Boolean, state: true },
        _runningTaskText: { type: String, state: true },
        getSelectedTaskText: { type: Object }
    }
    constructor() {
        super();
        this._timerDurationSeconds = "60";
        this._runningTaskText = null;
    }
    createRenderRoot() {
        return this;
    }
    _handlePlayClicked() {
        this._runningTaskText = this.getSelectedTaskText();
    }
    _handleStopClicked() {
        this._runningTaskText = null;
    }
    render() {
        const activeBtnVariant = "btn-secondary";
        return html`
            <div class="flex flex-row items-center gap-4" style="max-width: calc(100vw - 2rem);">
                ${this._runningTaskText !== null ? html`
                    <div class="tooltip" data-tip="Lock selected task">
                        <button class="btn ${activeBtnVariant} join-item">${lock()}</button>
                    </div>
                    <div class="join flex flex-row flex-shrink min-w-20">
                      <button class="btn ${activeBtnVariant} join-item outline-none justify-start flex-shrink min-w-0 w-80">
                        <div class="truncate">${this._runningTaskText}</div>
                        <div class="flex-grow"></div>
                        ${this._timerDurationSeconds === "indefinite" ? html`
                            <div>${infinity()}</div>
                        `: html`
                            <coz-timer
                              class="font-normal"
                              .startDurationSeconds=${parseInt(this._timerDurationSeconds, 10)}
                              .running=${true}
                              @timer-finished="${() => this._runningTaskText = null}">
                            </coz-timer>
                        `}
                      </button>
                      <button class="btn ${activeBtnVariant} join-item" @click=${this._handleStopClicked}>${stop()}</button>
                    </div>
                ` : html`
                    <div class="tooltip" data-tip="Random draw">
                        <button class="btn">${dice()}</button>
                    </div>
                    <div class="tooltip" data-tip="Toggle breaks">
                        <button class="btn">${circlePause()}</button>
                    </div>
                    <div class="join">
                      <div class="btn p-0 join-item outline-none">
                          <select
                            class="select select-ghost w-40 appearance-none outline-none" 
                            @change=${(e) => this._timerDurationSeconds = e.target.value} />
                              ${repeat([
                                { value: `${1 * 60}`, label: '1 minute' },
                                { value: `${5 * 60}`, label: '5 minutes' },
                                { value: `${10 * 60}`, label: '10 minutes' },
                                { value: `${15 * 60}`, label: '15 minutes' },
                                { value: `${30 * 60}`, label: '30 minutes' },
                                { value: `${45 * 60}`, label: '45 minutes' },
                                { value: `${60 * 60}`, label: '1 hour' },
                                { value: `indefinite`, label: 'Indefinite' },
                              ], v => v.value, v => html`
                                  <option
                                    value="${v.value}"
                                    ?selected="${this._timerDurationSeconds === v.value}">
                                      ${v.label}
                                  </option>
                              `)}
                          </select>
                      </div>
                      <button class="btn join-item" @click=${this._handlePlayClicked}>${play()}</button>
                      <button class="btn join-item">${rocket()}</button>
                    </div>
                `}
            </div>
        `;
    }
}
customElements.define('coz-card-controls-toolbar', CardControlsToolbar);
