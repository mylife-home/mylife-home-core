'use strict';

const async   = require('async');
const os      = require('os');
const common  = require('mylife-home-common');
const plugins = require('./plugins');

module.exports = class {
  constructor(config) {
    this._pluginManager = new plugins.Manager();
    this._adminClient   = new common.admin.Client(config.net, this._adminNick(), this._createAdminDefinition());
    this._adminExecutor = new common.net.jpacket.Executor(this._adminClient);

    //this._adminExecutor.on('session_list', this._executeSessionList.bind(this));
    //this._adminExecutor.on('session_kill', this._executeSessionKill.bind(this));
  }

  _adminNick() {
    return 'mylife-home-core_' + os.hostname().split('.')[0];
  }

  _createAdminDefinition() {
    const self = this;
    return {
      plugin: {
        desc: 'Plugin management',
        children: {
          remote: {
            desc: 'Remote plugin repository management',
            children: {
              fetch: {
                desc: 'Fetch',
                impl: (w) => {
                  w('Fetching...');
                  self._pluginManager.fetch((err) => {
                    if(err) {
                      w('Fetch error: ' + err);
                    } else {
                      w('Fetch done');
                    }
                  });
                }
              },
              list: {
                desc: 'List',
                impl: (w) => {
                  w('Plugin list:');
                  for(let info of self._pluginManager.remoteList()) {
                    w(`${info.name} (${info.description}): date: ${info.date}, commit: ${info.commit.substr(0, 7)}`);
                  }
                  w('---');
                }
              }
            }
          }
        }
      }
    };
  }

  close(cb) {
    async.parallel([
      (cb) => this._adminClient.close(cb)
    ], cb);
  }
};
