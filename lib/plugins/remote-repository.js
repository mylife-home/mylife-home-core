'use strict';

const GitHubApi  = require('github');
const async      = require('async');

const user       = 'vincent-tr';
const repoPrefix = 'mylife-home-core-plugins-';

module.exports = class RemoteRepository {
  constructor() {
    this._github = new GitHubApi({ version: '3.0.0' });
    this._list = undefined;
  }

  fetch(done) {


    this._github.repos.getFromUser({ user: user }, (err, res) => {
      if(err) { return done(err); }

      const localList = [];
      const tasks = [];

      const addCommitLoader = (item) => {
        return (done) => {
          return this._github.repos.getCommits({user: user, repo: repoPrefix + item.name}, (err, res) => {
            if(err) { return done(err); }
            if(!res.length) { return done(); } // repo without commit ?!
            const commit = res[0]; // lastest first
            item.commit = commit.sha;
            item.date = commit.commit.committer.date;
            return done();
          });
        };
      };

      for(let repo of res) {
        if(!repo.name.startsWith(repoPrefix)) { continue; }

        const item = {
          name        : repo.name.substr(repoPrefix.length),
          description : repo.description
        };

        localList.push(item);
        tasks.push(addCommitLoader(item));
      }

      if(!tasks.length) {
        this._list = [];
        return done();
      }

      return async.parallel(tasks, (err) => {
        if(err) { done(err); }
        this._list = localList;
        done();
      });

    });
  }

  list() {
    return this._list;
  }
};
