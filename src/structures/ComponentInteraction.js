'use strict';

const APIMessage = require('./APIMessage');
const Interaction = require('./Interaction');
const WebhookClient = require('../client/WebhookClient');
const { Error } = require('../errors');
const { InteractionResponseTypes } = require('../util/Constants');
const MessageFlags = require('../util/MessageFlags');

/**
 * Represents a message button interaction.
 * @extends {Interaction}
 */
class ComponentInteraction extends Interaction {
  // eslint-disable-next-line no-useless-constructor
  constructor(client, data) {
    super(client, data);

    /**
     * The message to which the button was attached
     * @type {?Message|Object}
     */
    this.message = data.message ? this.channel?.messages.add(data.message) ?? data.message : null;

    /**
     * The custom ID of the button which was clicked
     * @type {string}
     */
    this.customID = data.data.custom_id;

    /**
     * Whether the reply to this interaction has been deferred
     * @type {boolean}
     */
    this.deferred = false;

    /**
     * Whether this interaction has already been replied to
     * @type {boolean}
     */
    this.replied = false;

    /**
     * An associated webhook client, can be used to create deferred replies
     * @type {WebhookClient}
     */
    this.webhook = new WebhookClient(this.applicationID, this.token, this.client.options);
  }

  /**
   * Defers the reply to this interaction.
   * @param {boolean} [ephemeral] Whether the reply should be ephemeral
   * @returns {Promise<void>}
   * @example
   * // Defer the reply to this interaction
   * interaction.defer()
   *   .then(console.log)
   *   .catch(console.error)
   * @example
   * // Defer to send an ephemeral reply later
   * interaction.defer(true)
   *   .then(console.log)
   *   .catch(console.error);
   */
  async defer(ephemeral) {
    if (this.deferred || this.replied) throw new Error('INTERACTION_ALREADY_REPLIED');
    await this.client.api.interactions(this.id, this.token).callback.post({
      data: {
        type: InteractionResponseTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: ephemeral ? MessageFlags.FLAGS.EPHEMERAL : undefined,
        },
      },
    });
    this.deferred = true;
  }

  /**
   * Options for a reply to an interaction.
   * @typedef {WebhookMessageOptions} InteractionReplyOptions
   * @property {boolean} [ephemeral] Whether the reply should be ephemeral
   */

  /**
   * Creates a reply to this interaction.
   * @param {string|APIMessage|MessageAdditions} content The content for the reply
   * @param {InteractionReplyOptions} [options] Additional options for the reply
   * @returns {Promise<void>}
   * @example
   * // Reply to the interaction with an embed
   * const embed = new MessageEmbed().setDescription('Pong!');
   *
   * interaction.reply(embed)
   *   .then(console.log)
   *   .catch(console.error);
   * @example
   * // Create an ephemeral reply
   * interaction.reply('Pong!', { ephemeral: true })
   *   .then(console.log)
   *   .catch(console.error);
   */
  async reply(content, options) {
    if (this.deferred || this.replied) throw new Error('INTERACTION_ALREADY_REPLIED');
    const apiMessage = content instanceof APIMessage ? content : APIMessage.create(this, content, options);
    const { data, files } = await apiMessage.resolveData().resolveFiles();

    await this.client.api.interactions(this.id, this.token).callback.post({
      data: {
        type: InteractionResponseTypes.CHANNEL_MESSAGE_WITH_SOURCE,
        data,
      },
      files,
    });
    this.replied = true;
  }

  /**
   * Defers an update to the message to which the button was attached
   * @returns {Promise<void>}
   * @example
   * // Defer to update the button to a loading state
   * interaction.defer()
   *   .then(console.log)
   *   .catch(console.error);
   */
  async deferUpdate() {
    if (this.deferred || this.replied) throw new Error('INTERACTION_ALREADY_REPLIED');
    await this.client.api.interactions(this.id, this.token).callback.post({
      data: {
        type: InteractionResponseTypes.DEFERRED_MESSAGE_UPDATE,
      },
    });
    this.deferred = true;
  }

  /**
   * Updates the message to which the button was attached
   * @param {string|APIMessage|MessageAdditions} content The content for the reply
   * @param {WebhookEditMessageOptions} [options] Additional options for the reply
   * @returns {Promise<void>}
   * @example
   * // Remove the buttons from the message   *
   * interaction.reply("A button was clicked", { components: [] })
   *   .then(console.log)
   *   .catch(console.error);
   */
  async update(content, options) {
    if (this.deferred || this.replied) throw new Error('INTERACTION_ALREADY_REPLIED');
    const apiMessage = content instanceof APIMessage ? content : APIMessage.create(this, content, options);
    const { data, files } = await apiMessage.resolveData().resolveFiles();

    await this.client.api.interactions(this.id, this.token).callback.post({
      data: {
        type: InteractionResponseTypes.UPDATE_MESSAGE,
        data,
      },
      files,
    });
    this.replied = true;
  }

  /**
   * Fetches the initial reply to this interaction.
   * * For `defer` and `reply` this is the new message
   * * For `deferUpdate` and `update` this is the message to which the buttons are attached
   * @see Webhook#fetchMessage
   * @returns {Promise<Message|Object>}
   * @example
   * // Fetch the reply to this interaction
   * interaction.fetchReply()
   *   .then(reply => console.log(`Replied with ${reply.content}`))
   *   .catch(console.error);
   */
  async fetchReply() {
    const raw = await this.webhook.fetchMessage('@original');
    return this.channel?.messages.add(raw) ?? raw;
  }

  /**
   * Edits the initial reply to this interaction.
   * * For `defer` and `reply` this is the new message sent
   * * For `deferUpdate` and `update` this is the message to which the buttons are attached
   * @see Webhook#editMessage
   * @param {string|APIMessage|MessageEmbed|MessageEmbed[]} content The new content for the message
   * @param {WebhookEditMessageOptions} [options] The options to provide
   * @returns {Promise<Message|Object>}
   * @example
   * // Edit the reply to this interaction
   * interaction.editReply('New content')
   *   .then(console.log)
   *   .catch(console.error);
   */
  async editReply(content, options) {
    const raw = await this.webhook.editMessage('@original', content, options);
    return this.channel?.messages.add(raw) ?? raw;
  }

  /**
   * Deletes the initial reply to this interaction.
   * * For `defer` and `reply` this is the new message
   * * For `deferUpdate` and `update` this is the message to which the buttons are attached
   * @see Webhook#deleteMessage
   * @returns {Promise<void>}
   * @example
   * // Delete the reply to this interaction
   * interaction.deleteReply()
   *   .then(console.log)
   *   .catch(console.error);
   */
  async deleteReply() {
    await this.webhook.deleteMessage('@original');
  }

  /**
   * Send a follow-up message to this interaction.
   * @param {string|APIMessage|MessageAdditions} content The content for the reply
   * @param {InteractionReplyOptions} [options] Additional options for the reply
   * @returns {Promise<Message|Object>}
   */
  async followUp(content, options) {
    const apiMessage = content instanceof APIMessage ? content : APIMessage.create(this, content, options);
    const { data, files } = await apiMessage.resolveData().resolveFiles();

    const raw = await this.client.api.webhooks(this.applicationID, this.token).post({
      data,
      files,
    });

    return this.channel?.messages.add(raw) ?? raw;
  }
}

module.exports = ComponentInteraction;
