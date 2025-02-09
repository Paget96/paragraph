/**
 * Build styles
 */
import './index.css';

import { IconText } from '@codexteam/icons'

/**
 * Base Paragraph Block for the Editor.js.
 * Represents a regular text block
 *
 * @author CodeX (team@codex.so)
 * @copyright CodeX 2018
 * @license The MIT License (MIT)
 */

/**
 * @typedef {object} ParagraphConfig
 * @property {string} placeholder - placeholder for the empty paragraph
 * @property {boolean} preserveBlank - Whether or not to keep blank paragraphs when saving editor data
 */

/**
 * @typedef {object} ParagraphData
 * @description Tool's input and output data format
 * @property {string} text — Paragraph's content. Can include HTML tags: <a><b><i>
 */
export default class Paragraph {
  /**
   * Default placeholder for Paragraph Tool
   *
   * @returns {string}
   * @class
   */
  static get DEFAULT_PLACEHOLDER() {
    return '';
  }

  /**
  * Allowed paragraph alignments
  *
  * @public
  * @returns {{left: string, center: string}}
 */
  static get ALIGNMENTS() {
    return {
      left: 'left',
      center: 'center',
      right: 'right',
      justify: 'justify',
    };
  }

  /**
   * Default paragraph alignment
   *
   * @public
   * @returns {string}
   */
  static get DEFAULT_ALIGNMENT() {
    return Paragraph.ALIGNMENTS.left;
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
  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;
    this.config = config;

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
     *
     * @type {string}
     */
    this._placeholder = config.placeholder ? config.placeholder : Paragraph.DEFAULT_PLACEHOLDER;
    this._data = {
      text: data.text || '',
      alignment: data.alignment || config.defaultAlignment || Paragraph.DEFAULT_ALIGNMENT
    };
    this._tunesButtons = [
      {
        name: 'left',
        icon: require('./tune-left-icon.svg').default
      },
      {
        name: 'center',
        icon: require('./tune-center-icon.svg').default
      },
      {
        name: 'right',
        icon: require('./tune-right-icon.svg').default
      },
      {
        name: 'justify',
        icon: require('./tune-justify-icon.svg').default
      }
    ];

    this._element = null;
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

    const { textContent } = this._element;

    if (textContent === '') {
      this._element.innerHTML = '';
    }
  }

  /**
   * Create Tool's view
   *
   * @returns {HTMLElement}
   * @private
   */
  drawView() {
    const div = document.createElement('DIV');

    div.classList.add(this._CSS.wrapper, this._CSS.block, this._CSS.alignment[this._data.alignment]); div.contentEditable = false;
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
    if (this._element === null) {
      this._element = this.drawView();
    }

    this.hydrate();

    return this._element;
  }

  /**
   * Method that specified how to merge two Text blocks.
   * Called by Editor.js by backspace at the beginning of the Block
   *
   * @param {ParagraphData} data
   * @public
   */
  merge(data) {
    const newData = {
      text: this.data.text + data.text,
      alignment: this.data.alignment,
    };

    this.data = newData;
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
    if (savedData.text.trim() === '' && !this._preserveBlank) {
      return false;
    }

    return true;
  }

  /**
   * Renders tunes buttons
   */
  renderSettings() {
    const wrapper = document.createElement('div');
    this._tunesButtons.map(tune => {
      const button = document.createElement('div');
      button.classList.add('cdx-settings-button');
      button.innerHTML = tune.icon;
      // if we pass default alignment on config tool, it must display activated because
      // isn't the default lifecycle
      button.classList.toggle(this._CSS.settingsButtonActive, tune.name === (this.data.alignment || this.config.defaultAlignment));
      wrapper.appendChild(button);
      return button;
    }).forEach((element, index, elements) => {
      element.addEventListener('click', () => {
        this._toggleTune(this._tunesButtons[index].name);
        elements.forEach((el, i) => {
          const { name } = this._tunesButtons[i];
          el.classList.toggle(this._CSS.settingsButtonActive, name === this.data.alignment);
          this._element.classList.toggle(this._CSS.alignment[name], name === this.data.alignment)
        });
      });
    });

    return wrapper;
  }

  /**
* @private
* Click on the Settings Button
* If the same alignment is clicked, we reset to default status
* @param {string} tune — tune name from this.settings
*/
  _toggleTune(tune) {
    if (this.data.alignment === tune) {
      this.data.alignment = this.config.defaultAlignment;
    } else {
      this.data.alignment = tune;
    }
  }

  /**
   * Extract Tool's data from the view
   *
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
    const data = {
      text: event.detail.data.innerHTML,
      alignment: event.detail.data.style.textAlign || this.config.defaultAlignment || Paragraph.DEFAULT_ALIGNMENT,
    };

    this.data = data;
  }

  /**
   * Enable Conversion Toolbar. Paragraph can be converted to/from other tools
   */
  static get conversionConfig() {
    return {
      export: 'text', // to convert Paragraph to other block, use 'text' property of saved data
      import: 'text', // to covert other block's exported string to Paragraph, fill 'text' property of tool data
    };
  }

  /**
   * Sanitizer rules
   */
  static get sanitize() {
    return {
      text: {
        br: true,
      },
    };
  }

  /**
   * Returns true to notify the core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Get current Tools`s data
   *
   * @returns {ParagraphData} Current data
   * @private
   */
  get data() {
    if (this._element !== null) {
      const text = this._element.innerHTML;

      this._data.text = text;
    }

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

    if (this._element !== null) {
      this.hydrate();
    }
  }

  /**
   * Fill tool's view with data
   */
  hydrate() {
    window.requestAnimationFrame(() => {
      this._element.innerHTML = this._data.text || '';
    });
  }

  /**
   * Used by Editor paste handling API.
   * Provides configuration to handle P tags.
   *
   * @returns {{tags: string[]}}
   */
  static get pasteConfig() {
    return {
      tags: ['p'],
    };
  }

  /**
   * Icon and title for displaying at the Toolbox
   *
   * @returns {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: IconText,
      title: 'Text',
    };
  }
}
