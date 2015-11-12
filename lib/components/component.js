'use strict';

const common = require('mylife-home-common');
const Proxy = require('./proxy');

module.exports = class Component {
  constructor(pluginInfo, config) {
    this.pluginInfo = pluginInfo;
    this.pluginInstance = this.pluginInfo.factory(config);
    this.proxy = new Proxy(this.pluginInstance, this.pluginInfo.metadata);
    // TODO: net client
  }
};
