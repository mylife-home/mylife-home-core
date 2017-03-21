'use strict';

const async   = require('async');
const log4js  = require('log4js');
const common  = require('mylife-home-common');
const Wrapper = require('./wrapper');
const Binding = require('./binding');
const logger  = log4js.getLogger('components.Component');

module.exports = class Component {
  constructor(id, designerData, pluginInfo, pluginConfig, netConfig, bindingsConfig) {
    this.id           = id;
    this.designerData = designerData;
    this.pluginInfo   = pluginInfo;
    this.pluginConfig = pluginConfig;
    this.bindings     = new Map();

    // TODO: check config

    this.pluginInstance = this.pluginInfo.factory(pluginConfig);
    this.wrapper = new Wrapper(this.pluginInstance, this.pluginInfo.metadata);

    const channels = [netConfig.core_channel];
    if(this.pluginInfo.metadata.usage === 'ui') { channels.push(netConfig.ui_channel); }
    this.netClient = new common.net.Client(netConfig, this._buildNick(), channels);

    this.attributeChangedCallback = () => {
      this.netClient.nick(this._buildNick());
    }

    this.wrapper.on('attributeChanged', this.attributeChangedCallback);

    this.netClient.irc.on('message', this._message.bind(this));
    // resend nick on connection in case it has changed while connecting
    this.netClient.irc.on('motd', () => this.netClient.nick(this._buildNick()));

    this.netRepository = new common.net.Repository(this.netClient);
    this.boundBindingAction = this._bindingAction.bind(this);

    logger.info(`Component created: '${this.id}' (type: ${this.pluginInfo})`);

    for(let bindingConf of bindingsConfig || []) {
      this.bind(
        bindingConf.action,
        bindingConf.remoteId,
        bindingConf.remoteAttribute);
    }
  }

  bind(action, remoteId, remoteAttribute) {
    const key = Binding.createId(action, remoteId, remoteAttribute);
    if(this.bindings.get(key)) { return; }
    const binding = new Binding(this.netRepository, action, remoteId, remoteAttribute);
    binding.on('action', this.boundBindingAction);
    this.bindings.set(key, binding);
    logger.info(`Binding created: ${remoteId}.${remoteAttribute} -> ${this.id}.${action}`);
  }

  unbind(action, remoteId, remoteAttribute) {
    const key = Binding.createId(action, remoteId, remoteAttribute);
    const binding = this.bindings.get(key);
    if(!binding) { return; }
    binding.close();
    this.bindings.delete(key);
    logger.info(`Binding deleted: ${remoteId}.${remoteAttribute} -> ${this.id}.${action}`);
  }

  get bindingsData() {
    return Array.from(this.bindings.values()).map((binding) => ({
      action          : binding.action,
      remoteId        : binding.remoteId,
      remoteAttribute : binding.remoteAttribute
    }));
  }

  close(cb) {
    // stop listeneing on attribute changes before closing net client
    this.wrapper.removeListener('attributeChanged', this.attributeChangedCallback);

    async.parallel([
      (cb) => this.netClient.close(cb),
      (cb) => this.wrapper.close(cb)
    ], (err) => {
      logger.info(`Component delete: '${this.id}'`);
      cb(err);
    });
  }

  _message(from, to, text) {
    let split = text.split(' ');
    if(to !== this.netClient.irc.nick) {
      // chan msg => check if for us
      const dest = split[0];
      if(dest !== this.id) { return; }
      split = split.slice(1);
    }

    const action = split[0];
    const args = split.slice(1);

    try {
      this._action(action, args);
    } catch(ex) {
      this.netClient.irc.notice(from, ex.message);
      logger.error(`action error: (original message='${text}') ${ex.message}`);
    }
  }

  _bindingAction(binding, action, arg) {
    try {
      this._action(action, [arg]);
    } catch(ex) {
      logger.error(`action error from binding: ${binding.id}`);
    }
  }

  _action(name, args) {
    const types = this.pluginInfo.metadata.actions[name];
    if(!types) {
      throw new Error('No such action. Supported actions are: ' + Object.keys(this.pluginInfo.metadata.actions).join(', '));
    }

    if(types.length > args.length) {
      throw new Error('Not enough arguments. Expected ' + types.length + ', got ' + args.length);
    }

    const typedArgs = [];
    for(let i=0; i<types.length; ++i) {
      typedArgs.push(types[i].parse(args[i]));
    }

    this.wrapper.action(name, typedArgs);
  }

  _buildNick() {
    let nick = this.id;
    for(let name of Object.keys(this.wrapper.attributes)) {

      let value = this.wrapper.attributes[name];
      if(value === undefined || value === null) {
        value = '';
      } else {
        value = value.toString();
      }

      nick += '|' + name + '`' + value;
    }

    return nick;
  }
};
