/**
 * Build styles
 */
import './index.css';

import {IconAlignCenter, IconAlignJustify, IconAlignLeft, IconAlignRight, IconText} from '@codexteam/icons'

/**
 * Extended Paragraph Block for the Editor.js.
 * Represents simple paragraph
 *
 * Based on the base Paragraph Block by Codex.
 *
 * @author Klöen Lansfiel (kloen@kloenlansfiel.com)
 * @license The MIT License (MIT)
 */

/**
 * @typedef {object} ParagraphConfig
 * @property {string} placeholder - placeholder for the empty paragraph
 * @property {boolean} preserveBlank - Whether or not to keep blank paragraphs when saving editor data
 */

/**
 * @typedef {Object} ParagraphData
 * @description Tool's input and output data format
 * @property {String} text — Paragraph's content. Can include HTML tags: <a><b><i>
 */
export default class ParagraphEx {
    /**
     * Default placeholder for Paragraph Tool
     *
     * @return {string}
     * @constructor
     */
    static get DEFAULT_PLACEHOLDER() {
        return '';
    }

    /**
     * Default paragraph alignment
     *
     * @public
     * @returns {string}
     */
    static get DEFAULT_ALIGNMENT() {
        return 'left';
    }

    /**
     * Render plugin`s main Element and fill it with saved data
     *
     * @param {object} params - constructor params
     * @param {ParagraphData} params.data - previously saved data
     * @param {ParagraphConfig} params.config - user config for Tool
     * @param {object} params.api - editor.js api
     * @param {boolean} readOnly - read only mode flag
     */
    constructor({data, config, api, readOnly}) {
        this.api = api;
        this.config = config;
        this.readOnly = readOnly;

        this._CSS = {
            block: this.api.styles.block,
            wrapper: 'ce-paragraph',
            settingsButtonActive: this.api.styles.settingsButtonActive,
            alignment: {
                left: 'ce-paragraph--left',
                center: 'ce-paragraph--center',
                right: 'ce-paragraph--right',
                justify: 'ce-paragraph--justify',
            }
        };

        if (!this.readOnly) {
            this.onKeyUp = this.onKeyUp.bind(this);
        }

        /**
         * Placeholder for paragraph if it is first Block
         * @type {string}
         */
        this._placeholder = config.placeholder ? config.placeholder : ParagraphEx.DEFAULT_PLACEHOLDER;
        this._data = {
            text: data.text || '',
            alignment: data.alignment || config.defaultAlignment || ParagraphEx.DEFAULT_ALIGNMENT
        }
        this._tunesButtons = [
            {
                title: "Align Left",
                value: 'left',
                icon: IconAlignLeft
            },
            {
                title: "Align Center",
                value: 'center',
                icon: IconAlignCenter
            },
            {
                title: "Align Right",
                value: 'right',
                icon: IconAlignRight
            },
            {
                title: "Justify",
                value: 'justify',
                icon: IconAlignJustify
            }
        ];
        this._element = this.drawView();
        this._preserveBlank = config.preserveBlank !== undefined ? config.preserveBlank : false;

        this.data = data;
    }

    /**
     * Check if text content is empty and set empty string to inner html.
     * We need this because some browsers (e.g. Safari) insert <br> into empty contenteditanle elements
     *
     * @param {KeyboardEvent} e - key up event
     */
    onKeyUp(e) {
        if (e.code !== 'Backspace' && e.code !== 'Delete') {
            return;
        }

        const {textContent} = this._element;

        if (textContent === '') {
            this._element.innerHTML = '';
        }
    }

    /**
     * Create Tool's view
     * @return {HTMLElement}
     * @private
     */
    drawView() {
        let div = document.createElement('DIV');

        div.classList.add(this._CSS.wrapper, this._CSS.block, this._CSS.alignment[this._data.alignment]);
        div.contentEditable = false;
        div.dataset.placeholder = this.api.i18n.t(this._placeholder);

        if (!this.readOnly) {
            div.contentEditable = true;
            div.addEventListener('keyup', this.onKeyUp);
        }

        return div;
    }

    /**
     * Return Tool's view
     *
     * @returns {HTMLDivElement}
     */
    render() {
        return this._element;
    }

    /**
     * Method that specified how to merge two Text blocks.
     * Called by Editor.js by backspace at the beginning of the Block
     * @param {ParagraphData} data
     * @public
     */
    merge(data) {
        this.data = {
            text: this.data.text + data.text,
            alignment: this.data.alignment,
        };
    }

    /**
     * Renders tunes buttons
     *
     * @returns {Array}
     */
    renderSettings() {
        return this._tunesButtons.map(tune => ({
            icon: tune.icon,
            label: this.api.i18n.t(tune.title),
            onActivate: () => {
                this.setAlignment(tune.value);
            },
            closeOnActivate: true,
            isActive: this.currentAlignment.value === tune.value,
        }))
    }


    /**
     * Validate Paragraph block data:
     * - check for emptiness
     *
     * @param {ParagraphData} savedData — data received after saving
     * @returns {boolean} false if saved data is not correct, otherwise true
     * @public
     */
    validate(savedData) {
        return !(savedData.text.trim() === '' && !this._preserveBlank);
    }

    /**
     * Extract Tool's data from the view
     * @param {HTMLDivElement} toolsContent - Paragraph tools rendered view
     * @returns {ParagraphData} - saved data
     * @public
     */
    save(toolsContent) {
        return {
            text: toolsContent.innerHTML,
            alignment: this.data.alignment,
        };
    }

    /**
     * On paste callback fired from Editor.
     *
     * @param {PasteEvent} event - event with pasted data
     */
    onPaste(event) {
        this.data = {
            text: event.detail.data.innerHTML,
            alignment: event.detail.data.style.textAlign || this.config.defaultAlignment || ParagraphEx.DEFAULT_ALIGNMENT,
        };
    }

    /**
     * Enable Conversion Toolbar. Paragraph can be converted to/from other tools
     */
    static get conversionConfig() {
        return {
            export: 'text', // to convert Paragraph to other block, use 'text' property of saved data
            import: 'text' // to covert other block's exported string to Paragraph, fill 'text' property of tool data
        };
    }

    /**
     * Sanitizer rules
     */
    static get sanitize() {
        return {
            text: {
                br: true,
            }
        };
    }

    /**
     * Returns true to notify the core that read-only mode is supported
     *
     * @return {boolean}
     */
    static get isReadOnlySupported() {
        return true;
    }

    /**
     * Get current Tools`s data
     * @returns {ParagraphData} Current data
     * @private
     */
    get data() {
        this._data.text = this._element.innerHTML;

        return this._data;
    }

    /**
     * Store data in plugin:
     * - at the this._data property
     * - at the HTML
     *
     * @param {ParagraphData} data — data to set
     * @private
     */
    set data(data) {
        this._data = data || {};

        this._element.innerHTML = this._data.text || '';
    }

    /**
     * Set desired alignment
     * @param {string} alignment — tune value from this.settings
     */
    setAlignment(alignment) {
        this.data = {
            text: this.data.text,
            alignment: alignment
        };
        this._element.classList.toggle(this._CSS.alignment[name], name === this.data.alignment)
    }

    /**
     * Get current alignment
     *
     * @returns {level}
     */
    get currentAlignment() {
        let alignment = this._tunesButtons.find(alignmentItem => alignmentItem.value === this._data.alignment);

        if (!alignment) {
            alignment = ParagraphEx.DEFAULT_ALIGNMENT;
        }

        return alignment;
    }

    /**
     * Used by Editor paste handling API.
     * Provides configuration to handle P tags.
     *
     * @returns {{tags: string[]}}
     */
    static get pasteConfig() {
        return {
            tags: ['P']
        };
    }

    /**
     * Icon and title for displaying at the Toolbox
     *
     * @return {{icon: string, title: string}}
     */
    static get toolbox() {
        return {
            icon: IconText,
            title: 'Paragraph'
        };
    }
}
