'use strict';

const plugins = require('./plugins');

module.exports = class {
  constructor(config) {
    this._pluginManager = new plugins.Manager();

    this._pluginManager.list();
    console.log('started');

    this.loop();

  }


  loop() {
    setTimeout(this.loop.bind(this), 1000);
  }

  close(cb) {
    console.log('stopped');
    setImmediate(cb);
  }
};
