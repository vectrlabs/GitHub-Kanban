// Add a user story template
// Add a bug template
// Try to get @github mentions posting to slack DM's

// To understand how this works see: https://gist.github.com/srsudar/e9a41228f06f32f272a2

var issueTemplates = {

  // New Feature Template
  newFeature: [
    '#### Summary',
    '\n...',
    '\n\n#### User Story',
    '\nAs a `type_of_user`, I want `to_perform_some_task` so that I can `achieve_some_goal_benefit_or_value`.',
    '\n\n#### Behaviour of the UI',
    '\n...',
    '\n\n#### Design Reference / Mockup / Sketches (optional)',
    '\n...',
    '\n\n#### Notes (optional)',
    '\n...',
    '\n\n#### References (optional)',
    '\n- [link](link)'
  ].join(''),

  // Enhacenment or Bugfix template
  newBug: [
    '#### Summary',
    '\n...',
    '\n\n#### Steps To Reproduce',
    '\n+\n+\n+',
    '\n\n#### Expected Results',
    '\n...',
    '\n\n#### Actual Results',
    '\n...',
    '\n\n#### Tasks (optional)',
    '\n...',
    '\n\n#### Notes (optional)',
    '\n...',
    '\n\n#### References (optional)',
    '\n- [link](link)'
  ].join('')
};

chrome.runtime.onInstalled.addListener(function(details) {

  // Parent item
  var parent = chrome.contextMenus.create({
    title: 'Issue',
    contexts: ['editable']
  });

  chrome.contextMenus.create({
    title: 'Feature / Enhancement',
    parentId: parent,
    id: 'newFeature',
    contexts: ['editable']
  });

  chrome.contextMenus.create({
    title: 'Bug',
    parentId: parent,
    id: 'newBug',
    contexts: ['editable']
  });

});

// Add handler to send to content script
function onClickHandler(info, tab) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { data: issueTemplates[info.menuItemId] });
  });
}

chrome.contextMenus.onClicked.addListener(onClickHandler);
