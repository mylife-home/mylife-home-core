'use strict';

const os         = require('os');
const async      = require('async');
const log4js     = require('log4js');
const common     = require('mylife-home-common');
const plugins    = require('./plugins');
const components = require('./components');
const logger     = log4js.getLogger('core.Server');

module.exports = class {
  constructor(config) {
    this._pluginManager    = new plugins.Manager();
    this._componentManager = new components.Manager(config.net, this._pluginManager.local);
    this._adminClient      = new common.admin.Client(config.net, this._adminNick(), this._createAdminDefinition());
    this._adminExecutor    = new common.net.jpacket.Executor(this._adminClient);

    //this._adminExecutor.on('session_list', this._executeSessionList.bind(this));
    //this._adminExecutor.on('session_kill', this._executeSessionKill.bind(this));
  }

  _adminNick() {
    return 'mylife-home-core_' + os.hostname().split('.')[0];
  }

  _createAdminDefinition() {
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
                  this._pluginManager.fetch((err) => {
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
                  const list = this._pluginManager.remoteList();
                  if(!list) {
                    w('List not available. fetch before');
                    return;
                  }
                  for(let info of list) {
                    w(`${info.name} (${info.description}): date: ${info.date}, commit: ${info.commit.substr(0, 7)}`);
                  }
                  w('---');
                }
              }
            }
          },
          local: {
            desc: 'Local plugin repository management',
            children: {
              list: {
                desc: 'List installed plugins',
                impl: (w) => {
                  w('Plugin list:');
                  for(let module of this._pluginManager.localList()) {
                    w(`${module.name} (${module.description}): date: ${module.date}, commit: ${module.commit.substr(0, 7)}`);
                    for(let plugin of module.plugins) {
                      w(`  ${plugin.name}: usage=${plugin.metadata.usage}, class=${plugin.metadata.strings.clazz}, config=${plugin.metadata.strings.config}`);
                    }
                  }
                  w('---');
                }
              },
              install: {
                desc: 'Install a plugin',
                impl: (w, m) => {
                  this._pluginManager.install(m, (err) => {
                    if(err) {
                      w('Install error: ' + err);
                    } else {
                      w('Install done');
                    }
                  });
                }
              },
              uninstall: {
                desc: 'Uninstall a plugin',
                impl: (w, m) => {
                  this._pluginManager.uninstall(m, (err) => {
                    if(err) {
                      w('Uninstall error: ' + err);
                    } else {
                      w('Uninstall done');
                    }
                  });
                }
              }
            }
          }
        }
      },
      component: {
        desc: 'Component management',
        children: {
          list: {
            desc: 'List components',
            impl: (w) => {
              w('Component list:');
              for(let comp of this._componentManager.list()) {
                let config = Object.keys(comp.pluginConfig).map((name) => name + '=' + comp.pluginConfig[name]).join(', ');
                if(config) {
                  config = ', config: ' + config;
                }
                w(`${comp.id}, type: ${comp.pluginInfo}${config}`);
              }
              w('---');
            }
          },
          create: {
            desc: 'Create a component (args: module, plugin, id)',
            impl: (w, m) => {
              const parts = m.split(' ');
              const data = {
                comp_id  : parts[2],
                library  : parts[0],
                type     : parts[1],
                config   : {},
                designer : {}
              };

              try {
                this._componentManager.create(data.library, data.type, data.comp_id, data.config, data.designer);
                w('Component created');
              } catch(ex) {
                logger.error(ex);
                w('Create error: ' + ex.message);
              }
            }
          },
          delete: {
            desc: 'Delete a component (args: id)',
            impl: (w, m) => {
              this._componentManager.delete(m, (err) => {
                if(err) { return w('Delete error: ' + err); }
                w('Component Deleted');
              });
            }
          }
        }
      }
    };
  }

  close(cb) {
    async.parallel([
      (cb) => this._adminClient.close(cb),
      (cb) => this._componentManager.close(cb)
    ], cb);
  }
};

/*
OK:

ui_base.ui_button (version: Thu Feb 19 22:25:44 2015) : usage=ui, class=.action|=value,{off;on}
ui_base.ui_state_binary (version: Thu Feb 19 22:25:48 2015) : usage=ui, class=.action,{off;on}|=value,{off;on}
ui_base.ui_state_0_100 (version: Wed Jul  1 22:11:28 2015) : usage=ui, class=.action,[0;100]|=value,[0;100]

TODO:

hw_exec.exec (version: Tue Jul 14 17:13:20 2015) : usage=driver, class=.action, config=s:bin|s:arg00|s:arg01|s:arg02|s:arg03|s:arg04|s:arg05|s:arg06|s:arg07|s:arg08|s:arg09|s:arg10|s:arg11|s:arg12|s:arg13|s:arg14|s:arg15
hw_exec.shell (version: Tue Jul 14 17:16:26 2015) : usage=driver, class=.action, config=s:command
vpanel_base.step_relay (version: Thu Feb 19 22:26:00 2015) : usage=vpanel, class=.action,{off;on}|=value,{off;on}
vpanel_base.timer (version: Thu Feb 19 22:26:08 2015) : usage=vpanel, class=.action,{off;on}|=value,{off;on}, config=i:delay
hw_mpd.mpd (version: Mon Jul 13 20:25:12 2015) : usage=driver, class=.toggle|.play|.pause|.set_volume,[0;100]|=connected,{off;on}|=playing,{off;on}|=volume,[0;100], config=s:host|i:port
hw_lirc.receive (version: Sat Jul 25 19:05:10 2015) : usage=driver, class==connected,{off;on}|=value,{off;on}, config=s:host|i:port|s:remote|s:button
hw_lirc.send (version: Sat Jul 25 19:05:06 2015) : usage=driver, class==connected,{off;on}|.action, config=s:host|i:port|s:remote|s:button
hw_sysfs_ac.ac_relay (version: Wed Jul  1 22:11:28 2015) : usage=driver, class=.action,{off;on}|=value,{off;on}, config=i:gpio
hw_sysfs_ac.ac_dimmer (version: Wed Jul  1 22:11:28 2015) : usage=driver, class=.action,[0;100]|=value,[0;100], config=i:gpio
hw_sysfs_ac.ac_button (version: Wed Jul  1 22:11:28 2015) : usage=driver, class==value,{off;on}


*/
/*

COMPONENTS JPACKETS

  list
    struct binding
    {
      std::string remote_id;
      std::string remote_attribute;
      std::string local_action;
    };

    struct component
    {
      std::string library;
      std::string type;
      std::string id;
      std::vector<binding> bindings;
      std::map<std::string, std::string> config;
      std::map<std::string, std::string> designer;
    };

  create
    std::string comp_id;
    std::string library;
    std::string type;
    std::map<std::string, std::string> config;
    std::map<std::string, std::string> designer;

  setDesigner
    std::string comp_id;
    std::map<std::string, std::string> designer;

  delete
    std::string comp_id;

  bind
    std::string local_id;
    std::string local_action;
    std::string remote_id;
    std::string remote_attribute;

  unbind
    std::string local_id;
    std::string local_action;
    std::string remote_id;
    std::string remote_attribute;

*/