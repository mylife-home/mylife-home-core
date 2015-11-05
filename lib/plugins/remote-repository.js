'use strict';

const GitHubApi = require('github');
const async     = require('async');

module.exports = class RemoteRepository {
  constructor() {
    this._github = new GitHubApi({ version: '3.0.0' });
  }

  fetch(done) {
    const user = 'vincent-tr';
    this._github.repos.getFromUser({ user: user }, (err, res) => {
      if(err) { return console.error(err); }
      for(let repo of res) {
        console.log(repo.id, repo.name, repo.description, repo.pushed_at);
      }

      let repo = res[3];
      this._github.repos.getCommits({user: user, repo: repo.name}, (err, res) => {
        if(err) { return console.error(err); }
        for(let commit of res) {
          console.log(commit.sha, commit.commit.committer.date);
        }
      });
    });
  }

  list() {

  }

};
