function message(msg){
    alert(msg);
}

var $token = document.getElementById('options-token');
var $username = document.getElementById('options-username');
var $repo = document.getElementById('options-repo');
var $saveButton = document.getElementById('save');

chrome.storage.local.get('options', function(items){
    var options = items.options;
    if(options.token)
        $token.value = options.token;
    if(options.username)
        $username.value = options.username;
    if(options.repo)
        $repo.value = options.repo;
});

$saveButton.addEventListener('click', function saveOptions () {
    var token = $token.value;
    var username = $username.value;
    var repo = $repo.value;

    if(!token) {
        message('Error: No github token specified');
        return;
    }
    if(!username) {
        message('Error: No github username specified');
        return;
    }
    if(!repo) {
        message('Error: No github repo specified');
        return;
    }

    chrome.storage.local.set({
        options: {
            token: token,
            username: username,
            repo: repo
        }
    }, function() {
        message('saved');
    });
});
