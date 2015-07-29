function compileConfig(options) {
    var _options = options || {repo: '', username: '', token: ''};
    return 'var injectedConfig = ' + JSON.stringify(_options) + ';'
}

chrome.storage.local.get('options', function(items) {
    var injectedVars = [
        compileConfig(items.options)
    ].join('\n')

    var injectedCodes = document.createElement('script');
    injectedCodes.textContent = injectedVars;
    (document.head || document.documentElement).appendChild(injectedCodes);

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
});
