'use strict';

const { MessageComponentTypes, MessageButtonStyles } = require('../util/Constants');

/**
 * Represents an interactive component of a Message. It should not be necessary to construct this directly.
 */
class BaseMessageComponent {
  /**
   * Options for a BaseMessageComponent
   * @typedef {Object} BaseMessageComponentOptions
   * @property {MessageComponentType} type The type of this component
   */

  /**
   * Data that can be resolved into options for a MessageComponent. This can be:
   * * MessageActionRowOptions
   * * MessageButtonOptions
   * @typedef {MessageActionRowOptions|MessageButtonOptions} MessageComponentOptions
   */

  /**
   * Components that can be sent in a message
   * @typedef {MessageActionRow|MessageButton} MessageComponent
   */

  /**
   * Data that resolves to give a MessageComponent object. This can be:
   * * A MessageComponentOptions object
   * * A MessageActionRow
   * * A MessageButton
   * @typedef {MessageComponentOptions|MessageComponent} MessageComponentResolvable
   */

  /**
   * @param {BaseMessageComponent|BaseMessageComponentOptions} [data={}] The options for this component
   */
  constructor(data) {
    /**
     * The type of this component
     * @type {?MessageComponentType}
     */
    this.type = 'type' in data ? BaseMessageComponent.resolveType(data.type) : null;
  }

  /**
   * Sets the type of this component
   * @param {MessageComponentTypeResolvable} type The type of this component
   * @returns {BaseMessageComponent}
   */
  setType(type) {
    this.type = BaseMessageComponent.resolveType(type);
    return this;
  }

  static create(data) {
    let component;
    let type = data.type;

    if (typeof type === 'string') type = MessageComponentTypes[type];

    switch (type) {
      case MessageComponentTypes.ACTION_ROW: {
        const MessageActionRow = require('./MessageActionRow');
        component = new MessageActionRow(data);
        break;
      }
      case MessageComponentTypes.BUTTON: {
        const MessageButton = require('./MessageButton');
        component = new MessageButton(data);
        break;
      }
    }
    return component;
  }

  /**
   * Resolves the type of a MessageComponent
   * @param {MessageComponentTypeResolvable} type The type to resolve
   * @returns {any}
   */
  static resolveType(type) {
    return typeof type === 'string' ? type : MessageComponentTypes[type];
  }

  /**
   * Transforms a MessageComponent object into something that can be used with the API.
   * @param {MessageComponentResolvable} component The component to transform
   * @returns {Object}
   * @private
   */
  static transform(component) {
    const { type, components, label, customID, style, emoji, url, disabled } = component;

    return {
      components: components?.map(BaseMessageComponent.transform),
      custom_id: customID,
      disabled,
      emoji,
      label,
      style: MessageButtonStyles[style],
      type: MessageComponentTypes[type],
      url,
    };
  }
}

module.exports = BaseMessageComponent;
