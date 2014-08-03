/* 
 * TODO:
 * - float as input with comma
*/

courseid = location.pathname.match(/\/([0-9]+)/);
_prev_random = 0;

var userid = 0;
var is_logged_in = false;
var pollType = null;
var fancy = false;

function pageTransition(to, force) {
  var userId = $('body').attr('data-userid');

  $('.content:not(.nav)').hide();
  
  // if user not logged in - > redirect to loginpage
  if(!userId && to == '#advanced_overview') {
    to = $('#advanced_login');	    
  }
  
  if(to == '#advanced_overview' && !force) {
    socket.emit('getAllCoursesByUser',{'userId': userId});
  }

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
}

$(document).ready(function() {
  
  // correct values in guess-field
  $('#guess_input').numeric();
  
  $(document).on('click', '.home.fixed', function() {
    window.location = 'http://'+document.location.host;
  });

  // 
  $(document).on('click', '#answer_again:not(.lowlight)', function(e) {
    $('#answer_again_prompt').modal();
  });
  
  // answer again button was confirmed
  $(document).on('click', '#answer_again_yes', function(e) {
    e.preventDefault();
    enable_inputs();
  });

});

function goToPollByCourse_response(data) {
  l('goToPollByCourse_response', data);
  activate_poll(data.poll);
}

function joinActivExpressCourse(data) {
  l('joinActivExpressCourse', data)
	activate_poll(data);
  
  $('#vote').attr('data-type', data.Type);

	$.setCookie('answer_submitted',false);  
}

function joinInactivExpressCourse(data){
  l('joinInactivExpressCourse', data);
    
	// reset voted-flag
	$.setCookie('answer_submitted',false);
  $('#vote').attr('data-type', data.poll.Type);

	show_stats({pollStats: data.pollStats.values});
}

function enable_inputs() {
  
  l('enable_inputs');
  
  // deactivate answer_again_button
  $('#answer_again').addClass('lowlight',500).off('click');

  // deactivate ALL the inputs
  $('.choice_container:hidden').children('.abcd_choice, .yn_choice, #guess_input').off('click blur enter');
  
  // remove chosen
  $('.chosen').removeClass('chosen');
  
  // activate ALL the right buttons (determined by polltype)
  $('.choice_container').children('.abcd_choice, .yn_choice, #guess_input').each(function() {
    
    $(this).removeClass('lowlight',500);
    
    $(this).not('input').on('click', function() {
      // highlight this answer
      $('.choice_container').children('.abcd_choice, .yn_choice, #guess_input').not(this).addClass('lowlight',500);
      $(this).addClass('chosen');
      
      // submit it
	    var courseId = $('#vote').attr('data-course');
	  	var answer = $(this).attr('data-type');
      socket.emit('submitAnswer',{courseId: courseId, answer: answer});
      $.setCookie('answer_submitted',true);
      
      // disable inputs
      disable_inputs();
    });
    
    // activate ALL the inputfields
    $(this).filter('input').each(function() {
            
      var submit_it = function() {
	  	  var courseId = $('#vote').attr('data-course');
	  	  var answer = $(this).val();
	  	  if(answer.length > 0) {
          socket.emit('submitAnswer',{courseId: courseId, answer: answer});
          $.setCookie('answer_submitted',true);
          disable_inputs();
	  	  }
      }
      
      // reset the field
      $(this).val('').removeAttr('disabled');

      // submit on blur and enter
      $(this).on('blur enter', submit_it);
      $(this).on('keyup', function(e) {
        if(e.keyCode == 13) {
          $(this).trigger('enter');
        } 
      });
    });
  });  
    
}

function disable_inputs() {
  l('disable_inputs');

  // enable answer_again button
  $('#answer_again').removeClass('lowlight',500);

  $('.choice_container').children('.abcd_choice, .yn_choice, #guess_input').each(function() {
    $(this).off('click blur enter');
    
    // disable inputfield
    $(this).filter('input').each(function() {
      $(this).attr('disabled', 'disabled').blur();
    });

  });
}

function activate_poll(data){
  l('activate_poll', data);
  
  // first disable inputs 
  disable_inputs();
  
  var qid = data.ID;
  var question = (data.Question)?data.Question:'Frage '+qid;
  var cid = data.CourseID;
  var type = data.Type;
  var count = data.Stats.count;
  var answers = (data.Answers)?data.Answers:{};
  
  pageTransition('#vote');
  
  // write course information to container
	$('#vote').attr('data-type', type).attr('data-course', cid);
  
  // hide other types than the current
  $('#vote').children(':not(#vote_count, #question_container, #stats, .nav)').each(function() {
    $(this).hide();
  });
  
  // clear ALL the answer-fields for abcd-types
  $('.choice_container').filter('[data-type="ab"], [data-type="abc"], [data-type="abcd"]').children().each(function(){
    $(this).text('');
  });
  
  // set background to center
  $(this).css({'backgroundPosition': 'center center'});
  
  // if type = ab, abc or abcd
  if(type.substr(0,2) == 'ab') {
    var items = $('.choice_container[data-type="'+type+'"]').children();
    
    // should ABCD be floated or not
    var floatAnswers = false;
    
    items.each(function(index, item) {

     var key = $(item).attr('data-type');     
     if(answers[key]) {
       $(item).text(answers[key]);
       // if a single answertext is given, enable floating
       floatAnswers = true;
     } 
    });
   
    // adapt design
    if(floatAnswers) {
      $(items).removeClass('centered');

    } else {
      $(items).addClass('centered');
    }
  }
  
  // show given polltype
  $('#vote').children('div[data-type="'+type+'"]').each(function() {
    $(this).show();
  });
  
  // write Question, if there is one#
  $('#question_container').text(question);
  
  // show count of answers
  updateExpressStats({totalCount: count});
  
  // enable the inputs  
  enable_inputs();
}

function nextPoll(data){
  l('nextPoll', data);
  // reset voted-flag
  $.setCookie('answer_submitted',false);
  activate_poll(data);
}



function updateExpressStats( data ) {
  l('updateExpressStats', data);
  $('#vote_count > span').first().fadeOut('slow', function() {
    $(this).text(data.totalCount);
    $(this).fadeIn('slow');
  });
}

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
		values = values.sort( function( a, b ) {
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
	else if( viewportwidth <= 640 )
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