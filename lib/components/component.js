'use strict';

const async   = require('async');
const log4js  = require('log4js');
const common  = require('mylife-home-common');
const Wrapper = require('./wrapper');
const logger  = log4js.getLogger('components.Component');

module.exports = class Component {
  constructor(id, designerData, pluginInfo, pluginConfig, netConfig) {
    this.id           = id;
    this.designerData = designerData;
    this.pluginInfo   = pluginInfo;
    this.pluginConfig = pluginConfig;

    // TODO: check config

    this.pluginInstance = this.pluginInfo.factory(pluginConfig);
    this.wrapper = new Wrapper(this.pluginInstance, this.pluginInfo.metadata);

    const channels = [netConfig.core_channel];
    if(this.pluginInfo.metadata.usage === 'ui') { channels.push(netConfig.ui_channel); }
    this.netClient = new common.net.Client(netConfig, this._buildNick(), channels);

    this.wrapper.on('attributeChanged', () => {
      this.netClient.nick(this._buildNick());
    });

    this.netClient.irc.on('message', this._message.bind(this));

    // TODO: bindings

    logger.info(`Component created: '${this.id}' (type: ${this.pluginInfo})`);
  }

  close(cb) {
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
      const types = this.pluginInfo.metadata.actions[action];
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

      this.wrapper.action(action, typedArgs);

    } catch(ex) {
      this.netClient.irc.notice(from, ex.message);
    }
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
