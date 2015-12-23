'use strict';

const os         = require('os');
const async      = require('async');
const log4js     = require('log4js');
const common     = require('mylife-home-common');
const plugins    = require('./plugins');
const components = require('./components');
const logger     = log4js.getLogger('core.Server');

/*
enum class plugin_usage
{
  vpanel = 1,
  ui = 2,
  driver = 3
};
*/

const pluginUsage = {
  'vpanel' : 1,
  'ui'     : 2,
  'driver' : 3
};

module.exports = class {
  constructor(config) {
    this._pluginManager    = new plugins.Manager();
    this._componentManager = new components.Manager(config.net, this._pluginManager.local);
    this._adminClient      = new common.admin.Client(config.net, this._adminNick(), this._createAdminDefinition());
    this._adminExecutor    = new common.net.jpacket.Executor(this._adminClient);

    this._adminExecutor.on('components',        this._executeComponents.bind(this));
    this._adminExecutor.on('plugins',           this._executePlugins.bind(this));
    this._adminExecutor.on('comp_create',       this._executeComponentCreate.bind(this));
    this._adminExecutor.on('comp_delete',       this._executeComponentDelete.bind(this));
    this._adminExecutor.on('comp_bind',         this._executeComponentBind.bind(this));
    this._adminExecutor.on('comp_unbind',       this._executeComponentUnbind.bind(this));
    this._adminExecutor.on('comp_set_designer', this._executeComponentSetDesigner.bind(this));
  }

  _adminNick() {
    return 'mylife-home-core_' + os.hostname().split('.')[0];
  }

  _installPlugin(name, done) {
    let data;
    const unloader = (cb) => this._componentManager.unloadModules([name], (err, d) => {
      if(err) { return cb(err); }
      data = d;
      cb();
    });
    const reloader = (cb) => {
      try {
        this._componentManager.reloadModules(data);
        setImmediate(cb);
      } catch(ex) {
        setImmediate(cb, ex.message);
      }
    };
    this._pluginManager.install(name, unloader, reloader, done);
  }

  _updateAll(w, done) {
    let updateList;
    try {
      updateList = this._pluginManager.updateList();
    } catch (err) {
      return done(err);
    }

    const createPluginInstaller = (name) => {
      return (done) => {
        this._installPlugin(name, (err) => {
          if(err) { return done(err); }
          w('Plugin ' + name + ' updated');
          return done();
        });
      };
    };

    const tasks = updateList.map(update => createPluginInstaller(update.name));
    async.series(tasks, done);
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
                  this._installPlugin(m, (err) => {
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
                  try {
                    const usage = this._componentManager.list().filter((comp) => comp.pluginInfo.module === m);
                    if(usage.length) {
                      throw new Error('Used by components: ' + usage.map((comp) => comp.id).join(', '));
                    }
                    this._pluginManager.uninstall(m);
                    w('Uninstall done');
                  } catch(ex) {
                    w('Uninstall error: ' + ex.message);
                  }
                }
              },
              'update-list': {
                desc: 'List available updates',
                impl: (w) => {
                  try {
                    w('Update list:');
                    const list = this._pluginManager.updateList();
                    for(let info of list) {
                      w(`${info.name} (${info.remote.description}): remote date: ${info.remote.date}, remote commit: ${info.remote.commit.substr(0, 7)}, local date: ${info.local.date}`);
                    }
                    w('---');
                  } catch(ex) {
                    w('Error: ' + ex.message);
                  }
                }
              },
              'update-all': {
                desc: 'Apply all available updates',
                impl: (w) => {
                  this._updateAll(w, (err) => {
                    if(err) {
                      w('Update error: ' + err);
                    } else {
                      w('Update done');
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
            desc: 'Create a component (args: module, plugin, id, config1, value1, config2, value2, ...)',
            impl: (w, m) => {

              try {
                const parts = m.split(' ');
                if(parts.length < 3) { throw new Error('not enough parameters'); }
                const data = {
                  comp_id  : parts[2],
                  library  : parts[0],
                  type     : parts[1],
                  config   : {},
                  designer : {}
                };

                const configs = parts.slice(3);
                for(let i=0; i< configs.length / 2; ++i) {
                  data.config[configs[2*i]] = configs[2*i+1];
                }

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
          },
          bind: {
            desc: 'Bind a component (args: id, action, remoteId, remoteAttribute)',
            impl: (w, m) => {
              try {
                const parts = m.split(' ');
                if(parts.length < 4) { throw new Error('not enough parameters'); }
                const data = {
                  local_id         : parts[0],
                  local_action     : parts[1],
                  remote_id        : parts[2],
                  remote_attribute : parts[3]
                };

                this._componentManager.bind(
                  data.local_id,
                  data.local_action,
                  data.remote_id,
                  data.remote_attribute);

                w('Component Bound');
              } catch(ex) {
                w('Bind error: ' + ex.message);
              }
            }
          },
          unbind: {
            desc: 'Unbind a component (args: id, action, remoteId, remoteAttribute)',
            impl: (w, m) => {

              try {
                const parts = m.split(' ');
                if(parts.length < 4) { throw new Error('not enough parameters'); }
                const data = {
                  local_id         : parts[0],
                  local_action     : parts[1],
                  remote_id        : parts[2],
                  remote_attribute : parts[3]
                };

                this._componentManager.unbind(
                  data.local_id,
                  data.local_action,
                  data.remote_id,
                  data.remote_attribute);

                w('Component Unbound');
              } catch(ex) {
                w('Unbind error: ' + ex.message);
              }
            }
          },
        }
      }
    };
  }

  _executeComponents(req, cb) {
    const factory = common.net.jpacket.Factory;

    function mapBinding(binding) {
      return {
        remote_id : binding.remoteId,
        remote_attribute : binding.remoteAttribute,
        local_action : binding.action
      };
    }

    const list = this._componentManager.list().map((comp) => ({
      library  : comp.pluginInfo.module,
      type     : comp.pluginInfo.name,
      id       : comp.id,
      config   : comp.pluginConfig,
      designer : comp.designerData,
      bindings : comp.bindingsData.map(mapBinding)
    }));

    return setImmediate(cb, undefined, factory.createComponentList(list));
  }

  _executePlugins(req, cb) {
    const factory = common.net.jpacket.Factory;
    const list = [];
    for(let module of this._pluginManager.localList()) {
      for(let plugin of module.plugins) {
        list.push({
          library : module.name,
          type    : plugin.name,
          usage   : pluginUsage[plugin.metadata.usage],
          version : module.date + ' ' + module.commit.substr(0, 7),
          clazz   : plugin.metadata.strings.clazz,
          config  : plugin.metadata.strings.config
        });
      }
    }
    return setImmediate(cb, undefined, factory.createPluginList(list));
  }

  _executeComponentCreate(req, cb) {
    const factory = common.net.jpacket.Factory;
    try {
      this._componentManager.create(req.library, req.type, req.comp_id, req.config, req.designer);
      setImmediate(cb, undefined, factory.createSuccess());
    } catch(ex) {
      setImmediate(cb, factory.createError(ex.message));
    }
  }

  _executeComponentDelete(req, cb) {
    const factory = common.net.jpacket.Factory;
    this._componentManager.delete(req.comp_id, (err) => {
      if(err) { return cb(factory.createError(err)); }
      return cb(undefined, factory.createSuccess());
    });
  }

  _executeComponentBind(req, cb) {
    const factory = common.net.jpacket.Factory;
    try {
      this._componentManager.bind(
        req.local_id,
        req.local_action,
        req.remote_id,
        req.remote_attribute);

      setImmediate(cb, undefined, factory.createSuccess());
    } catch(ex) {
      setImmediate(cb, factory.createError(ex.message));
    }
  }

  _executeComponentUnbind(req, cb) {
    const factory = common.net.jpacket.Factory;
    try {
      this._componentManager.unbind(
        req.local_id,
        req.local_action,
        req.remote_id,
        req.remote_attribute);

      setImmediate(cb, undefined, factory.createSuccess());
    } catch(ex) {
      setImmediate(cb, factory.createError(ex.message));
    }
  }

  _executeComponentSetDesigner(req, cb) {
    const factory = common.net.jpacket.Factory;
    try {
      this._componentManager.setDesigner(req.comp_id, req.designer);
      setImmediate(cb, undefined, factory.createSuccess());
    } catch(ex) {
      setImmediate(cb, factory.createError(ex.message));
    }
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

vpanel_base.step_relay (version: Thu Feb 19 22:26:00 2015) : usage=vpanel, class=.action,{off;on}|=value,{off;on}
vpanel_base.timer (version: Thu Feb 19 22:26:08 2015) : usage=vpanel, class=.action,{off;on}|=value,{off;on}, config=i:delay

hw_exec.exec (version: Tue Jul 14 17:13:20 2015) : usage=driver, class=.action, config=s:bin|s:arg00|s:arg01|s:arg02|s:arg03|s:arg04|s:arg05|s:arg06|s:arg07|s:arg08|s:arg09|s:arg10|s:arg11|s:arg12|s:arg13|s:arg14|s:arg15
hw_exec.shell (version: Tue Jul 14 17:16:26 2015) : usage=driver, class=.action, config=s:command

hw_mpd.mpd (version: Mon Jul 13 20:25:12 2015) : usage=driver, class=.toggle|.play|.pause|.set_volume,[0;100]|=connected,{off;on}|=playing,{off;on}|=volume,[0;100], config=s:host|i:port

hw_sysfs_ac.ac_dimmer (version: Wed Jul  1 22:11:28 2015) : usage=driver, class=.action,[0;100]|=value,[0;100], config=i:gpio
hw_sysfs_ac.ac_button (version: Wed Jul  1 22:11:28 2015) : usage=driver, class==value,{off;on}

TODO:

hw_lirc.receive (version: Sat Jul 25 19:05:10 2015) : usage=driver, class==connected,{off;on}|=value,{off;on}, config=s:host|i:port|s:remote|s:button
hw_lirc.send (version: Sat Jul 25 19:05:06 2015) : usage=driver, class==connected,{off;on}|.action, config=s:host|i:port|s:remote|s:button
hw_sysfs_ac.ac_relay (version: Wed Jul  1 22:11:28 2015) : usage=driver, class=.action,{off;on}|=value,{off;on}, config=i:gpio

*/
