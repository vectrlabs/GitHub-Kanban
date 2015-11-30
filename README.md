# What

A Chrome extension which injects a fully automated Kanban board into GitHub, hacked together very quickly.

![Kanban Board](https://cldup.com/3ttja2zfJZ-2000x2000.png)

# Usage

* Mark your issues with the `in progress` tag when you begin work on them.
* Always [close issues with a commit message](https://help.github.com/articles/closing-issues-via-commit-messages/) (fix #123, etc...). These messages are used to move issues to the Testing / Code Review column.
* That's it - everything else will happen automatically.

# GitHub Issue Templates

We've included some templates for GitHub issues. These templates help us clearly and consistently explain our GitHub issues. As a remote team, this type of communication can be more difficult that other teams, but we've found that these templates work very well for us. *Please use these templates _every_ time you create a GitHub issue ;)*.

![](https://cldup.com/XLkwaMCtJp-3000x3000.png)

# Installation

## From Chrome web store

it's recommended to install via chrome web store since it can be automated update.

* Go to [Chrome web store](https://chrome.google.com/webstore/) and login with your @vectr.com account.
* Go to [this page](https://chrome.google.com/webstore/detail/github-kanban/mmdoepbmcmdbfobcabocpeocoldfdkph) and install it
* if you have multiple google accounts, add `?authuser=x` (`x=[1,2,3...]`) to the [extension link](https://chrome.google.com/webstore/detail/github-kanban/mmdoepbmcmdbfobcabocpeocoldfdkph?authuser=1)


## Manual

* `git clone` the repo
* Go to [chrome://extensions/](chrome://extensions/) to manage your extensions
* Check the `developer mode` box at the top of this page
* `Load upacked extension` - point this to where you cloned the repo
* Visit the extension's options page to fill our the username (vectrlabs), the repo (vectr), and your personal access token
