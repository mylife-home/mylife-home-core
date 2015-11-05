'use strict';

const plugins = require('./plugins');

module.exports = class {
  constructor(config) {
    this._pluginManager = new plugins.Manager();

    this._pluginManager.fetch((err) => {
      if(err) { console.log(err); }
      console.log(this._pluginManager.remoteList());
    });

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
