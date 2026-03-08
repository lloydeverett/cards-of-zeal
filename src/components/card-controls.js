import { html, LitElement } from 'lit';

export class CardControls extends LitElement {
    createRenderRoot() {
        return this;
    }
    render() {
        return html`
            <div>hello world</div>
        `;
    }
}
customElements.define('coz-card-controls', CardControls);
