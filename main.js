// the options of this extention injected by content.js.
var config = injectedConfig;

// Only run if we are in the right :username:/:repo:
if((config.username && config.repo) && window.location.pathname.indexOf( config.username + '/' + config.repo ) !== -1 ) {

  var $firstButton = $('.repository-sidebar .sunken-menu-group li:first');
  var $boardButton = $firstButton.clone();
  var $openIssues  = $();
  var $inProgressIssues = $();
  var $codeReviewIssues = $();
  var $closedIssues     = $();
  var $board = $('<div class="gitban_board gitban_board_loading" />');

  var $milestone = $([
    '<div class="gitban_milestone">',
      '<h4 class="gitban_milestone_name"><a href="https://github.com/' + config.username + '/' + config.repo + '/milestones" target="_blank">Milestone</a></h4>',
      '<h5 class="milestone-meta">',
        '<span class="milestone-meta-item"></span>',
      '</h5>',
    '</div>'
  ].join(''));

  var $loader = $([
    '<div class="context-loader large-format-loader is-context-loading">',
      '<p><img height="64" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-128.gif" /></p>',
      '<p>Loading...</p>',
    '</div>'
  ].join(''));

  // Append the milestone
  $milestone.prependTo( $board );

  // Label the button
  $boardButton.addClass('gitban_button')
    .attr('aria-label', 'Kanban');

  // Replace Icon
  $boardButton.find('.octicon')
    .addClass('octicon octicon-three-bars')

  // Text Label
  $boardButton.find('.full-word')
    .text('Kanban');

  // Deselect the clone
  $boardButton.find('a')
    .removeClass('js-selected-navigation-item selected');

  // Insert Button
  $boardButton.insertAfter( $firstButton );

  // Insert empty kanban board
  $board.append( $loader )
    .appendTo('.repository-with-sidebar');

  /**
   * Markup for issue columns. Icons are octicons.
   *
   * @param  {object} atts { className:, icon:, stage: }
   * @return {object}      jQuery Object
   */
  function $issuesColMarkup( atts ) {
    return $([
      '<div class="gitban_issues gitban_issues_' + atts.className + '">',
        '<div class="table-list-header">',
          '<h5>',
            '<span class="octicon octicon-' + atts.icon + '"></span>',
            atts.stage,
          '</h5>',
          '<span class="gitban_count"></span>',
        '</div>',
        '<div class="gitban_issues_container"></div>',
      '</div>'
    ].join(''));
  }

  /**
   * Markup for individual issues.
   *
   * @param  {object} issue #see https://developer.github.com/v3/issues/
   * @return {object}       jQuery Object
   */
  function $issueMarkup( issue ) {
    var avatar = (!!issue.assignee) ? issue.assignee.avatar_url : '';
    var labels = '';

    issue.labels.forEach(function(label) {
      if( label.name !== 'in progress' ) {
        labels += ' <span style="background:#' + label.color + '" class="label">' + label.name + '</span>';
      }
    });

    return $([
      '<div class="gitban_issue">',
        '<div class="gitban_issue_data">',
          '<img class="gitban_avatar" src="' + avatar + '" />',
          '<h4>' + issue.title + '</h4>',
          '<h6>#' + issue.number + '</h6>',
        '</div>',
        '<div class="gitban_tags">' + labels + '</div>',
        '<span class="gitban_link"><a href="' + issue.html_url + '" target="_blank"></a></span>',
      '</div>'
    ].join(''));
  }

  /**
   * Close the Kanban board, restore normal github.
   */
  function closeGitban() {
    var $container = $('.container');

    $container.removeClass('show_gitban');
    $('.repo-container').addClass('with-full-navigation');
    $('.repository-content').show();
  }

  // Close if clicking anything but the kanban button
  $('.repository-sidebar .sunken-menu-group li:not(.gitban_button)').on('click', closeGitban);

  /**
   * Clear all issues from a kanban column
   *
   * @param  {object} $el jQuery Object for column
   */
  function emptyKanbanCol( $el ) {
    $el.find('.gitban_issues_container').empty();
  }

  /**
   * Load the github issues for the current milestone.
   */
  function loadGitHubIssues() {

    $loader.show();

    if( !$openIssues.length ) {
      $openIssues = $issuesColMarkup({
        className: 'open',
        stage: 'Open',
        icon: 'issue-opened'
      });

      $openIssues.appendTo( $board );
    } else {
      emptyKanbanCol( $openIssues );
    }

    if( !$inProgressIssues.length ) {
      $inProgressIssues = $issuesColMarkup({
        className: 'in_progress',
        stage: 'In Progress',
        icon: 'flame'
      });

      $inProgressIssues.appendTo( $board );
    } else {
      emptyKanbanCol( $inProgressIssues );
    }

    if( !$codeReviewIssues.length ) {
      $codeReviewIssues = $issuesColMarkup({
        className: 'code_review',
        stage: 'Testing & Code Review',
        icon: 'comment-discussion'
      });

      $codeReviewIssues.appendTo( $board );
    } else {
      emptyKanbanCol( $codeReviewIssues );
    }

    if( !$closedIssues.length ) {
      $closedIssues = $issuesColMarkup({
        className: 'closed',
        stage: 'Closed',
        icon: 'issue-closed'
      });

      $closedIssues.appendTo( $board );
    } else {
      emptyKanbanCol( $closedIssues );
    }

    var github = new Github({
      token: config.token,
      auth: 'oauth'
    });

    var repo = github.getRepo(config.username, config.repo);
    var milestone;

    repo.listMilestones(function(err, milestones) {
      if( err ) {
        return;
      }

      milestones.forEach(function(ms) {
        if( !milestone || new Date(ms.due_on) < new Date(milestone.due_on) ) {
          milestone = ms;
        }
      });

      // Set the title
      $milestone.find('.gitban_milestone_name a')
        .text( 'Working On: ' + milestone.title );

      // Get time left
      var dayDiff   = Math.floor( (new Date( milestone.due_on ) - new Date()) / 86400000 );
      var timeLeft  = ( dayDiff <= 7 ) ? dayDiff + ' days' : Math.floor(dayDiff / 7) + ' weeks';

      // Set the open / closed
      $milestone.find('.milestone-meta-item')
        .html( '<span class="octicon octicon-calendar"></span>' + ' Due in ' + timeLeft )

      // Set open/closed issues
      $milestone.find('.gitban_milestone_description p')
        .html( milestone.description );

      getIssues();
    });

    /**
     * Once we have our milestone load our issues.
     */
    function getIssues() {
      var closeMessageRegex   = /((?:[Cc]los(?:e[sd]?|ing)|[Ff]ix(?:e[sd]|ing)?|[Rr]esolv(?:e[sd]?|ing)) +(?:(?:issues? +)?#\d+(?:(?:, *| +and +)?))+)/g;
      var pullRequestedIssues = [];

      // Get the issue #'s referenced in open pull requests
      repo.listPulls('open', function(err, pullRequests) {
        if( err ) {
          return;
        }

        pullRequests.forEach(function(pr) {
          var matches = pr.title.match( closeMessageRegex );

          if( !matches ) return;

          matches.forEach(function(issueNum) {
            issueNum = Number( issueNum.replace(/\D/g,'') );

            if( pullRequestedIssues.indexOf(issueNum) === -1 ) {
              pullRequestedIssues.push( issueNum );
            }
          });
        });
      });

      var opts      = { user: config.username, repo: config.repo, milestone: milestone.number, state: 'all' };
      var issues    = github.getIssues(config.username, config.repo);
      var colCount  = [0,0,0,0];

      // Sort issues into kanban columns
      issues.list(opts, function(err, issues) {
        if( err ) {
          return;
        }

        issues.forEach(function(issue) {
          var $i = $issueMarkup( issue );

          // The issue is closed
          if( issue.state === 'closed' ) {
            $closedIssues.find('.gitban_issues_container').append( $i );
            colCount[3]++;

          // There's an open pull request referencing this issue
          } else if( pullRequestedIssues.indexOf( issue.number ) !== -1 ) {
            $codeReviewIssues.find('.gitban_issues_container').append( $i );
            colCount[2]++;

          // Alternative for in progress column: the issue has been assigned
          // } else if( !!issue.assignee ) {

          // TODO: Don't hardcode "in progress" ?
          } else if( issue.labels.map(function(l) { return l.name; }).indexOf('in progress') !== -1 ) {
            $inProgressIssues.find('.gitban_issues_container').append( $i );
            colCount[1]++;

          // Otherwise it's open
          } else {
            $openIssues.find('.gitban_issues_container').append( $i );
            colCount[0]++;
          }
        });

        // Set 'total's for each column
        var $count = $('.gitban_count');
        colCount.forEach(function(num, i) {
          $count.eq(i).text( num );
        });

        $loader.hide();
      });
    }

  }

  /**
   * Show/Hide the kanban board when pressing the kanban board button
   *
   * @param  {object} e  $.Event
   */
  $boardButton.on('click', function openBoard(e) {
    e.preventDefault();
    e.stopPropagation();

    var $container = $('.container');

    // Restore default behaviour
    if( $container.hasClass('show_gitban') ) {
      closeGitban();
      return;
    }

    loadGitHubIssues();

    $container.addClass('show_gitban');
    $('.repo-container').removeClass('with-full-navigation');
    $('.repository-content').hide();

  });

}
