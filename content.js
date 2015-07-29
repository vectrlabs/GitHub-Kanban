// GitHub API (Ironic...)
var gitbanGitHub = document.createElement('script');
gitbanGitHub.src = chrome.extension.getURL('github/github.js');
(document.head || document.documentElement).appendChild(gitbanGitHub);

// Script
var script = document.createElement('script');
script.src = chrome.extension.getURL('main.js');
(document.head || document.documentElement).appendChild(script);

// Stylesheet
var style = document.createElement('link');
style.rel   = 'stylesheet';
style.type  = 'text/css';
style.href  = chrome.extension.getURL('main.css');

(document.head || document.documentElement).appendChild(style);
