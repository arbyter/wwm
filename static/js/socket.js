// find numeric ids that identifies a question set
REGEX_courseId = /^\/([0-9]+)/;

/**
 * Get a param via a regex from the url.
 * For example like getParam(REGEX_pollId)[1]
 * @param regex regular expression
 * @returns list of values
 * @author marcus
 */
function getParam(regex){
	return document.location.pathname.match(regex);
}

/**
 * Shortcut for the log-function
 * @author marcus
 */
function l(){
  if(window.location.hostname!='localhost') return true;
	console.info(arguments);
}

// connect to server
var socket = io.connect(); // no need to specify a server or port

curCourseId = 0;

socket.on('publishCourses',function(data){
  l('publishCourses',data);
	if(!courseid){
		$.each(data,function(i,e){
			$('#courses_overview').prepend($('<li><a href="/'+e.ID+'" title="Open course section">Course '+e.ID+' ('+e.Owner+')</a></li>'));			
		});
	}
  return true;
});

socket.on('publishCourse',function(data){
  l('publishCourse',data);
  if(!courseid){
    $('#courses_overview').prepend($('<li><a href="/'+data.ID+'" title="Open course section">Course '+data.ID+' ('+data.Owner+')</a></li>'));      
  }
  return true;
});

socket.on('createNewCourseSuccessful',function(data){
  // make current courseid globaly accessable 
  l('createNewCourseSuccessful',data);
  curCourseId = data.courseId;
  return createExpressCourse(data);
});

socket.on('joinActivCourseSuccessful',function(data){
  l('joinActivCourseSuccessful',data);
  return joinActivExpressCourse(data);
});

socket.on('joinInactivCourseSuccessful',function(data){
  l('joinInactivCourseSuccessful',data);
  return joinInactivExpressCourse(data);
});

socket.on('closePollSuccessful',function(data){
  l('closePollSuccessful',data);
  return show_stats(data);
});

socket.on('showStatsTotalCount',function(data){
	l('showStatsTotalCount');
	return updateExpressStats(data);
});

socket.on('publishNextPoll',function(data){
  l('publishNextPoll',data);
  return nextPoll(data);
});

socket.on('publishNextPollForOwner',function(data){
  l('publishNextPollForOwner',data);
  return nextPollOwner(data);
});

socket.on('putStatsByPoll',function(data){
  l('putStatsByPoll',data);
  return putStatsByPoll(data);
});

socket.on('loginUserSuccessful',function(data){
  l('loginUserSuccessful');
  return log_in_response(data);
});

socket.on('loginUserFailed',function(data){
  l('loginUserFailed');
  return log_in_response(data);
});

socket.on('logoutUserSuccessful',function(data){
  l('logoutUserSuccessful');
  return log_out_response(data);
});

socket.on('logoutUserFailed',function(data){
  l('logoutUserFailed');
  return log_out_response(data);
});

socket.on('createUserFailed',function(data){
  l('createUserFailed');
  return register_response(data);
});

socket.on('createUserSuccessful',function(data){
  l('createUserSuccessful');
  return register_response(data);
});

socket.on('createStoredCourseSuccessful',function(data){
  l('createStoredCourseSuccessful');
  return createStoredCourse_response(data);
});

socket.on('createStoredCourseFailed',function(data){
  l('createStoredCourseFailed');
  return createStoredCourse_response(data);
});

socket.on('createStoredPollSuccessful',function(data){
  l('createStoredPollSuccessful');  
  return createStoredPoll_response(data);
});

socket.on('setAnswerSuccessful',function(data){
  l('setAnswerSuccessful');  
  return setAnswer_response(data);
});

socket.on('setAnswerFailed',function(data){
  l('setAnswerFailed');  
  return setAnswer_response(data);
});

socket.on('setQuestionSuccessful',function(data){
  l('setQuestionSuccessful');  
  return setQuestion_response(data);
});

socket.on('setQuestionFailed',function(data){
  l('setQuestionFailed');  
  return setQuestion_response(data);
});


socket.on('getPollSuccessful',function(data){
  l('getPollSuccessful');  
  return getPoll_response(data);
});

socket.on('getPollFailed',function(data){
  l('getPollFailed');  
  return getPoll_response(data);
});

socket.on('getAllPollsByCourseSuccessful',function(data){
  l('getAllPollsByCourseSuccessful');  
  return getAllPollsByCourse_response(data);
});

socket.on('getAllPollsByCourseFailed',function(data){
  l('getAllPollsByCourseFailed');  
  return getAllPollsByCourse_response(data);
});

socket.on('setPollTypeSuccessful',function(data){
  l('setPollTypeSuccessful');  
  return setPollType_response(data);
});

socket.on('setPollTypeFailed',function(data){
  l('setPollTypeFailed');  
  return setPollType_response(data);
});

socket.on('setPollOrderSuccessful',function(data){
  l('setPollOrderSuccessful');  
  return setPollOrder_response(data);
});

socket.on('setPollOrderFailed',function(data){
  l('setPollOrderFailed');  
  return setPollOrder_response(data);
});

socket.on('deletePollSuccessful',function(data){
  l('deletePollSuccessful');  
  return deletePoll_response(data);
});

socket.on('deletePollFailed',function(data){
  l('deletePollFailed');  
  return deletePoll_response(data);
});

socket.on('getCompleteCourseSuccessful',function(data){
  l('getCompleteCourseSuccessful');  
  return getCompleteCourse_response(data);
});

socket.on('getCompleteCourseFailed',function(data){
  l('getCompleteCourseFailed');  
  return getCompleteCourse_response(data);
});

socket.on('nextPollByCourseSuccessful',function(data){
  l('nextPollByCourseSuccessful');  
  return nextPollByCourse_response(data);
});

socket.on('nextPollByCourseFailed',function(data){
  l('nextPollByCourseFailed');  
  return nextPollByCourse_response(data);
});


socket.on('prevPollByCourseSuccessful',function(data){
  l('prevPollByCourseSuccessful');  
  return prevPollByCourse_response(data);
});

socket.on('prevPollByCourseFailed',function(data){
  l('prevPollByCourseFailed');  
  return prevPollByCourse_response(data);
});

socket.on('getCompleteCourseSuccessful',function(data){
  l('fristPollByCourseSuccessful');  
  return fristPollByCourse_response(data);
});

socket.on('fristPollByCourseFailed',function(data){
  l('fristPollByCourseFailed');  
  return fristPollByCourse_response(data);
});

socket.on('lastPollByCourseSuccessful',function(data){
  l('lastPollByCourseSuccessful');  
  return lastPollByCourse_response(data);
});

socket.on('lastPollByCourseFailed',function(data){
  l('lastPollByCourseFailed');  
  return lastPollByCourse_response(data);
});

socket.on('goToPollByCourseSuccessful',function(data){
  l('goToPollByCourseSuccessful');  
  return goToPollByCourse_response(data);
});

socket.on('goToPollByCourseForOwnerSuccessful', function(data) {
  l('goToPollByCourseForOwnerSuccessful');
  return goToPollByCourseForOwnerSuccessful_response(data);
});

socket.on('goToPollByCourseFailed',function(data){
  l('goToPollByCourseFailed');  
  return goToPollByCourse_response(data);
});

socket.on('goToPollByCourseForOwnerFailed',function(data){
  l('goToPollByCourseForOwnerFailed');  
  return goToPollByCourseForOwner_response(data);
});

socket.on('setCourseNameSuccessful',function(data){
  l('setCourseNameSuccessful');  
  return setCourseName_response(data);
});

socket.on('getAllCoursesByUserSuccessful',function(data){
  l('getAllCoursesByUserSuccessful');  
  return getAllCoursesByUser_response(data);
});

socket.on('getAllCoursesByUserFailed',function(data){
  l('getAllCoursesByUserFailed');  
  return getAllCoursesByUser_response(data);
});

socket.on('cloneCourseSuccessful',function(data){
  l('cloneCourseSuccessful');  
  return cloneCourseSuccessful_response(data);
});

socket.on('cloneCourseFailed',function(data){
  l('cloneCourseFailed');  
  return cloneCourseSuccessful_response(data);
});

socket.on('deleteCourseSuccessful',function(data){
  l('deleteCourseSuccessful');  
  return deleteCourse_response(data);
});

socket.on('deleteCourseFailed',function(data){
  l('deleteCourseFailed');  
  return deleteCourse_response(data);
});

socket.on('resetPollsOfCourseSuccessful',function(data){
  l('resetPollsOfCourseSuccessful');  
  return resetPollsOfCourse_response(data);
});

socket.on('resetPollsOfCourseFailed',function(data){
  l('resetPollsOfCourseFailed');  
  return resetPollsOfCourse_response(data);
});

socket.on('isSessionValidSuccessful',function(data){
  l('isSessionValidSuccessful');  
  return isSessionValid_response(data);
});

socket.on('isSessionValidFailed',function(data){
  l('isSessionValidFailed');  
  return isSessionValid_response(data);
});

/**
 * Redirect to start portal
 */
socket.on('message',function(data){
  alert(data.msg_type+': '+data.msg_body);
  document.location.assign("http://"+document.location.host);
  return true;
});

$('document').ready(function(){
	courseid = getParam(REGEX_courseId);
	
	if(courseid!=undefined && courseid!=null){
		// we are in a course
		socket.emit('joinCourse', {'courseid' : courseid[1]});
		
	}else{
		// we are in the lobby
		socket.emit('showCourses');
	}
	
});

