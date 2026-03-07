
import { html, unsafeCSS, LitElement } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { keyed } from 'lit/directives/keyed.js';
import { play, circlePause, heart, rocket, dice, volumeOn, volumeOff, settings } from './literals/icons.js';
import { getContrastColor } from './utils/color.js'; 
import * as styles from 'bundle-text:./cards-of-zeal-view.css';
import soundUrl_1 from 'data-url:./sounds/box_navy/1.mp3';
import soundUrl_2 from 'data-url:./sounds/box_navy/2.mp3';
import soundUrl_3 from 'data-url:./sounds/box_navy/3.mp3';
import soundUrl_4 from 'data-url:./sounds/box_navy/4.mp3';
import soundUrl_5 from 'data-url:./sounds/box_navy/5.mp3';

import 'swiper/swiper-element-bundle';

const soundUrls = [soundUrl_1, soundUrl_2, soundUrl_3, soundUrl_4, soundUrl_5];
const sounds = soundUrls.map(url => {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = 0.5;
    return audio;
});
let currentSoundIndex = 0;

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
        _selectedSlideIndex: { type: Number, state: true },
    };

    constructor() {
        super();
        this._effect = "stack";
        this._palette = "a";
        this._theme = "default";
        this._selectedSlideIndex = 0;
    }

    _handleSwiperSelectionChange(event) {
        const [swiper] = event.detail ?? [];
        if (swiper && typeof swiper.activeIndex === 'number') {
            if (this._selectedSlideIndex !== swiper.activeIndex) {
                this._selectedSlideIndex = swiper.activeIndex;
                this._playSound();
            }
        }
    }

    _handleListSelectionChange(index) {
        this._selectedSlideIndex = index;
        this._playSound();
    }

    _playSound() {
        const sound = sounds[currentSoundIndex];
        currentSoundIndex = (currentSoundIndex + 1) % sounds.length;
        sound.currentTime = 0;
        sound.play();
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
    }

    render() {
        const swiperElementKey = JSON.stringify([this._effect]);
        const isEmbedded = document.documentElement.classList.contains("embedded");
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
                                        ?checked=${index === this._selectedSlideIndex}
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
                      </select>
                  </div>
                  <button class="btn join-item">${play()}</button>
                  <button class="btn join-item">${rocket()}</button>
                </div>
            </div>
            <div class="top-left-toolbar">
                <div class="join">
                    ${repeat([
                        { value: "stack",  label: "Cards"  },
                        { value: "slider", label: "Slider" },
                        { value: "list",   label: "List"   }
                    ], (v) => v.value, (v) => html`
                        <input
                          type="radio"
                          aria-label="${v.label}"
                          class="btn join-item"
                          name="effect"
                          value="${v.value}"
                          ?checked=${this._effect === v.value}
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
                            <input type="checkbox" />
                            ${volumeOn("swap-on")}
                            ${volumeOff("swap-off")}
                        </label>
                    </div>
                    <div class="dropdown dropdown-end">
                        <div tabindex="0" role="button" class="btn">${settings()}</div>
                        <ul tabindex="-1" class="dropdown-content mt-2 menu bg-base-100 rounded-box z-1 w-52 px-2 pt-2 pb-4 shadow-sm">
                            <li class="menu-title">Theme</li>
                            ${repeat([
                                { value: "default", label: "Default" },
                                { value: "light",   label: "Light"   },
                                { value: "dark",    label: "Dark"    }
                            ], (v) => v.value, (v) => html`
                                <input type="radio"
                                  name="theme-selector"
                                  class="dropdown-radio"
                                  aria-label="${v.label}"
                                  value="${v.value}"
                                  ?checked="${this._theme === v.value}"
                                  @change=${(e) => this._theme = e.target.value} />
                            `)}
                            <li class="menu-title">Palette</li>
                            ${repeat([
                                { value: "a", label: "A" },
                                { value: "b", label: "B" },
                                { value: "c", label: "C" }
                            ], (v) => v.value, (v) => html`
                                <input type="radio"
                                  name="palette-selector"
                                  class="dropdown-radio"
                                  aria-label="${v.label}"
                                  value="${v.value}"
                                  ?checked="${this._palette === v.value}"
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
