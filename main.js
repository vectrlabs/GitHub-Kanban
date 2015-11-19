chrome.storage.local.get('options', function(items) {
  var config = items.options;

  // Only run if we are in the right :username:/:repo:
  if ((config.username && config.repo) && window.location.pathname.indexOf( config.username + '/' + config.repo ) !== -1 ) {

    var $firstButton = $('.reponav a:first');
    var $openIssues  = $();
    var $inProgressIssues = $();
    var $closedIssues     = $();
    var $board = $('<div class="gitban_board gitban_board_loading" />');
    var $boardButton = $();

    var $milestone = $([
      '<div class="gitban_milestone">',
        '<h4 class="gitban_milestone_name"><a href="https://github.com/' + config.username + '/' + config.repo + '/milestones" target="_blank">Milestone</a></h4>',
        '<h5 class="milestone-meta">',
          '<span class="milestone-meta-item"></span>',
        '</h5>',
        '<span class="milestone-meta-release"></span>',
      '</div>'
    ].join(''));

    var $progress = $([
      '<div class="gitban_progress">',
        '<div class="gitban_milestone">',
          '<h4 class="gitban_milestone_name">Team Progress</h4>',
        '</div>',
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

    // Remove the first class
    $firstButton.removeClass('js-selected-navigation-item selected');

    // Insert empty kanban board
    $board.append( $loader, $progress )
      .appendTo('.container.repo-container');

    // GitHub removes the nav elements on every load, so we
    // have to check in a stupid way whether the button is still
    // there and reload it if it's not
    $(document.body).on('click', '.reponav a', function() {
      var i = 0;
      var addButtonInterval = setInterval(function() {

        // Load button and stop checking
        if( $('.gitban_button').length <= 0 ) {
          window.clearInterval(addButtonInterval);
          loadButton();

        // Give up
        } else if( i > 100 ) {
          window.clearInterval(addButtonInterval);
        }

        i++;

      }, 500);
    });

    // Insert Kanban Button
    function loadButton() {
      $boardButton = $firstButton.clone();

      $boardButton.prependTo( $('.reponav') )
        $boardButton.addClass('gitban_button')
        .attr('aria-label', 'Kanban')
        .html('<span class="octicon octicon-three-bars"></span> Kanban');
    }

    loadButton();

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

        var today = new Date();
        while(true) {
          milestone = milestones.pop();
          previousMilestone = milestones[milestones.length-1];

          if (!milestone || new Date(previousMilestone.due_on) < today) {
            break;
          }
        }

        // Set the title
        $milestone.find('.gitban_milestone_name a')
          .text( 'Working On: ' + milestone.title );

        // Get time left
        // var dayDiff   = Math.floor( (new Date( milestone.due_on ) - new Date()) / 86400000 );
        // var timeLeft  = ( dayDiff <= 7 ) ? dayDiff + ' days' : Math.floor(dayDiff / 7) + ' weeks';

        function toHumanReadable( date ) {
          var dayDiff   = Math.floor( (new Date( date ) - new Date()) / 86400000 );
          var timeLeft  = ( dayDiff <= 7 ) ? dayDiff + ' days' : Math.floor(dayDiff / 7) + ' weeks';

          return timeLeft;
        }

        var now = moment();
        var dateFormat = 'YYYY-MM-DD';

        var desktopReleaseTimeBase = moment('2015-12-01');
        var websiteReleaseTimeBase = moment('2015-11-10');

        var desktopRecurr = desktopReleaseTimeBase.recur().every(4).weeks();
        desktopRecurr.fromDate(now);
        var nextDesktopReleaseDate = desktopRecurr.next(1, dateFormat);

        var websiteRecurr = websiteReleaseTimeBase.recur().every(2).weeks();
        websiteRecurr.fromDate(now);
        var nextWebsiteReleaseDate = websiteRecurr.next(1, dateFormat);

        var dueHTML =
          '<span class="octicon octicon-calendar"></span>' +
          ' Due in ' + toHumanReadable( milestone.due_on );

        $milestone.find('.milestone-meta-item').html( dueHTML );

        // Set the open / closed
        $('.milestone-meta-release')
          // .html(desktopReleaseHTML + ' - ' + websiteReleaseHTML);
          .html('Next Desktop: <strong>' + toHumanReadable( nextDesktopReleaseDate ) + '</strong> - Next Web Release: <strong>' + toHumanReadable( nextWebsiteReleaseDate ) + '</strong>');

        // Set open/closed issues
        $milestone.find('.gitban_milestone_description p')
          .html( milestone.description );

        getIssues();
      });

      function getStoryPoints(issue) {
        var points = 0;
        var pointsPattern = /(\d{1,2})pts?/;
        issue.labels.forEach(function(label) {
          var matched = pointsPattern.exec(label.name);
          if (matched) {
            points = Number.parseInt(matched[1]);
          }
        });
        return points;
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
            return getStoryPoints(b) - getStoryPoints(a);
          });

          issues.forEach(function(issue) {
            var $i = $issueMarkup( issue );
            var $userProgress = $();
            issue.points = getStoryPoints(issue);

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
        var points = new Array(days.length);
        var untilNow = new Array(diffDaysUntilNow);
        var cursor = startDate;

        days.fill('day ');
        days = days.map(function(d, i) {
          return d + (i+1);
        });

        var allPoints = 0;

        issues.forEach(function(issue) {
          allPoints += issue.points;
        });
        untilNow.fill(allPoints);

        issues.forEach(function(issue) {
          if (issue.state === 'closed') {
            var closedDate = new Date(issue.closed_at);
            var offset = Math.ceil(Math.abs(startDate.getTime() - closedDate.getTime()) / (1000 * 3600 * 24));
            untilNow.forEach(function(points, i) {
              if (i >= offset) {
                untilNow[i] -= issue.points;
              }
            })
          }
        })

        points.fill(0);
        points = points.map(function(d, i) {
          return allPoints / days.length * (days.length - i);
        });


        var data = {
          // A labels array that can contain any sort of values
          labels: days,
          // Our series array that contains series objects or in this case series data arrays
          series: [
            points, untilNow
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
    function openBoard(e) {
      var $container = $('.repo-container').closest('.container');

      $boardButton.addClass('selected');
      $container.addClass('show_gitban');

      loadGitHubIssues();

      $container.addClass('show_gitban');
      $('.repo-container').removeClass('with-full-navigation');
      $('.repository-content').hide();

      $board.show();
    }

    $('body').on('click', '.gitban_button', function(e) {
      e.preventDefault();
      e.stopPropagation();

      // Redirecting (rather than reloading) helps avoid annoying GitHub behaviour which can
      // break kanban anytime github makes a minor change to their markup.
      window.location.href = 'https://github.com/' + config.username + '/' + config.repo;
    });

    // Open the board if we're at the right url
    if( window.location.pathname === '/' + config.username + '/' + config.repo ) {
      openBoard();
    }

  }
});
