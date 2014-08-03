/*
 * Init procedure
 * - all the ui-callbacks are created here
 * - below all 
 *
*/
// tiny hack, because we have no concrete id for our edited answers
var lastChangedAnswer;
$(document).ready(function() {
  
  // we need to activate the tooltips
  $('[title]').tipTip(tooltipSettings);

  // enable hover-effects for ab-c-d choice-fields
	$(document).on('mouseenter', '.create_choice:not(.read_only) > span > span[data-type]', function() {
    var parent = $(this).parent();
    var type = $(this).attr('data-type');
    if(type.substr(0,2)=="ab") $(parent).children('[data-type="a"]').addClass('hovered');
    if(type.substr(0,2)=="ab") $(parent).children('[data-type="ab"]').addClass('hovered');
    if(type.substr(0,3)=="abc") $(parent).children('[data-type="abc"]').addClass('hovered');
    if(type.substr(0,4)=="abcd") $(parent).children('[data-type="abcd"]').addClass('hovered');
  });
	$(document).on('mouseleave', '.create_choice:not(.read_only) > span > span[data-type]', function() {
    $(this).parent().children().removeClass('hovered');
  }); 
    
  // the user clicked on a poll-creation-button -> create a new course and a poll within that course
  $(document).on('click', '.create_choice:not(.add_only, .edit_only, .read_only) > span[data-type], .create_choice:not(.add_only, .edit_only, .read_only) > span > span[data-type]', function() {
  
    // get type and courseId
    var type = $(this).attr('data-type');
    var courseId = $('#vote').attr('data-course');
    
    // do we really have a courseId?
	  if(courseId){
	    l('emitting nextPoll',{'courseId':courseId,'pollType':type});
	    // we add a poll to this course
      socket.emit('nextPoll',{'courseId':courseId,'pollType':type});		  
    } else if(courseId == null) {
	    l('emitting createNewCourse',{'pollType':type});
      // we have to create the course first
		  socket.emit('createNewCourse',{'pollType':type});
		}
	});
  
  // go to next poll of this course
	$(document).on('click', '#question_next:not(.lowlight), #question_next_stats:not(.lowlight)', function() {
	  var courseId = $('#vote').attr('data-course');
	  l('emitting nextPollByCourse', {courseId: courseId});
	  socket.emit('nextPollByCourse', {courseId: courseId});
	});
	// go to previous poll of this course
	$(document).on('click', '#question_prev:not(.lowlight), #question_prev_stats:not(.lowlight)', function() {
	  var courseId = $('#vote').attr('data-course');
	  l('emitting prevPollByCourse', {courseId: courseId});
	  socket.emit('prevPollByCourse', {courseId: courseId});
	});
  
  // statistic-icon was clicked
	$(document).on('click', '#nav_stats', function() {
    var cid = $('#vote').attr('data-course');
    
    pageTransition('#stats');
    // close Poll
    l('closePollByOwner',{'courseId':cid});
    socket.emit('closePollByOwner',{'courseId':cid});
  });
  
	// jump to a certain course
	$(document).on('blur enter', '#jump_to_course', function() {
    window.location = document.location.href + $(this).val();
  });
	$(document).on('keyup', '#jump_to_course', function(e) {
    if(e.keyCode == 13) {
      $(this).trigger('enter');
    } 
  });
  
  $('#question_edit_btn').on('click', function() {
    var pollId = $('#vote').attr('data-poll');
    var courseId = $('#vote').attr('data-course');
    
    socket.emit('getCompleteCourse',{'courseId':courseId});
    setTimeout(function() {
      loadQuestionSettings(pollId);
    }, 500);
  });  
  // automatic login, when cookie is set
  if($.cookie('userid')) {
    l('emitting isSessionValid', {'userId': $.cookie('userid')});
    socket.emit('isSessionValid', {'userId': $.cookie('userid')});
  }
  
  // disable js for mobile
  adjustForWidth($(this).width());
  $(window).on('resize', function() {
    adjustForWidth($(this).width());
  });
      
  // placeholder for ALL browsers
  $('[placeholder]').focus(function() {
    var input = $(this);
    if (input.val() == input.attr('placeholder')) {
      input.val('');
      input.removeClass('placeholder');
    }
  }).blur(function() {
    var input = $(this);
    if (input.val() == '' || input.val() == input.attr('placeholder')) {
      input.addClass('placeholder');
      setTimeout(function() {
        input.val(input.attr('placeholder'));
      }, 500);
    }
  }).blur();

  // hide ALL the navigation-icons
  $('.fixed:not(.home)').hide();
  
  // show hide navigation
  $('.nav').on('mouseenter', function() {
    $(this).off('mouseleave');
    $(this).children('.fixed:not(.home)').fadeIn('fast', function() {
      //$('.nav').on('mouseleave', deactivate_nav);  
      $('.nav').on('mouseleave', function() {
        $(this).children('.fixed:not(.home)').fadeOut('fast');
      });
    });
  });

	// navigate to home/express
	$(document).on('click', '.home, #simple_home', function() {
    // clear course for express
    $('#vote').removeAttr('data-course');
    pageTransition('#create');
  });
        
  // navigate to login
  $(document).on('click','.on.fixed, #simple_login_on', function() {
    pageTransition('#advanced_login');
  });
  // navigate to logout
  $(document).on('click','.off.fixed, #simple_login_off', function() {
    l('emitting logoutUser', {username: $('body').attr('data-userid')});
    socket.emit('logoutUser', {username: $('body').attr('data-userid')});  
  });
  
  // navigate to registerpage
  $('#to_register').on('click', function(e) {
    e.preventDefault();
    pageTransition('#advanced_register');
  });

  // navigate to infopage
  $(document).on('click', '.info.fixed, #simple_info', function() {
    pageTransition('#information'); 
  });
  
  // go to advanced page
	$(document).on('click', '.nav_settings, #simple_advanced', function() {
    pageTransition('#advanced_overview');
	});
  
  // attach enter-event to given dom-elements (not given by )
  $('#login_username, #login_password, #register_username, #register_password, #register_password_repeat, #course_name, #question_name, #question_answers_abcd > div > input').on('keyup', function(e) {
    if(e.keyCode == 13) {
      $(this).trigger('enter');
    } 
  });

  // edit event
  $(document).on('click', '.course_edit', function() {
	  var courseId = $(this).attr('data-id');
   	l('emitting getCompleteCourse',{'courseId':courseId});	  
   	socket.emit('getCompleteCourse',{'courseId':courseId});	  
	});
  
  // when we edit the a question (name), we want to simultaniously change it in our questionlist
  $('#question_name').live('keyup', function() {
		var qid = $('#question_settings').attr('data-id');
		if(qid) {
			// look the qid up in poll list
			$('#course_question_sort > li[data-id="'+qid+'"]').each(function(index, item) {
				$(this).children('.question_item').html($('#question_name').val());
			});						
		}  
  });
  
  // the user wants to log in
  $('#login_username, #login_password').on('enter', function() {
    $('#login_submit').trigger('click');
  });
  $('#login_submit').on('click', function() {
    var user = $('#login_username').val();
    var pass = $('#login_password').val();
    l('emitting loginUser',{'username':user,'password':pass})
    socket.emit('loginUser',{'username':user,'password':pass}); 
  });
  
  // user wants to register
  $('#register_username, #register_password, #register_password_repeat').on('enter', function() {
    $('#register_submit').trigger('click');
  });
  $('#register_submit').on('click', function() {
    var username = $('#register_username').val();
    var password1 = $('#register_password').val();
    var password2 = $('#register_password_repeat').val();
    var name = '';

    // there are some errors ...
    if(username.length < 3) {
      // alert('username not long enough');
       $('#register_container').effect("shake", { times:3, distance: 5 }, 70);
    	return false;
    }
    if(password1.length < 3) {
      // alert('password is not long enough');
      $('#register_container').effect("shake", { times:3, distance: 5 }, 70);
      return false;
    }

    if(password1!=password2) {
      // alert('passwords are not equal');
      $('#register_container').effect("shake", { times:3, distance: 5 }, 70);
      return false;
    }
    l('emitting createUser',{'username':username,'password':password1,'name':name}); 
    socket.emit('createUser',{'username':username,'password':password1,'name':name}); 
  });
  
  // the coursename was changed
  $('#course_name').live('blur enter', function() {
    var courseId = $('#advanced_course').attr('data-course');
    var name = ($(this).val().length > 0)?$(this).val():'Veranstaltung '+courseId;
	  l('emitting setCourseName',{'courseId':courseId,'name':name});
	  socket.emit('setCourseName',{'courseId':courseId,'name':name});
  })
  
  // jump to question
  $('.start_question').live('click', function() {
    l('going to question');
    var courseId = $('#advanced_course').attr('data-course');
    var pollId = $(this).parent().attr('data-id');
    l('emitting goToPollByCourse', {courseId: courseId, pollId: pollId}); 
    socket.emit('goToPollByCourse', {courseId: courseId, pollId: pollId}); 
  });
  
  // set question name
  $('#question_name').on('blur enter', function() {
    var pollId = $('#question_settings').attr('data-id');
	  var name = $(this).val();
    l('emitting setQuestion',{'pollId':pollId,'question':name});
    socket.emit('setQuestion',{'pollId':pollId,'question':name});
  });
  
  // set answers
  $('#question_answers_abcd > div > input').live('blur enter', function() {
    l('setting answer');
	  var pollId = $('#question_settings').attr('data-id');
	  var key = $(this).attr('data-key');
	  var value = $(this).val();
	  l({'pollId':pollId,'key':key,'value':value});
	  lastChangedAnswer = key;
	  l('emitting setAnswer',{'pollId':pollId,'key':key,'value':value});
	  socket.emit('setAnswer',{'pollId':pollId,'key':key,'value':value});
	});
  
  // create a new course
  $(document).on('click', '#create_new_course', function() {
    l('emitting createStoredCourse');
    socket.emit('createStoredCourse');
  });
  
  // user wants to remove the course - but we will ask him first, if he is sure via modal
  $(document).on('click', '.course_remove', function() {
    var qid = $(this).attr('data-id');
    $('#course_delete_prompt').attr('data-course', qid).modal();
  });
  
  // user is sure to remove the course
  $(document).on('click', '#remove_course_button', function() {
    var cid = $('#course_delete_prompt').attr('data-course');
    l('emitting deleteCourse', {'courseId': cid});
    socket.emit('deleteCourse', {'courseId': cid});
  });
  
  // user wants to reset the coursestats - but we will ask him first, if he is sure via modal
  $(document).on('click', '#course_reset_stats', function() {
    var cid = $('#advanced_course').attr('data-course');
    $('#course_reset_prompt').attr('data-course', cid).modal();
  });

  // user is sure to reset the coursestats
  $(document).on('click', '#course_reset_prompt_btn', function() {
    var cid = $('#course_reset_prompt').attr('data-course');
    l('emitting resetPollsOfCourse', {'courseId': cid});
    socket.emit('resetPollsOfCourse', {'courseId': cid});
  });
  
	// add a new poll with a certain type to course
	$(document).on('click', '.create_choice.add_only > span[data-type], .create_choice.add_only > span > span[data-type]', function() {
    var type = $(this).attr('data-type');
    var courseId = $('#advanced_course').attr('data-course');
    l('emitting createStoredPoll',{'courseId':courseId,'pollType':type});
    socket.emit('createStoredPoll',{'courseId':courseId,'pollType':type});
  });
  
  // change pollType
  $(document).on(' click', '.create_choice.edit_only > span[data-type], .create_choice.edit_only > span > span[data-type]', function() {
    var type = $(this).attr('data-type');
    var pollId = $('#question_settings').attr('data-id');
    l('emitting setPollType',{'pollId': pollId, 'pollType': type});  
    socket.emit('setPollType',{'pollId': pollId, 'pollType': type});  
  });
  
  // make poll-list sortable
  $('#course_question_sort').sortable({
   items: 'li',
   //grid: [2000, 1],
   handle: '.sort_question',
   update: function(event, ui) {
     updateQuestionSortable($(ui.item).attr('data-id'));
   }
  });
  
	// edit question
	$('#course_question_sort > li > .edit_question').live('click', function() {
		loadQuestionSettings($(this).parent().attr('data-id'));
	});
	
	// remove question 
	$('.remove_question').live('click', function() {
    l('removequestion');

    var pollId = $(this).parent().attr('data-id', pollId);    
    $('#poll_delete_prompt').attr('data-poll', pollId).modal('show');
  });
  
  // the poll is going to be removed
  $('#remove_poll_button').on('click', function(e) {
    e.preventDefault();
    removePoll();
  });
});

/*
 * join a course as creator
 * data:
 *  @course - Course-object
 *  @poll - poll-object
*/
function joinCourse(data) {
  l('joinCourse', data);
  
  var course = data.course;
  var poll = data.poll;
  
  // reset old settings
  $('.create_choice').removeClass('nomargin');
  $('#show_choices').html('');
  
  pageTransition('#vote');

  // if a question isn't set - simply don't show it
  if(poll.Question && poll.Question.length > 0) {
    $('#question_container').text(poll.Question).slideDown('slow'); 
  } else {
    $('#question_container').text('').hide();     
  }
  
  // remove previous choices
  $('#vote > .create_choice > span[data-type], #vote > .create_choice > span > span[data-type],').each(function() {
    $(this).removeClass('selected');
  });
  
  // activate ALL the icons
  $('#vote > .icon, #stats > .icon').each(function() {
    $(this).removeClass('lowlight').removeClass('nopointer');
  }); 
  
  // disable prev and next
  if(course.CurrentPoll < 1) {
    $('#question_prev, #question_prev_stats').addClass('lowlight').addClass('nopointer');
  }
  if(course.CurrentPoll >= course.Polls.length-1) {
   $('#question_next, #question_next_stats').addClass('lowlight').addClass('nopointer'); 
  }
  
  // set text to: "Frage x von y"
  $('.question_of_to > span.at').text(course.CurrentPoll+1);
  $('.question_of_to > span.of').text(course.Polls.length);
  
  // append course-id to dom for later use
  $('#vote').attr('data-course', course.ID).attr('data-type', poll.Type).attr('data-poll', course.Polls[course.CurrentPoll]);
  
  // set url
  $('#url').text(document.location.href + course.ID);
  
  // set statistics
  updateExpressStats({totalCount: poll.Stats.count});
    
  // highlight type
  $('#vote > .create_choice > span[data-type="'+poll.Type+'"], #vote > .create_choice > span > span[data-type="'+poll.Type+'"],').each(function() {
    var parent = $(this).parent();
    var type = $(this).attr('data-type');
    if(type.substr(0,2)=="ab") {
      $(parent).show();
      $('#vote > .create_choice > span[data-type]').hide();
      if(type.substr(0,2)=="ab") $(parent).children('[data-type="a"]').addClass('selected');
      if(type.substr(0,2)=="ab") $(parent).children('[data-type="ab"]').addClass('selected');
      if(type.substr(0,3)=="abc") $(parent).children('[data-type="abc"]').addClass('selected');
      if(type.substr(0,4)=="abcd") $(parent).children('[data-type="abcd"]').addClass('selected');
    } else if(type == 'yn') {
      // hide ABCD and 
      $('#vote > .create_choice > span > span[data-type]').parent().hide();
      $('#vote > .create_choice > span[data-type="guess"]').hide();
      $(this).show().addClass('selected');
    } else {
      // hide ABCD and 
      $('#vote > .create_choice > span > span[data-type]').parent().hide();
      $('#vote > .create_choice > span[data-type="yn"]').hide();
      $(this).show().addClass('selected');      
    }
  });

  // if abcd and there are answers given
  if(poll.Type.substr(0,2)=="ab" && poll.Answers) {
    $('.create_choice').addClass('nomargin');
    $.each(poll.Answers, function(index, item) {
      var div = '<div><span>'+index.toUpperCase()+'</span>'+item+'</div>'
      $(div).appendTo('#show_choices');
      
      // hide type-hint, because it's obvious now
      $('#vote > .create_choice > span > span[data-type]').parent().hide();
    });
  }
  
  // if user is logged in, show the edit-button (show and hide doesn't work correctly with inline-block)
  if($('body').attr('data-userid')) {
    $('#question_edit_btn').css({width: '30px'})
  } else {
    $('#question_edit_btn').css({width: '0'});
  }

}

/*
 * callback
 * - we left the course
*/
function exitCourse(data) {
  l('exitCourse', data);
}

/*
 * callback
 * - we created a course via express-interface
*/
function createExpressCourse(data) {
	l('createExpressCourse', data);
  joinCourse(data);
};

/*
 * callback
 * - we joined an active course as creator
*/
function joinActivExpressCourse(data) {
  l('joinActivExpressCourse', data)
	joinCourse(data);
}

/*
 * callback
 * - we joined an inactive course as creator
*/
function joinInactivExpressCourse(data){
  l('joinInactivExpressCourse', data);
	show_stats(data);
}

/*
 * callback
 * - we requested our next poll (as creator)
*/
function nextPollOwner(data){
  l('nextPollOwner', data);
  joinCourse(data);
}

/*
 * callback
 * - we requested the next poll for a given course
*/
function nextPollByCourse_response(data) {
  l('nextPollByCourse_response', data);
  if(data) {
    joinCourse(data);
  }
}

/*
 * callback
 * - we requested the previous poll for a given course
*/
function prevPollByCourse_response(data) {
  l('prevPollByCourse_response', data);
  if(data) {
    joinCourse(data);
  }
}
/*
 * callback
 * - server says, we should update our vote-count for the given poll
*/
function updateExpressStats( data ) {
  l('updateExpressStats', data);
  $('.question_votes > span').fadeOut('slow', function() {
    $(this).text(data.totalCount);
    $(this).fadeIn('slow');
  });
}
/*
 * - show statistics of a poll (poll should be inactive)
*/
function show_stats(data){
  
	l('show_stats', data);
  
	pageTransition('#stats');
	
	// Get poll type.
	var pollType = $('#vote').attr('data-type');

	// Get stats and initialize variables.
	var stats = data.pollStats;
	var values = new Array();
	var n = 0;
	
	// Iterate over poll results.
	for( var option in stats ) {
		if( stats[option] > 0 ) {
			// Get option name as upper case.
			var name = new String( option );
			name = name.toUpperCase();
			
			// In case of a Y/N poll, replace the name.
			if( pollType == "yn" ) {
				if( option == "y" )
					name = "JA";
				else if( option == "n" )
					name = "NEIN";
			}
			
			// Create the value object for this result.
			var value = {
				'label': name,
				'values': [stats[option]]
			};
			values[n] = value;
			n++;
		}
	}
	
	// Sort the values array nummerically in case of a guess poll.
	if( pollType == "guess" ) {
		values.sort( function( a, b ) {
			var n1, n2;
			n1 = parseFloat( a['label'] );
			n2 = parseFloat( b['label'] );
			return n1 - n2;
		} );
	}

	if(values.length == 0) {
    $('#stat > span').show();
    $('#express_pie').hide();
    return;
	} else {
	  $('#express_pie').show();
    $('#stat > span').hide();	  
	}
	
	// Create full data object for chart.
	var upd = {
		'label': ['Stimmen'],
		'values': values
	};
	
	// Adjust colors for Y/N poll.
	if( pollType == "yn" ) {
		var colred = "#B53E3E";
		var colblue = "#435FB5";
		upd['color'] = [ colblue, colred ];
	}
		
	// Clear chart element.
	$('#express_pie').empty();
	
	// Set size prior to chart initialization.
	var height = 550; // Normal desktop height for pie charts.
	if( pollType == "guess" )
		height = 70 * n; // Guess poll needs a scaling bar chart.
	else if( viewportwidth <= 640 ) // viewportwidth defined in charts.js.
		height = 320; // Pie chart for smaller screen real estate.
	$('#express_pie').css( "height", height + "px");
	
	// Create chart.
	var chart;
	if( pollType != "guess" )
		chart = initPieChart( 'express_pie', (n == 1) );
	else
		chart = initBarChart( 'express_pie' );
	
	// Feed data into chart.
	updateChart( chart, upd );  
}

/*
 * - send a remove-request for a poll
*/
function removePoll() {
  // get pollId from our prompt
  var pollId = $('#poll_delete_prompt').attr('data-poll');
  if(pollId) {
    l('emitting deletePoll',{'pollId':pollId});
    socket.emit('deletePoll',{'pollId':pollId});    
  }
}

/*
 * - load question-settings for a given qid to ui
*/
function loadQuestionSettings(qid) {
  l('loadQuestionSettings', qid);
  
  // get the list-item with the id == qid
	$('#course_question_sort > li[data-id='+qid+']').each(function() {
	  
	  // get some attributes from dom
		var qid = $(this).attr('data-id');
		var question =  $(this).attr('data-question');
		var type = $(this).attr('data-type');
		var courseId = $(this).attr('data-course');
    
    // change dom-attributes and show it
		$('#question_settings').attr('data-id', qid);
		$('#question_settings').fadeIn(1500);
		$('#question_name').attr('placeholder', 'Frage '+qid);
		$('#question_name').val(question);

    // reset selected question type
    $('.create_choice.edit_only > span[data-type], .create_choice.edit_only > span > span[data-type],').each(function() {
      $(this).removeClass('selected');
    })
    
    // set question type to ui
    $('.create_choice.edit_only > span[data-type="'+type+'"], .create_choice.edit_only > span > span[data-type="'+type+'"],').each(function() {
      var parent = $(this).parent();
      var type = $(this).attr('data-type');
      
      // first we select the correct type
      if(type.substr(0,2)=="ab") {
        if(type.substr(0,2)=="ab") $(parent).children('[data-type="a"]').addClass('selected');
        if(type.substr(0,2)=="ab") $(parent).children('[data-type="ab"]').addClass('selected');
        if(type.substr(0,3)=="abc") $(parent).children('[data-type="abc"]').addClass('selected');
        if(type.substr(0,4)=="abcd") $(parent).children('[data-type="abcd"]').addClass('selected');
      } else {
        $(this).addClass('selected');
      }
      
      // then we show the answer-fields in the question-details
      if(type.substr(0,2)=="ab") {
        $('#question_answers_abcd').show();
        if(type=="ab") {
          $('#question_answers_abcd > div').children('[data-key="a"],[data-key="b"]').parent().slideDown(); 
          $('#question_answers_abcd > div').children('[data-key="c"],[data-key="d"]').parent().slideUp(); 
        }
        if(type=="abc") {
          $('#question_answers_abcd > div').children('[data-key="a"],[data-key="b"],[data-key="c"]').parent().slideDown(); 
          $('#question_answers_abcd > div').children('[data-key="d"]').parent().slideUp(); 
        }
        if(type=="abcd") {
          $('#question_answers_abcd > div').children('[data-key]').parent().slideDown(); 
        }    
        $('html,body').animate({scrollTop: $('#question_settings').offset().top},'slow')          
      } else {
        $('#question_answers_abcd').slideUp();
        $('#question_answers_abcd > div').children('[data-key]').parent().slideUp(); 
      }
      
    });
    
    // we send a server-request for detailed infos 
    l('emitting getPoll',{'pollId':qid});    		
    socket.emit('getPoll',{'pollId':qid});    		
	})
}

/*
 * set the answers in ui due to our poll-details
*/
function setAnswers(data) {
  l('setAnswers', data);
  if(!data) return;
  var answers = data.Answers;

  $('#question_answers_abcd > div > input').each(function() {
    
    $(this).val('');
    
    if(!answers) return;
    
    var key = $(this).attr('data-key');
    if(answers.a && key == 'a') {
      $(this).val(answers.a);
    } 
    if(answers.b && key == 'b') {
      $(this).val(answers.b);
    }
    if(answers.c && key == 'c') {
      $(this).val(answers.c);
    }
    if(answers.d && key == 'd') {
      $(this).val(answers.d);
    }
  });
}

/*
 * - this function adds an question to our question-list, if it isn't containing it already or
 * updates it
*/
function addOrUpdateQuestion(data) {
  
  // get some information and process it
	var id = data.ID;
	var question = (!data.Question)?'Frage '+id:data.Question;
	var type = data.Type;
	var courseId = data.CourseID;
	var listcount = $('#course_question_sort').children('li').length+1;
	var item = '<li data-id="'+id+'" data-question="'+question+'" data-type="'+type+'" data-course="'+courseId+'">';
	var questionType = 'JA/NEIN';
	if(type.substr(0,2)=="ab") questionType = type.toUpperCase();
	if(type=="guess") questionType = "SCHÄTZEN";
	
	// build the dom
	item+='<span class="question_number">'+listcount+'.</span> ';
	item+='<span class="question_item">'+question+'</span> ';
	item+='<span class="start_question" title="Frage jetzt stellen"><img src="/images/play.png" /></span> ';
	item+='<span class="remove_question" title="Frage löschen"><img src="/images/noun_project_304.png" /></span> ';
	item+='<span class="edit_question" title="Frage bearbeiten"><img src="/images/noun_project_347.png" /></span>';
	item+='<span class="sort_question" title="Reihenfolge ändern"><img src="/images/noun_project_275.png" /></span>';
	item+='<span class="question_type" title="Typ der Frage">'+questionType+'</span>';
	item+='<div class="clear"></div>'
	item+='</li>';
	
	// look for an already existing question
	var existingItem = $('#course_question_sort').children('li[data-id='+id+']');

  // the question is already in the list
	if(existingItem.length > 0) {
	  
	  // replace it with updated information
		existingItem.each(function() {
			item = $(item).removeClass('hidden');
			$(this).replaceWith(item);
			loadQuestionSettings(id);
			updateQuestionSortable($(item).attr('data-id'));
		});
	} else {
	  // append the new item
		$(item).appendTo('#course_question_sort').slideDown('fast');
  }
  // make tooltips working with this list-element
	$('[title]').tipTip(tooltipSettings);
}

/*
 * - after the position of a question-item was changed, we need to update the
 * position-number in the ui and in our backend
*/
function updateQuestionSortable(pollId) {

	// update ALL the indices !!!
	$('#course_question_sort').children('li').children('span.question_number').each(function(index, item) {
		$(this).html((index+1)+'.');
		if($(this).parent().attr('data-id')==pollId) {
			var courseId = $('#advanced_course').attr('data-course');
			var newPos = index;
      l('emitting setPollOrder',{'courseId':courseId,'pollId':pollId,'position':newPos});  
      socket.emit('setPollOrder',{'courseId':courseId,'pollId':pollId,'position':newPos});  
		}
	});

}
/*
 * callback
 * - we receive a complete list of courses that belong to the creator
*/
function getAllCoursesByUser_response(data){
  l('getAllCoursesByUser_response', data);
  if(data) {
    
    // clear the course-list
    $('#course_list').html('');
    
    // add every course-item to the ui
    for(var i=0;i<data.courses.length;i++) {
      
      // get and process the needed information about the poll
      var item = data.courses[i];
      var name = (item.Name.length == 0)?"Veranstaltung "+item.ID:item.Name;
      var date = new Date(item.Created);
      var dateString = date.getDate()+'.'+((date.getMonth()+1 < 10)?"0"+(date.getMonth()+1):(date.getMonth()+1))+'. '+(1900+date.getYear())+' um '+date.getHours()+':'+((date.getMinutes() < 10)?'0'+date.getMinutes():date.getMinutes())+' Uhr';
      var questionCount = (item.Polls.length == 0)?'keine':item.Polls.length;
    
      var span = "";
      // add some questions for this poll (standard = 3, can be set in settings.js)
      var count = (data.polls[i].length < course_question_max_count)?data.polls[i].length:course_question_max_count;
      for(var k=0;k<count;k++) {
        var poll = data.polls[i][k];
        if(poll!=null) {
          var pname = (poll.Question == null)?'Frage '+poll.ID:poll.Question;
          span+= '<span class="question fresh">'+pname+'</span>';
          
          if(k < (count - 1)) {
            span+= '<span class="seperator">-</span>';
          } else {
            span+= ' ...';
          }   
        }
      }
      
      // create the dom for this list-item and append it
      var div = '<li class="course_item" data-course="'+item.ID+'"> \
    					<div class="title"> \
    						<div class="course_info"><span class="course_name">'+name+'</span> <span class="course_add_info">vom '+dateString+' - '+questionCount+' Fragen</span></div> \
  						  <div class="course_edit fresh" data-id="'+item.ID+'"><img src="/images/noun_project_347_b.png" /></div> \
  						  <div class="course_remove fresh" data-id="'+item.ID+'"><img src="/images/noun_project_304_b.png" /></div> \
    					</div> \
    					<div class="questions">'+span+'</div> \
    				</li>';
      $('#course_list').append(div);
    }    	  
  }

  // go to the overview page to show the loaded  course list
  pageTransition('#advanced_overview',true);
}

/*
 * callback
 * - we received the full list of courses
*/
function getCompleteCourse_response(data) {
  l('getCompleteCourse_response',data);
  if(data) {
    
  	//clear course settings
  	$('#course_question_sort').html('');
  	$('#question_settings').hide();
  	
  	// get the needed course information
  	var course = data.course.ID;
  	var name = data.course.Name;
  	var polls = data.polls;
  	
  	// show the id of our course 
  	$('#course_number').html(course);
    
    // if the course has a name, show it.
  	$('#advanced_course').attr('data-course', course);
  	if(!name=="") {
  	  $('#course_name').val(name);
  	} else {
  	  $('#course_name').val('Veranstaltung '+course);
  	}
	  
	  // add ALL the questions to it's question-list
  	if(polls) {
  	  for(var i=0;i<polls.length;i++) {
  		  addOrUpdateQuestion(polls[i]);	
  	  }
	  }
    var course = data.course;
    
    // fill data
    pageTransition('#advanced_course');
  }
}

/*
 * callback
 * - we created a course via the advanced interface
*/
function createStoredCourse_response(data) {
  l('createStoredCourse_response', data);
  if(data) {
    //pageTransition('#advanced_overview');
 	  l('emitting getCompleteCourse',{'courseId':data.courseId});
   	socket.emit('getCompleteCourse',{'courseId':data.courseId});
  }
}

/*
 * callback
 * - we created a poll via the advanced interface 
*/
function createStoredPoll_response(data) {
  l('createStoredPoll_response', data);
  addOrUpdateQuestion(data);
  loadQuestionSettings(data.ID);
}

/*
 * callback
 * - we request detailed poll information
*/
function getPoll_response(data) {
  l('getPoll_response', data);
  setAnswers(data);
}

/*
 * callback
 * - we changed the order of our question-list
*/
function setPollOrder_response(data) {
  l('setPollOrder_response',data);
  // nothing to do here
}

/*
 * callback
 * - we changed the type of a question
*/
function setPollType_response(data) {
  l('setPollType_response',data);
  addOrUpdateQuestion(data);
}

/*
 * callback
 * - we set the course name
*/
function setCourseName_response(data) {
  l('setCourseName_response',data);
  all_ok('#course_name');
}

/*
 * callback
 * - we set the concrete question
*/
function setQuestion_response(data) {
  l('setQuestion_response',data);
  all_ok('#question_name');
}

/*
 * callback
 * - we added an answer to our a question with the type abcd
*/
function setAnswer_response(data) {
  l('setAnswer', data);
  if(lastChangedAnswer) {
    all_ok('#question_answers_abcd > div > input[data-key="'+lastChangedAnswer+'"]')    
  }
}

/*
 * callback
 * - we removed a poll from a certain course
*/
function deletePoll_response(data) {
  l('deletePoll_response',data);
  var qid = data.pollId;
	if(qid == $('#question_settings').attr('data-id')) {
		$('#question_settings').slideUp();
	}
	
	// remove from list and close modal
	$('#course_question_sort').children('li[data-id='+qid+']').slideUp(function() {
		$(this).remove();
		updateQuestionSortable(qid);
	});
	
	$('#poll_delete_prompt').removeAttr('data-poll').modal('hide');
}

/*
 * callback
 * - we deleted a course 
*/
function deleteCourse_response(data) {
  l('deleteCourse_response', data);
  var cid = data.courseId;
  if(data) {
    $('.course_item[data-course="'+cid+'"]').slideUp(function() {
      $(this).remove();
    });
  }
}

/*
 * callback
 * - we tried to log in
*/
function log_in_response(data) {
  l('log_in_response', data);
  
  // if our login-attempt was successfull
  if(data.status == true) {
    
    // change the login-icon
    $('.content:not(.nav)').hide();
    $('#simple_login_off').show();
    $('#simple_login_on').hide();
    
    // change the dom
    $('body').attr('data-userid', data.userId);
    $('.on.fixed').removeClass('on').addClass('off');
    
    // set cookie for logged in
    $.setCookie('userid',data.userId);  

    // load ALL the courses for this user
    l('getAllCoursesByUser',{'userId': data.userId});
 	  socket.emit('getAllCoursesByUser',{'userId': data.userId});
    
  } else {
    // visualize the fail
    $('#login_container').effect("shake", { times:3, distance: 5 }, 70);
    l('login was not successful')
  }
}

/*
 * callback
 * - we tried to log out
*/
function log_out_response(data) {
  l('log_out_response', data);
  
  // change the dom
  $('body').removeAttr('data-userid');
  $('.off.fixed').removeClass('off').addClass('on');
  
  // reset the cookie
  $.setCookie('userid',false);  

  // to prevent bugs, we could reload the page
  window.location = document.location.href;    
  //pageTransition('#advanced_login');
}

function isSessionValid_response(data) {
  l('isSessionValid_response', data);
  if(data.isLoggedIn) {
    log_in_response({'status': true, 'userId': $.cookie('userid')});
  }
}

/*
 * callback
 * - we tried to register
*/
function register_response(data) {
  l('register_response', data);
  if(data) {
    pageTransition('#advanced_login');
  }
}

/*
 * callback
 * - we wanted to go to a certain poll in the role of the owner
*/
function goToPollByCourseForOwnerSuccessful_response(data) {
  l('goToPollByCourseForOwnerSuccessful_response', data);
  joinCourse(data);
}

/*
 * callback
 * - we have resetted the ALL stats of a course
*/
function resetPollsOfCourse_response(data) {
  l('resetPollsOfCourse_response', data);
  
}

function fristPollByCourse_response(data) {
  
}

/*
 * an utility-function to display a feedback, after we changed an input-field
*/
function all_ok(item) {
  var img = '<img src="/images/noun_project_835.svg" class="all_ok"/>';
  $(img).css('height', $(item).height()).css('height', $(item).height());
  $(img).insertAfter(item).hide().fadeIn(function() {
    $(this).fadeOut(function() {
      $(this).remove();
    });
  });
}

/*
 * switch between two .content-pages
*/
var fancy = false; // show a supernice transition
function pageTransition(to, force) {
  var userId = $('body').attr('data-userid');
  
  // if navigation is currently visible
  var showNav = ($('.content > .nav > .fixed:not(.home):visible').length > 0) && to != "#stats" && to != "#vote";
  
  // hide content and nav
  $('.content').hide();
  $('.fixed:not(.home)').hide();    
  
  // if user not logged in - > redirect to loginpage
  if(!userId && to == '#advanced_overview') {
    to = $('#advanced_login');	    
  }
  
  //
  if(to == '#advanced_overview' && !force) {
    socket.emit('getAllCoursesByUser',{'userId': userId});
  }
  
  // make our transition really fancy
  if(fancy) {
    // make it totally awesome
    $(to).children('.nav').hide();
    $(to).animate({
      marginLeft: $(window).width()
    }, 200, function() {
      $(this).css({'marginLeft': - $(this).width()});
      $(this).animate({
        marginLeft: ($(window).width() / 2) - $(this).width() / 2
      }, 200, function() {
        $(this).css({'marginLeft': 'auto'});
        $(this).children('.nav').fadeIn('slow');
      })
    })    
  }
  $(to).hide().show();  
  if(showNav) {
   $(to).children('.nav').children('.fixed:not(.home)').show(); 
  }
}

/*
 * this is a tweek for mobile devices (not all javascript is needed here i.e. tooltips)
*/
function adjustForWidth(width) {
  var width = parseInt(width);
  if(width <= 400) {
    // deactivate tipTip
    $('[title]').unbind('hover');
    $("div[id^=tiptip_]").remove();  
  } else {
    // doesn't work by now
    $('[title]').tipTip(tooltipSettings);
  }
}

