# What

A Chrome extension which injects a fully automated Kanban board into GitHub, hacked together very quickly. 

![Kanban Board](https://cldup.com/ER89tfJKTN-1200x1200.png)

# Usage

* Mark your issues with the `in progress` tag when you begin work on them.
* Always [close issues with a commit message](https://help.github.com/articles/closing-issues-via-commit-messages/) (fix #123, etc...). These messages are used to move issues to the Testing / Code Review column. 
* That's it - everything else will happen automatically.

# Installation

* `git clone` the repo
* Go to [chrome://extensions/](chrome://extensions/) to manage your extensions
* Check the `developer mode` box at the top of this page
* `Load upacked extension` - point this to where you cloned the repo
* Visit the extension's options page to fill our the username (vectrlabs), the repo (vectr), and your personal access token
