'use strict';

const common = require('mylife-home-common');
const Proxy = require('./proxy');

module.exports = class Component {
  constructor(id, pluginInfo, pluginConfig, netConfig) {
    this.id = id;

    this.pluginInfo = pluginInfo;
    this.pluginInstance = this.pluginInfo.factory(pluginConfig);
    this.proxy = new Proxy(this.pluginInstance, this.pluginInfo.metadata);

    const channels = [netConfig.core_channel];
    if(this.pluginInfo.metadata.usage === 'ui') { channels.push(netConfig.ui_channel); }
    this.netClient = new common.net.Client(netConfig, this._buildNick(), channels);

    this.proxy.on('attributeChanged', () {
      this.netClient.nick(this._buildNick));
    });

    // TODO: bindings
    // TODO: action listening
  }

  _buildNick() {
    let nick = id;
    for(let name of Object.keys(this.proxy.attributes) {

      let value = this.proxy.attributes[name];
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
