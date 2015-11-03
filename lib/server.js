'use strict';

module.exports = class {
  constructor(config) {
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
}
