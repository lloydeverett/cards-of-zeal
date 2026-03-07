
import { html, unsafeCSS, LitElement } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { keyed } from 'lit/directives/keyed.js';
import { play, circlePause, heart, rocket, dice, volumeOn, volumeOff, settings } from './literals/icons.js';
import { getContrastColor } from './utils/color.js'; 
import { isEmbedded } from './environment.js';
import { Sound } from './utils/sound.js';
import soundUrl from 'data-url:./sounds/click.wav';
import * as styles from 'bundle-text:./cards-of-zeal-view.css';

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
            persist: isEmbedded(), 
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
        if (swiper && typeof swiper.activeIndex === 'number' && this._selectedSlideIndex !== swiper.activeIndex) {
            this._selectedSlideIndex = swiper.activeIndex;
            if (this._soundEnabled) {
                cardSound.play();
            }
        }
    }

    _handleListSelectionChange(index) {
        this._selectedSlideIndex = index;
        if (this._soundEnabled) {
            cardSound.play();
        }
    }

    updated(changedProperties) {
        if (changedProperties.has('_effect')) {
            if (this._effect === 'list') {
                const selectedInput = this.renderRoot?.querySelector('.todo-list .underline-effect-input:checked');
                const selectedItem = selectedInput?.closest('li');
                selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                const swiperElement = this.renderRoot?.querySelector('swiper-container');
                const swiper = swiperElement?.swiper;
                swiper.slideTo(this._selectedSlideIndex, 0);
            }
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
                         ${repeat(
                             [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                             (value) => value,
                             (value, index) => html`
                                 <swiper-slide
                                   style="--bg-color: ${colors[index >= colors.length ? colors.length - 1 : index]}; --fg-color: ${getContrastColor(colors[index >= colors.length ? colors.length - 1 : index])};">
                                     <div class="slide-content">Slide ${value}</div>
                                 </swiper-slide>
                             `
                         )}
                    </swiper-container>
                `
            ) : html`
                <div class="todo-list-wrapper">
                    <ul class="bg-base-100 shadow-md todo-list w-full">
                        ${repeat(
                            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                            (value) => value,
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
                                            <div class="font-semibold underline-effect-target">Slide ${value}</div>
                                            <div class="flex-grow"></div>
                                            <button class="btn btn-square btn-ghost">${heart()}</button>
                                        </div>
                                    </div>
                                    <div class="collapse-content text-sm">
                                        <div class="h-6">Hello world</div>
                                    </div>
                                </li>`)}
                    </ul>
                </div>
            `}
            <div class="bottom-toolbar">
                <div class="tooltip" data-tip="Random draw">
                    <button class="btn">${dice()}</button>
                </div>
                <div class="tooltip" data-tip="Toggle breaks">
                    <button class="btn">${circlePause()}</button>
                </div>
                <div class="join">
                  <div class="btn p-0 join-item outline-none">
                      <select class="select select-ghost w-40 appearance-none outline-none">
                          <option value="5">5 minutes</option>
                          <option value="10">10 minutes</option>
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="45">45 minutes</option>
                          <option value="60">1 hour</option>
                          <option value="indefinite">Indefinite</option>
                      </select>
                  </div>
                  <button class="btn join-item">${play()}</button>
                  <button class="btn join-item">${rocket()}</button>
                </div>
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
                <div class="join">
                    <div class="btn p-0 join-item toggle-button">
                        <label class="swap p-4">
                            <input type="checkbox" />
                            ${heart("fill-current swap-on")}
                            ${heart("swap-off")}
                        </label>
                    </div>
                    <div class="btn p-0 join-item toggle-button">
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
            </div>
        `;
    }
}
customElements.define('cards-of-zeal-view', CardsOfZealView);
