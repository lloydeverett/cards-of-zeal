
import { html, unsafeCSS, LitElement } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { keyed } from 'lit/directives/keyed.js';
import { volumeOn, volumeOff, settings } from './literals/icons.js';
import { getContrastColor } from './utils/color.js';
import { Sound } from './utils/sound.js';
import { IS_EMBEDDED } from './environment.js';
import soundUrl from 'data-url:./sounds/click.wav';
import * as styles from 'bundle-text:./cards-of-zeal-view.css';

import './components/card-controls-toolbar.js'
import 'swiper/swiper-element-bundle';

const localStorageKey = "cards-of-zeal-settings";

const cardSound = new Sound(soundUrl, 0.5);

const colors = [
    "#001d29",
    "#005f73",
    "#0a9396",
    "#94d2bd",
    "#e9d8a6",
    "#ee9b00",
    "#ca6702",
    "#bb3e03",
    "#ae2012",
    "#9b2226",
    "#636e72"
];

export class CardsOfZealView extends LitElement {
    static styles = [ unsafeCSS(styles) ];
    static properties = {
        _effect: { type: String, state: true },
        _palette: { type: String, state: true },
        _theme:  { type: String, state: true },
        _soundEnabled: { type: Boolean, state: true },
        _tasks: { type: Object, state: true },
        _forceSelectionIndex: { type: Number, state: true }
    };

    static PROPERTIES_META = {
        _effect: {
            persist: false,
            values: [
                { value: "stack",  label: "Cards"  },
                { value: "slider", label: "Slider" },
                { value: "list",   label: "List"   }
            ]
        },
        _palette: {
            persist: true,
            values: [
                { value: "a", label: "A" },
                { value: "b", label: "B" },
                { value: "c", label: "C" }
            ]
        },
        _theme: {
            persist: true,
            values: [
                { value: "default", label: "Default" },
                { value: "light",   label: "Light"   },
                { value: "dark",    label: "Dark"    }
            ]
        },
        _soundEnabled: {
            // browsers require page interaction to allow sound playback, so avoid loading "true" from local storage if we're not in an embedded context
            persist: IS_EMBEDDED, 
            values: [
                { value: true },
                { value: false }
            ]
        }
    }

    constructor() {
        super();

        // defaults - may be overwritten if persisted settings are loaded successfully
        this._effect = "stack";
        this._palette = "a";
        this._theme = "default";
        this._selectedSlideIndex = 0;
        this._soundEnabled = false;
        this._tasks = !IS_EMBEDDED ? [...Array(15).keys()].map(i => i + 1).map(n => `Slide ${n}`) : [];
        this._forceSelectionIndex = null;

        // load persisted properties if they exist and are valid
        this._tryLoadPersistedProperties(localStorage.getItem(localStorageKey));

        // look out for changes to local storage from other tabs or views - note that technically, a well-behaved web component
        // should be able to clean up after itself after being disconnected from the DOM, but we're just going to assume for
        // simplicity that that is not going to happen
        window.addEventListener('storage', (event) => {
            if (event.key === localStorageKey) {
                console.log('Local storage update event', event);
                this._tryLoadPersistedProperties(event.newValue);
            }
        });

        // listen for updates from parent page if we're in an embedded setting - again, attach event listeners to the window
        // like we just don't care
        if (IS_EMBEDDED) {
            this._selectedSlideByFilename = new Map(); // try to keep track of current selection across different files
            window.addEventListener('message', (event) => {
                if (this._filepath) {
                    this._selectedSlideByFilename.set(this._filepath, this._selectedSlideIndex);
                }
                if (event.data.filepath && event.data.filepath !== this._filepath) {
                    this._filepath = event.data.filepath;
                    this._forceSelectionIndex = this._selectedSlideByFilename.get(event.data.filepath) ?? 0;
                }
                if (event.data.type === "update-tasks") {
                    this._tasks = event.data.tasks.filter(t => !t.completed).map(t => t.text);
                }
            });
        }
    }

    _tryLoadPersistedProperties(value) {
        if (value) {
            try {
                const persisted = JSON.parse(value);
                for (const prop in CardsOfZealView.PROPERTIES_META) {
                    if (!CardsOfZealView.PROPERTIES_META[prop].persist) {
                        continue;
                    }
                    const validValues = CardsOfZealView.PROPERTIES_META[prop].values.map(v => v.value);
                    if (!validValues.includes(persisted[prop])) {
                        throw new Error(`Found invalid persisted value: ${persisted[prop]}`);
                    }
                }
                for (const prop in CardsOfZealView.PROPERTIES_META) {
                    if (!CardsOfZealView.PROPERTIES_META[prop].persist) {
                        continue;
                    }
                    this[prop] = persisted[prop];
                }
            } catch (err) {
                console.error('Error occured while loading properties. Persisted data will be ignored.', err);
            }
        }
    }

    _handleSwiperSelectionChange(event) {
        const [swiper] = event.detail ?? [];
        if (swiper && typeof swiper.activeIndex === 'number' && this._selectedSlideIndex !== swiper.activeIndex && !this._forceSelectionIndex) {
            this._selectedSlideIndex = swiper.activeIndex;
            if (this._soundEnabled) {
                cardSound.play();
            }
        }
    }

    _handleListSelectionChange(index) {
        if (!this._forceSelectionIndex) {
            this._selectedSlideIndex = index;
            if (this._soundEnabled) {
                cardSound.play();
            }
        }
    }

    // solely expected to be called during update to ensure this._forceSelectionIndex is applied
    _applyForcedSelection() {
        if (this._forceSelectionIndex !== null &&
              (typeof this._forceSelectionIndex !== 'number' || this._forceSelectionIndex >= this._tasks.length)) {
            // bad selection
            console.warn('Cannot force apply selection index', this._forceSelectionIndex, 'as it is outside the expected range');
            this._forceSelectionIndex = null;
            return;
        }

        const apply = (index) => {
            this._selectedSlideIndex = index;
            if (this._effect === 'list') {
                const selectedInput = this.renderRoot?.querySelector('.todo-list .underline-effect-input:checked');
                if (!selectedInput) {
                    return false;
                }
                const selectedItem = selectedInput?.closest('li');
                selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                return true;
            } else {
                const swiperElement = this.renderRoot?.querySelector('swiper-container');
                const swiper = swiperElement?.swiper;
                swiper.slideTo(index, 0);
                return swiper.activeIndex === index;
            }
        }

        if (apply(this._forceSelectionIndex !== null ? this._forceSelectionIndex : this._selectedSlideIndex)) {
            // all done! we can stop now
            this._forceSelectionIndex = null;
        } else {
            // keep looping
            window.setTimeout(() => {
                this.requestUpdate();
            }, 0);
        }
    }

    updated(changedProperties) {
        if (changedProperties.has('_effect') || this._forceSelectionIndex !== null) {
            this._applyForcedSelection();
        }
        if (changedProperties.has('_theme')) {
            if (this._theme !== 'default') {
                document.documentElement.setAttribute('data-theme', this._theme);
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        }
        if (changedProperties.keys().some(prop => CardsOfZealView.PROPERTIES_META[prop]?.persist)) {
            const toPersist = {};
            for (const prop in CardsOfZealView.PROPERTIES_META) {
                if (CardsOfZealView.PROPERTIES_META[prop].persist) {
                    toPersist[prop] = this[prop];
                }
            }
            localStorage.setItem(localStorageKey, JSON.stringify(toPersist));
        }
    }

    render() {
        const swiperElementKey = JSON.stringify([this._effect]);
        return html`
            ${this._effect !== "list" ? keyed(
                swiperElementKey,
                html`
                    <swiper-container
                      keyboard="true"
                      effect='${this._effect === 'slider' ? 'slider' : 'cards'}'
                      grab-cursor="true"
                      @swiperslidechange=${this._handleSwiperSelectionChange}
                      mousewheel='{ "enabled": true, "releaseOnEdges": false }'
                      free-mode='{ "enabled": true, "sticky": true, "minimumVelocity": 100.0 }'>
                         ${this._tasks.map(
                             (value, index) => html`
                                 <swiper-slide
                                   style="--bg-color: ${colors[index >= colors.length ? colors.length - 1 : index]}; --fg-color: ${getContrastColor(colors[index >= colors.length ? colors.length - 1 : index])};">
                                     <div class="slide-content">${value}</div>
                                 </swiper-slide>
                             `
                         )}
                    </swiper-container>
                `
            ) : html`
                <div class="todo-list-wrapper">
                    <ul class="bg-base-100 shadow-md todo-list w-full">
                        ${this._tasks.map(
                            (value, index) => html`
                                <li
                                  class="collapse rounded-none relative"
                                  style="--bg-color: ${colors[index >= colors.length ? colors.length - 1 : index]}; --fg-color: ${getContrastColor(colors[index >= colors.length ? colors.length - 1 : index])};">
                                    <input
                                        type="radio"
                                        name="todo-list-accordion"
                                        class="underline-effect-input"
                                        .checked=${index === this._selectedSlideIndex}
                                        @change=${(e) => {
                                           if (e.target.checked) {
                                                this._handleListSelectionChange(index);
                                           }
                                        }} />
                                    <div class="collapse-title h-16">
                                        <div class="absolute inset-0 flex flex-row items-center p-4">
                                            <div class="font-semibold underline-effect-target">
                                                <div class="task-list-task-title">${value}</div>
                                            </div>
                                            <div class="flex-grow"></div>
                                        </div>
                                    </div>
                                    <div class="collapse-content text-sm">
                                        <div class="h-6 italic">Lorem ipsum dolor sit amet.</div>
                                    </div>
                                </li>`)}
                    </ul>
                </div>
            `}
            <div class="bottom-toolbar">
                <coz-card-controls-toolbar
                    .timerEndEpoch=${100}
                    .getSelectedTaskText=${(() => this._tasks.length ? this._tasks[this._selectedSlideIndex] : null)}>
                </coz-card-controls-toolbar>
            </div>
            <div class="top-left-toolbar">
                <div class="join">
                    ${repeat(CardsOfZealView.PROPERTIES_META._effect.values, (v) => v.value, (v) => html`
                        <input
                          type="radio"
                          aria-label="${v.label}"
                          class="btn join-item"
                          name="effect"
                          value="${v.value}"
                          .checked=${this._effect === v.value}
                          @change=${(e) => this._effect = e.target.value} />
                    `)}
                </div>
                <div class="flex-grow"></div>
            </div>
            <div class="top-right-toolbar">
                <div class="btn p-0 toggle-button">
                    <label class="swap p-4">
                        <input
                          type="checkbox"
                          .checked=${this._soundEnabled}
                          @change=${(e) => this._soundEnabled = e.target.checked} />
                        ${volumeOn("swap-on")}
                        ${volumeOff("swap-off")}
                    </label>
                </div>
                <div class="dropdown dropdown-end">
                    <div tabindex="0" role="button" class="btn">${settings()}</div>
                    <ul tabindex="-1" class="dropdown-content mt-2 menu bg-base-100 rounded-box z-1 w-52 px-2 pt-2 pb-4 shadow-sm">
                        <li class="menu-title">Theme</li>
                        ${repeat(CardsOfZealView.PROPERTIES_META._theme.values, (v) => v.value, (v) => html`
                            <input type="radio"
                              name="theme-selector"
                              class="dropdown-radio"
                              aria-label="${v.label}"
                              value="${v.value}"
                              .checked="${this._theme === v.value}"
                              @change=${(e) => this._theme = e.target.value} />
                        `)}
                        <li class="menu-title">Palette</li>
                        ${repeat(CardsOfZealView.PROPERTIES_META._palette.values, (v) => v.value, (v) => html`
                            <input type="radio"
                              name="palette-selector"
                              class="dropdown-radio"
                              aria-label="${v.label}"
                              value="${v.value}"
                              .checked="${this._palette === v.value}"
                              @change=${(e) => this._palette = e.target.value} />
                        `)}
                    </ul>
                </div>
            </div>
        `;
    }
}
customElements.define('cards-of-zeal-view', CardsOfZealView);
