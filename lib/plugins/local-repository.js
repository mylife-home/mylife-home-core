'use strict';

const path          = require('path');
const child_process = require('child_process');

module.exports = class LocalRepository {

  install(moduleInfo, done) {
    // npm install github:vincent-tr/mylife-home-core#5d638ce8a81c775610bb8f22177de95ca51c17ed
    const url = `github:${user}/${repoPrefix}${moduleInfo.name}#${moduleInfo.commit}`;
    return child_process.exec('npm install ' + url, {
      cwd: path.resolve(__dirname, '../..') // TODO: better ?
    }, (error/*, stdout, stderr*/) => {
      if(error) { return done(error); }

      // TODO setup locally moduleinfo

      return done();
    });
  }

  uninstall(moduleInfo, done) {
    // TODO ensure unused ?
    // TODO setup locally moduleinfo
    // TODO delete files
  }
};
