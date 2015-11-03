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


    [
      'vendor/github.js',
      'vendor/moment.min.js',
      'vendor/chartist.min.js',
      'main.js'
    ].forEach(function(script) {
        var scriptElement = document.createElement('script');
        scriptElement.src = chrome.extension.getURL(script);
        (document.head || document.documentElement).appendChild(scriptElement);
    });

    ['vendor/chartist.min.css', 'main.css'].forEach(function(css) {
        // Stylesheet
        var style = document.createElement('link');
        style.rel   = 'stylesheet';
        style.type  = 'text/css';
        style.href  = chrome.extension.getURL(css);
        (document.head || document.documentElement).appendChild(style);
    });
});
