'use strict';

const GitHubApi = require('github');

module.exports = class {
  constructor(config) {
    console.log('started');

    this.loop();

    const github = new GitHubApi({ version: '3.0.0' });
    const user = 'vincent-tr';
    github.repos.getFromUser({ user: user }, (err, res) => {
      if(err) { return console.error(err); }
      for(let repo of res) {
        console.log(repo.id, repo.name, repo.description, repo.pushed_at);

      }

      let repo = res[3];
      github.repos.getCommits({user: user, repo: repo.name}, (err, res) => {
        if(err) { return console.error(err); }
        for(let commit of res) {
          console.log(commit.sha, commit.commit.committer.date);
        }
        let commit = res[4];

        github.repos.getContent({ user: user, repo: repo.name, path: '/'}, (err, res) => {
          if(err) { return console.error(err); }
          console.log('content');
          console.log(res);
        });
      });

    });
  }

  // npm install github:vincent-tr/mylife-home-core#5d638ce8a81c775610bb8f22177de95ca51c17ed

  loop() {
    setTimeout(this.loop.bind(this), 1000);
  }

  close(cb) {
    console.log('stopped');
    setImmediate(cb);
  }
};
