
import { html, unsafeCSS, LitElement } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { keyed } from 'lit/directives/keyed.js';
import { sunMoon, play, circlePause, heart, rocket, dice, volumeOn, volumeOff, settings } from './literals/icons.js';
import * as styles from 'bundle-text:./cards-of-zeal-view.css';

import 'swiper/swiper-element-bundle';

/**
 * Determines whether white or black text provides better contrast for a given background color.
 * Uses the YIQ luminance formula for perceived brightness.
*/
function getContrastColor(bgColor) {
    bgColor = bgColor.startsWith('#') ? bgColor.slice(1) : bgColor;

    const components = {
        r: parseInt(bgColor.substring(0, 2), 16),
        g: parseInt(bgColor.substring(2, 4), 16),
        b: parseInt(bgColor.substring(4, 6), 16)
    };

    // Calculate perceived brightness (YIQ formula)
    const brightness = (
        (components.r * 299) +
        (components.g * 587) +
        (components.b * 114)
    ) / 1000;

    // Use a threshold (e.g., 128) to decide between black or white overlay text.
    return brightness >= 128 ? 'black' : 'white';
}

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
        _theme:  { type: String, state: true },
        _selectedSlide: { type: Number, state: true },
    };

    constructor() {
        super();
        this._effect = "stack";
        this._theme = "default";
        this._selectedSlide = 0;
    }

    _handleSwiperSlideChange(event) {
        const [swiper] = event.detail ?? [];
        if (swiper && typeof swiper.activeIndex === 'number') {
            this._selectedSlide = swiper.activeIndex;
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
                swiper.slideTo(this._selectedSlide, 0);
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
                      @swiperslidechange=${this._handleSwiperSlideChange}
                      cards-effect='${this._effect === 'line' ? '{ "slideShadows": true, "perSlideOffset": 130, "perSlideRotate":  0, "rotate": false }' : ''}'
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
                                        ?checked=${index === this._selectedSlide}
                                        @change=${(e) => {
                                                if (e.target.checked) {
                                                        this._selectedSlide = index;
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
                     // { value: "line",   label: "Line"   },
                        { value: "slider", label: "Slider" },
                        { value: "list",   label: "List"   }
                    ], (v) => v, (v) => html`
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
                <!--
                ${isEmbedded ? null : html`
                    <div class="btn p-0 outline-none relative">
                        <select class="select select-ghost w-34 appearance-none outline-none pl-9" @change=${(e) => {
                            const value = e.target.value;
                            if (value !== 'default') {
                                document.documentElement.setAttribute('data-theme', value);
                            } else {
                                document.documentElement.removeAttribute('data-theme');
                            }
                        }}>
                              <option value="default">Default</option>
                              <option value="light">Light</option>
                              <option value="dark">Dark</option>
                        </select>
                        <div class="absolute top-2.5 left-3">
                            ${sunMoon()}
                        </div>
                    </div>
                `}
                -->
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
                    <button class="btn">
                        ${settings()}
                    </button>
                </div>
            </div>
        `;
    }
}
customElements.define('cards-of-zeal-view', CardsOfZealView);
