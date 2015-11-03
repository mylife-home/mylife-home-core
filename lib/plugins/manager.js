'use strict';

const GitHubApi = require('github');

module.exports = class {

  constructor() {
    this._github = new GitHubApi({ version: '3.0.0' });
  }

  list() {
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

    // npm install github:vincent-tr/mylife-home-core#5d638ce8a81c775610bb8f22177de95ca51c17ed

  }
};
