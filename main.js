// the options of this extention injected by content.js.
var config = injectedConfig;

// Only run if we are in the right :username:/:repo:
if((config.username && config.repo) && window.location.pathname.indexOf( config.username + '/' + config.repo ) !== -1 ) {

  var $firstButton = $('.repository-sidebar .sunken-menu-group li:first');
  var $boardButton = $firstButton.clone();
  var $openIssues  = $();
  var $inProgressIssues = $();
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

  var $progress = $([
    '<div class="gitban_progress">',
      '<div class="gitban_milestone">',
        '<h4 class="gitban_milestone_name">Team Progress</h4>',
      '</div>',
      '<div class="burndown-desc"><strong>more than one week:</strong> 10 points, <strong>one week:</strong> 5 points, <strong>one day and no estimation:</strong> 1 point</div>',
      '<div class="ct-chart"></div>',
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
  $board.append( $loader, $progress )
    .appendTo('.repo-container');

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
          '<h5>#' + issue.number + '</h5>',
          '<div class="gitban_tags">' + labels + '</div>',
        '</div>',
        '<span class="gitban_link"><a href="' + issue.html_url + '" target="_blank"></a></span>',
      '</div>'
    ].join(''));
  }

  /**
   * Close the Kanban board, restore normal github.
   */
  function closeGitban() {
    var $container = $('.repo-container').closest('.container');

    $board.hide();
    $container.removeClass('show_gitban');
    $('.gitban_button').find('a').removeClass('selected');
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

      $openIssues.insertBefore( $progress );
    } else {
      emptyKanbanCol( $openIssues );
    }

    if( !$inProgressIssues.length ) {
      $inProgressIssues = $issuesColMarkup({
        className: 'in_progress',
        stage: 'In Progress',
        icon: 'flame'
      });

      $inProgressIssues.insertBefore( $progress );
    } else {
      emptyKanbanCol( $inProgressIssues );
    }

    if( !$closedIssues.length ) {
      $closedIssues = $issuesColMarkup({
        className: 'closed',
        stage: 'Closed',
        icon: 'issue-closed'
      });

      $closedIssues.insertBefore( $progress );
    } else {
      emptyKanbanCol( $closedIssues );
    }

    var github = new Github({
      token: config.token,
      auth: 'oauth'
    });

    var repo = github.getRepo(config.username, config.repo);
    var milestone;
    var previousMilestone;
    var issues;

    repo.listMilestones({state: 'all'}, function(err, milestones) {
      if( err ) {
        return;
      }

      milestones.sort(function(a, b) {
        return new Date(a.due_on) > new Date(b.due_on);
      });

      milestone = milestones.pop();
      previousMilestone = milestones.pop();

      // Set the title
      $milestone.find('.gitban_milestone_name a')
        .text( 'Working On: ' + milestone.title );

      // Get time left
      var dayDiff   = Math.floor( (new Date( milestone.due_on ) - new Date()) / 86400000 );
      var timeLeft  = ( dayDiff <= 7 ) ? dayDiff + ' days' : Math.floor(dayDiff / 7) + ' weeks';

      var desktopReleaseTimeBase = moment('2015-10-20');
      var nextDesktopReleaseDate = desktopReleaseTimeBase.add(4, 'weeks');

      var websiteReleaseTimeBase = moment('2015-11-03');
      var nextWebsiteReleaseDate = websiteReleaseTimeBase.add(2, 'weeks');

      var desktopReleaseHTML =
        'Next Desktop : ' +
        nextDesktopReleaseDate.format('YYYY-MM-DD');

      var websiteReleaseHTML =
        'Next Website : ' +
        nextWebsiteReleaseDate.format('YYYY-MM-DD');

      var dueHTML =
        '<span class="octicon octicon-calendar"></span>' +
        ' Due in ' + timeLeft;

      // Set the open / closed
      $milestone.find('.milestone-meta-item')
        .html(desktopReleaseHTML + ' , ' + websiteReleaseHTML + ' , ' + dueHTML);

      // Set open/closed issues
      $milestone.find('.gitban_milestone_description p')
        .html( milestone.description );

      getIssues();
    });

    function getIssueEstimation(issue) {
      var estimation;
      var label = issue.labels.filter(function(label) {
        return label.name.indexOf('estimate') !== -1;
      })[0];

      if (!label) {
        estimation = 0;
      }
      else if (label.name.indexOf('estimate: more than 1 week') !== -1) {
        estimation = 10;
      }
      else if (label.name.indexOf('estimate: 1 week') !== -1) {
        estimation = 5;
      }
      else if (label.name.indexOf('estimate: 1 day') !== -1) {
        estimation = 1;
      }
      else {
        estimation = 1;
      }

      return estimation;
    }

    /**
     * Once we have our milestone load our issues.
     */
    function getIssues() {
      var closeMessageRegex = /((?:[Cc]los(?:e[sd]?|ing)|[Ff]ix(?:e[sd]|ing)?|[Rr]esolv(?:e[sd]?|ing)) +(?:(?:issues? +)?#\d+(?:(?:, *| +and +)?))+)/g;

      var opts      = { user: config.username, repo: config.repo, milestone: milestone.number, state: 'all' };
      var issuesObj    = github.getIssues(config.username, config.repo);
      var colCount  = [0,0,0];
      var users     = [];

      // Sort issues into kanban columns
      issuesObj.list(opts, function(err, data) {
        if( err ) {
          return;
        }

        issues = data;
        issues.sort(function(a, b) {
          return getIssueEstimation(b) - getIssueEstimation(a);
        });

        issues.forEach(function(issue) {
          var $i = $issueMarkup( issue );
          var $userProgress = $();
          issue.estimation = getIssueEstimation(issue);

          if( !!issue.assignee && users.indexOf(issue.assignee.id) === -1 ) {
            users.push(issue.assignee.id);

            $userProgress = $issuesColMarkup({
              className: 'progress',
              stage: issue.assignee.login,
              icon: 'pulse'
            });

            $userProgress.attr('user-id', issue.assignee.id);
            $progress.append( $userProgress );
          } else if( !!issue.assignee ) {
            $userProgress = $('[user-id="' + issue.assignee.id + '"]');
          }

          // The issue is closed
          if( issue.state === 'closed' ) {
            $userProgress.find('.gitban_issues_container').append( $i.clone() );
            $closedIssues.find('.gitban_issues_container').append( $i.clone() );
            colCount[2]++;

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

        generateBurndown();

        // Set 'total's for each column
        var $count = $('.gitban_count');
        colCount.forEach(function(num, i) {
          $count.eq(i).text( num );
        });

        $loader.hide();
      });
    }

    function generateBurndown() {
      var endDate = new Date(milestone.due_on);
      var startDate = new Date(previousMilestone.due_on);
      var now = new Date();
      var diffDays = Math.ceil(Math.abs(startDate.getTime() - endDate.getTime()) / (1000 * 3600 * 24));
      var diffDaysUntilNow = Math.ceil(Math.abs(startDate.getTime() - now.getTime()) / (1000 * 3600 * 24)) + 1;
      var days = new Array(diffDays);
      var estimation = new Array(days.length);
      var untilNow = new Array(diffDaysUntilNow);
      var cursor = startDate;

      days.fill('day ');
      days = days.map(function(d, i) {
        return d + (i+1);
      });

      var allPoints = 0;

      issues.forEach(function(issue) {
        allPoints += issue.estimation;
      });
      untilNow.fill(allPoints);

      issues.forEach(function(issue) {
        if (issue.state === 'closed') {
          var closedDate = new Date(issue.closed_at);
          var offset = Math.ceil(Math.abs(startDate.getTime() - closedDate.getTime()) / (1000 * 3600 * 24));
          untilNow.forEach(function(estimation, i) {
            if (i >= offset) {
              untilNow[i] -= issue.estimation;
            }
          })
        }
      })

      estimation.fill(0);
      estimation = estimation.map(function(d, i) {
        return allPoints / days.length * (days.length - i);
      });


      var data = {
        // A labels array that can contain any sort of values
        labels: days,
        // Our series array that contains series objects or in this case series data arrays
        series: [
          estimation, untilNow
        ]
      };

      var options = {
        height: 400,
        axisX: {
          showLabel: true
        }
      };

      // Create a new line chart object where as first parameter we pass in a selector
      // that is resolving to our chart container element. The Second parameter
      // is the actual data object.
      new Chartist.Line('.ct-chart', data, options);
    }
  }

  // Previously opened button
  var $prevButton = $();

  /**
   * Show/Hide the kanban board when pressing the kanban board button
   *
   * @param  {object} e  $.Event
   */
  $boardButton.on('click', function openBoard(e) {
    e.preventDefault();
    e.stopPropagation();

    var $container = $('.repo-container').closest('.container');

    // Close the container....
    if( $container.hasClass('show_gitban') ) {
      $prevButton.find('a').addClass('selected');
      closeGitban();
      return;
    }

    $container.addClass('show_gitban');
    $prevButton = $('.repository-sidebar li a.selected').parent();

    $prevButton.find('a').removeClass('selected');
    $(this).find('a').addClass('selected');

    loadGitHubIssues();

    $container.addClass('show_gitban');
    $('.repo-container').removeClass('with-full-navigation');
    $('.repository-content').hide();

    $board.show();
  });

}
