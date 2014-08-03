// shurtcut for log functionality
var bc_and_me = require('./utils.js').broadcast_and_me;
var msg = require('./utils.js').msg;
var log = require('./logger.js').log;
var err = require('./utils.js').err;
var nfo = require('./utils.js').nfo;
var clone = require('./utils.js').clone;
var parseCookie = require('connect').utils.parseCookie;

// get the sessionID and make it available for all by cookie
var sid = { get: function(socket){ 
  if(socket.manager.handshaken[socket.id] &&
    socket.manager.handshaken[socket.id].cookie['wwm.sid']) {
      return socket.manager.handshaken[socket.id].cookie['wwm.sid'];  
    } else {
      return '-1';
    }
}};

/*
 * creating socket server
 */
exports.createServer = function(http_server) {
  //load socket.io server
  var socket_server = require('socket.io').listen(http_server);
  
  // to config socket-io 
  socket_server.configure(function(){
    //socket_server.set('transports', ['htmlfile','xhr-polling','jsonp-polling']);
    socket_server.set('log level', 2);
    return true;
  });


  // add the ability to handle sessionids
  socket_server.set('authorization', function (data, accept) {
      if (data.headers.cookie) {
        data.cookie = parseCookie(data.headers.cookie);
        data.sessionID = data.cookie['wwm.sid'];
        return accept(null, true);
      } else {
         return accept('No cookie transmitted.', false);
      }
  });
 
  // define socketserver events
  socket_server.sockets.on('connection', function(socket) {


    socket.on('joinCourse',function(data){
      joinCourse(data,socket);
      return true;
    });

    socket.on('createNewCourse',function(data){
      createNewCourse(data,socket);
      return true;
    });
    
    socket.on('submitAnswer',function(data){
      submitAnswer(data,socket);
      return true;
    });
    
    socket.on('closePollByOwner',function(data){
      closePollByOwner(data,socket);
      return true;
    });
    
    socket.on('getStatsByPoll',function(data){
      getStatsByPoll(data,socket);
      return true;
    });
    
    socket.on('nextPoll',function(data){
      nextPoll(data,socket);
      return true;
    });

    socket.on('createUser',function(data){
      createUser(data,socket);
      return true;
    });

    socket.on('loginUser',function(data){
      loginUser(data,socket);
      return true;
    });

    socket.on('isSessionValid',function(data){
      isSessionValid(data,socket);
      return true;
    });

    socket.on('logoutUser', function(data) {
      logoutUser(data, socket);
      return true;
    });

    socket.on('createStoredCourse',function(data){
      createStoredCourse(data,socket);
      return true;
    });

    socket.on('createStoredPoll',function(data){
      createStoredPoll(data,socket);
      return true;
    });

    socket.on('setAnswer',function(data){
      setAnswer(data,socket);
      return true;
    });

    socket.on('setQuestion',function(data){
      setQuestion(data,socket);
      return true;
    });
    
    socket.on('getPoll',function(data){
      getPoll(data,socket);
      return true;
    });
    
    socket.on('getAllPollsByCourse',function(data){
      getAllPollsByCourse(data,socket);
      return true;
    });
    
    socket.on('goToPollByCourse', function(data) {
      goToPollByCourse(data, socket);
      return true;
    });

    socket.on('setPollType',function(data){
      setPollType(data,socket);
      return true;
    });

    socket.on('setPollOrder',function(data){
      setPollOrder(data,socket);
      return true;
    });

    socket.on('deletePoll',function(data){
      deletePoll(data,socket);
      return true;
    });
    
    socket.on('getCompleteCourse',function(data){
      getCompleteCourse(data,socket);
      return true;
    });
    
    socket.on('nextPollByCourse',function(data){
      nextPollByCourse(data,socket);
      return true;
    });
    
    socket.on('prevPollByCourse',function(data){
      prevPollByCourse(data,socket);
      return true;
    });
    
    socket.on('fristPollByCourse',function(data){
      firstPollByCourse(data,socket);
      return true;
    });
    
    socket.on('lastPollByCourse',function(data){
      lastPollByCourse(data,socket);
      return true;
    });

    socket.on('setCourseName',function(data){
      setCourseName(data,socket);
      return true;
    });
    
    socket.on('getAllCoursesByUser',function(data){
      getAllCoursesByUser(data,socket);
      return true;
    });

    socket.on('cloneCourse',function(data){
      cloneCourse(data,socket);
      return true;
    });

    socket.on('deleteCourse',function(data){
      deleteCourse(data,socket);
      return true;
    });

    socket.on('resetPollsOfCourse',function(data){
      resetPollsOfCourse(data,socket);
      return true;
    });

    return true;
  });
}

function publishStats(s,cid,p,v){
  bc_and_me(s,cid,'showStats'+p,v);
}

/**
 * Creates an single course without a poll. sessionId have to be submited!
 * data = {sid}
 */
function createStoredCourse(data,socket){

  DATA.getUserBySID(sid.get(socket),function(userId){
    if(Boolean(userId)){
      DATA.createCourse(userId,sid.get(socket),function(course){
        socket.emit('createStoredCourseSuccessful',{'courseId':course.ID});
        return true;
      });
      return true;
    }else{
      socket.emit('createStoredCourseFailed');
      return false;
    }
  });
  return true;
}


/**
 * Creates a new poll and confirms this.
 * Should be used not in end user frontend.
 * data = {courseId,pollType}
 */
function createStoredPoll(data,socket){
  var c =  data.courseId;
  var pType = data.pollType;
  
  DATA.getUserBySID(sid.get(socket),function(userId){
    
    if(Boolean(userId)){

      DATA.isCourseOwner(c,userId,function(b){

        if(b){
          DATA.createPoll(c,pType,function(p){
            socket.emit('createStoredPollSuccessful',p);
            return true;
          });
          return true;
        }else if(!b){
          err(socket,'You are not the owner of this course!');
          return false;
        }else{
          err(socket,'User is not owner of selected course!');
          return false;
        }
      });
    }else{
      err(socket,'You are not a registered user!');
      return false;
    }
    return true;
  });
  
  return true;
}

/**
 * allows to set a description for an answering option
 * data = {pollId,key,value}
 */
function setAnswer(data,socket){

  var p = data.pollId;
  var key = data.key;
  var value = data.value;
  
  var oldAnswers = {};
  var newAnswers = {};

  //TODO: user have be checked!
  
  // if answers already set: go and get them
  DATA.getAnswers(p,function(answers){
    if(answers == null) return false;
    oldAnswers = clone(answers);
    return true;
  });

  newAnswers = clone(oldAnswers);
  newAnswers[key] = value;

  DATA.setAnswers(p,newAnswers,function(b){
    if(b){
      socket.emit('setAnswerSuccessful');
    }else{
      socket.emit('setAnswerFailed');
    }
  });

}

/**
 * allows to set a question for an poll
 * data = {pollId,question}
 */
function setQuestion(data,socket){

  var p = data.pollId;
  var question = data.question;

  //TODO: user have be checked!

  DATA.setQuestion(p,question,function(b){
    if(b){
      socket.emit('setQuestionSuccessful');
    }else{
      socket.emit('setQuestionFailed');
    }
  });
  
}

/**
 * return all poll data by an single poll id
 * data = {pollId}
 */
function getPoll(data,socket){
  var p = data.pollId;
  
  DATA.findPoll(p,function(poll){
    if(Boolean(poll)){
      socket.emit('getPollSuccessful',poll);
      return true;
    }else{
      socket.emit('getPollFailed');
      return false;
    }
  });

  return true;
}

/**
 * returns all polls, that belongs to a single course
 * data = {courseId}
 */
function _getAllPollsByCourse(data,socket,callback){
    var c = data.courseId;
    
    var pollIds = null;
    var polls = new Array();

    //TODO: user have be checked!

    // get all polls from selected course
    DATA.findCourse(c,function(course){
      pollIds = course.Polls;
    });
    
    if(Boolean(pollIds)){
      
      for(i in pollIds){
        DATA.findPoll(pollIds[i],function(poll){
          if(Boolean(poll)) polls.push(poll);
          return true;
        })
      }
      
      callback(polls);
      return true;
    }else{
    callback(null);
      return false;
    }
}

/**
 * returns all polls of a course
 * data = {courseId}
 */
function getAllPollsByCourse(data,socket){
  
  //TODO: user have be checked!
  _getAllPollsByCourse(data,socket,function(polls){

    if(Boolean(polls)){
      socket.emit('getAllPollsByCourseSuccessful',polls);
      return true;
    }else{
      socket.emit('getAllPollsByCourseFailed');
      return false;
    }
    
  });
  return true;
}

/**
 * select a poll and change his type
 * data = {pollId,pollType}
 */
function setPollType(data,socket){
  var p = data.pollId;
  var pType = data.pollType;
  
  //TODO: user have be checked!
  DATA.findPoll(p,function(poll){
    if(Boolean(poll)){
      var nPollAnswers = new Object();
      
      if((poll.Type == 'ab' || poll.Type == 'abc' || poll.Type == 'abcd') && (pType == 'ab' || pType == 'abc' || pType == 'abcd') && poll.Answers!=null){
        var pos = null;

        // only delete not needet answer option they are not needet
        for (var i = 0; i <= pType.length - 1; i++) {
          pos = pType.slice(i,i+1);
          nPollAnswers[pos] = (pos in poll.Answers?poll.Answers[pos]:'');
        };
      }

      poll.Answers = new Object(nPollAnswers);
      poll.Type = pType;
      poll.Stats = clone(DATA.StatTyps[pType]);
      socket.emit('setPollTypeSuccessful',poll);
      return true;
    }else{
      socket.emit('setPollTypeFailed');
      return false;
    }
  });
  
  return true;
}

/**
 * change the position of a single poll
 * data = {courseId,pollId,position}
 */
function setPollOrder(data,socket){
  var c = parseInt(data.courseId);
  var pv = parseInt(data.pollId);
  var pos =  parseInt(data.position);

  //TODO: user have be checked!

  DATA.findCourse(c,function(course){

    var polls = course.Polls;
    
    // empty poll list can not be reordered
    if(polls.length<1) socket.emit('setPollOrderFailed');
    
    var absPos = 0; // absolute position in current run
    var newPolls = [];
    var oldPos = polls.indexOf(pv);

    polls.forEach(function(curPV,curPP){ //curPP = pos, curPV = value
      if(pos==curPP){
        newPolls.push(pv);
      }
      
      if(pv!=curPV){
        newPolls.push(curPV);
        absPos++;
      }
      return true;

    });   
     
    course.Polls = clone(newPolls);
    DATA.changeCourse(course);

    socket.emit('setPollOrderSuccessful',course.Polls);
    return true;
  });
  return true;
}

/**
 * Delete a single poll
 * data = {pollId}
 */
function deletePoll(data,socket){
  var p = data.pollId;

  //TODO: user have be checked!
  
  if(Boolean(p)){
    DATA.deletePoll(p,function(){
      socket.emit('deletePollSuccessful', {pollId: p});
      return true;
    });
    
    return true;
  }else{
    socket.emit('deletePollFailed');
    return false;
  }
}

/**
 * submits by a pollid all information that's are 
 * needed to start the course with the poll
 * data = {pollId}
 */
function startWithPoll(data,socket){
  var p = data.pollId;
  
  //TODO: user have be checked!

  DATA.findPoll(p,function(poll){
    if(Boolean(poll)){
      socket.emit('startWithPollSuccess',poll);
      return true;
    }else{
      socket.emit('startWithPollFailed',poll);
      return false;
    }
  });
  return true;
  
}

/**
 * Courseowner can trigger to switch the current poll
 * data = {courseId, sid, pollType}
 */
function nextPoll(data,socket){

  var c =  data.courseId;
  var pType = data.pollType;
  var userId = data.userId;

  var id = null;

  DATA.getUserBySID(sid.get(socket),function(u){
    id = (Boolean(u)?u:sid.get(socket));
  });

  //TODO: user have be checked!
  
  DATA.isCourseOwner(c,id,function(b){

    if(b){
      DATA.createPoll(c,pType,function(p){

        p.Active = DATA.Activity.ACTIVE;
        p.Status = DATA.Status.VISIBLE;

        DATA.changePoll(p);

        socket.broadcast.to(p.CourseID).emit('publishNextPoll',p);
        DATA.findCourse(c, function(c) {
          socket.emit('publishNextPollForOwner',{'course':c, 'poll':p});
        });
        return true;
      });
      return true;
    }else if(!b){
      err(socket,'You are not the owner of this course!');
      return false;
    }else{
      err(socket,'User is not owner of selected course!');
      return false;
    }
  });

  return true;

}

/**
 * Returns all stats by a poll
 * data = {courseId}
 */
function getStatsByPoll(data,socket){
  var cid = data.courseId;

  DATA.getCurrentPollOfCourse(cid, function(p) {

    if(Boolean(p)){
      socket.emit('putStatsByPoll',{'pollStats':p.Stats.values,'type':p.Type});
      return true;
    }else{
      nfo(socket,'No stats available');
      return false;
    }

  });

  return true;
}

/**
 * Course Owner can close a poll
 * data = {courseId, sid} 
 */
function closePollByOwner(data,socket){

  var cid = data.courseId;
  var id = null;

  DATA.getUserBySID(sid.get(socket),function(u){
    id = (Boolean(u)?u:sid.get(socket));
  });
  
  DATA.isCourseOwner(cid,id,function(b){
    
    if(b){
      DATA.closeCurrentPollOfCourse(cid,function(p){
        if(Boolean(p)){
          bc_and_me(socket,cid,'closePollSuccessful',{'pollStats':p.Stats.values});
          return true;
        }else{
          err(socket,'Poll can not be closed!');
          return false;
        }
      });
      return true;
    }else{
      err(socket,'Close of the poll is not allowed. User is not course own!');
      return false;
    }
  });
  return true;
}

/**
 * handel the submitted answer
 * data = {courseId,answer} 
 */
function submitAnswer(data,socket){

  // course id
  var cid = data.courseId;

  //TODO: user have be checked!

  DATA.findCourse(cid, function(c) {
    
    if (!Boolean(c)) {
      err(socket,'Course does not exsit!');
    }else{

      DATA.getCurrentPollOfCourse(c.ID,function(p){

        if(!Boolean(p)){
          err(socket,'Poll does not exsit!');
        }else{

          try{

            if(p.Stats['values'][String(data.answer)] == undefined){
              p.Stats['values'][String(data.answer)] = 1;
            }else{
              p.Stats['values'][String(data.answer)] += 1;
            }
            
            p.Stats['count'] += 1;
            DATA.changePoll(p);
            publishStats(socket,cid,'TotalCount',{'totalCount':p.Stats['count']});

          }catch(e){
            err(socket,'Can not save vote');
          }

        }
        return true;
      });
    }
    return true;

  });
  return true;
}

/**
 * Join an active Course
 * data = {courseid}
 */
function joinCourse(data, socket){

  var cid = data.courseid;
      
  DATA.findCourse(cid, function(c) {
    
    // join only, if the selected course exists
    if(!Boolean(c)) {
      err(socket,'Course does not exist!');
      return false;
    }else{
      socket.join(cid);

      // join the current course of the poll
      DATA.getCurrentPollOfCourse(cid,function(p){

        if(!Boolean(p)){
          err(socket,'Poll does not exist!');
        }else{
          if(p.Active==DATA.Activity.ACTIVE){
            socket.emit('joinActivCourseSuccessful',p);
          }else{
            socket.emit('joinInactivCourseSuccessful',{'pollStats':p.Stats, 'poll': p});
          }
        }
        return true;
      });
    }
    return true;
  });
  return true;
}

/**
 * create a new course
 * data = {ownerSID}
 */
function createNewCourse(data,socket){
      
  // user-session-id
  var pType = data.pollType;
  var id = null;

  DATA.getUserBySID(sid.get(socket),function(u){
    id = (Boolean(u)?u:null);
  });
  
  // submit sid only if userid is not given!
  DATA.createCourse(id, (Boolean(id)?null:sid.get(socket)), function(c) {
    try{
      DATA.createPoll(c.ID,pType, function(p) {
        socket.join(c.ID);
        socket.emit('createNewCourseSuccessful',{'courseId':c.ID, 'pollType':pType, 'course':c, 'poll': p});
        return true;
      });
    }catch(e){
      err(socket,'initial poll of this course could not be created')
      return false;
    }
    
  });
  return true;
}

/**
 * Create a useraccount
 * data = {username,password}
 */
function createUser(data,socket){
  var username = data.username;
  var password = data.password;
  var name = (data.name||'');
  
  // Username or password empty? 
  if(Boolean(username)||Boolean(password)){
    //createUser(nick: String, name: String, pass: String, mail: String or null, callback: function(Integer))
    DATA.createUser(username,name,password,null,function answerCreateRequest(id){
      socket.emit('createUserSuccessful',{'userid':id,'msg_body':'username successfully created!','status':true});
      return true;
    });
    return true;  
  }else{
    socket.emit('createUserFailed',{'msg_body':'username or password emptry!','status':false});
    return false;
  }
  return false;
}

/**
 * trys to login an user by his username and his password
 * data = {username,password}
 */
function loginUser(data,socket){
  var username = data.username;
  var password = data.password;

  DATA.loginUser(username,password,function(user){

    if(Boolean(user)){
      DATA.setUserSID(user.ID,sid.get(socket));

      // transfer created courses to the logedin user
      DATA.findCoursesBySID(sid.get(socket),function(courses){
        if(!Boolean(courses)) return false;
        for(c in courses){
          DATA.setCourseOwner(courses[c],user.ID);          
        }
      })

      socket.emit('loginUserSuccessful',{'msg_body':'Login Successful. Welcome!','status':true,'userId':user.ID});
      return true;
    }else{
      socket.emit('loginUserFailed',{'msg_body':'Login failed. Please retry!','status':false});
      return false;
    }

  });
  
  return true;
}

/**
 * logs an user out of the system by deleting his session-key
 * data = {username,sid}
 */
function logoutUser(data,socket){
  var username = data.username;
  
  DATA.getUserBySID(sid.get(socket),function(userId){
    if(Boolean(userId)){
      DATA.setUserSID(userId,'',function(){
        socket.emit('logoutUserSuccessful',{'status':true});
        return true;
      });
      return true;
    }else{
      socket.emit('logoutUserFailed',{'status':false});
      return false;
    }

    return true;
  });

  return true;
}

/**
 * return next poll by a course
 * overflow is true is you are the beginnig of the poll list
 * data = {courseId}
 */
function nextPollByCourse(data,socket){
  var cid = data.courseId;
  
  //TODO: user have be checked!

  DATA.navToNextPoll(cid,function(poll,overflow){

    if(Boolean(poll)){      
      DATA.findCourse(poll.CourseID,function(course){
        if(Boolean(course)){
          isLastPoll = DATA.isLastPoll(poll.ID,cid,function(b){return b});

          poll.Active = DATA.Activity.ACTIVE;
          poll.Status = DATA.Status.VISIBLE;

          DATA.changePoll(poll);

          socket.broadcast.to(course.ID).emit('publishNextPoll',poll);
          socket.emit('nextPollByCourseSuccessful',{'poll':poll, 'course': course, 'isLastPoll':isLastPoll});
        }
      });
      return true;
    }else{
      socket.emit('nextPollByCourseFailed');
      return false;
    }
  });
  return true;
}

/**
 * return previous poll by a course
 * overflow is true is you are the beginnig of the poll list
 * data = {courseId}
 */
function prevPollByCourse(data,socket){
  var cid = data.courseId;

  //TODO: user have be checked!

  DATA.navToPreviousPoll(cid,function(poll,overflow){
    if(Boolean(poll)){
        DATA.findCourse(poll.CourseID,function(course){
        if(Boolean(course)){

          poll.Active = DATA.Activity.ACTIVE;
          poll.Status = DATA.Status.VISIBLE;

          DATA.changePoll(poll);

          socket.broadcast.to(course.ID).emit('publishNextPoll',poll);
          socket.emit('prevPollByCourseSuccessful',{'poll':poll, 'course': course});
        }
      });
      return true;
    }else{
      socket.emit('prevPollByCourseFailed');
      return false;
    }
  });
  return true;
}

/**
 * return first poll by a course
 * data = {courseId}
 */
function fristPollByCourse(data,socket){
  var cid = data.courseId;

  //TODO: user have be checked!

  DATA.navToFirstPoll(cid,function(poll){
    if(Boolean(poll)){
      socket.emit('fristPollByCourseSuccessful',poll);
      return true;
    }else{
      socket.emit('fristPollByCourseFailed');
      return false;
    }
  });
  return true;
}

/**
 * return last poll by a course
 * data = {courseId}
 */
function lastPollByCourse(data,socket){
  var cid = data.courseId;

  //TODO: user have be checked!

  DATA.navToLastPoll(cid,function(poll){
    if(Boolean(poll)){
      socket.emit('lastPollByCourseSuccessful',poll);
      return true;
    }else{
      socket.emit('lastPollByCourseFailed');
      return false;
    }
  });
  return true;
}

/**
 * get all data for a single course 
 * data = {courseId}
 */
function getCompleteCourse(data,socket){
  var cid = data.courseId;

  DATA.findCourse(cid,function(course){
    if(Boolean(course)){
      
      _getAllPollsByCourse(data, socket, function(polls){
        socket.emit('getCompleteCourseSuccessful',{'course':course,'polls':polls});
        return true;
      });
    }else{
      socket.emit('getCompleteCourseFailed');
      return false;
    }
  });
  return true;
}

/**
 * got to a selected poll
 */
function goToPollByCourse(data,socket){
  var c = data.courseId;
  var p = data.pollId;
  var r = (typeof data.resetPoll=="undefined"?false:data.resetPoll);

  //TODO: user have be checked!

  DATA.navToPoll(c,p,function(poll){
    if(Boolean(poll)){
          DATA.findCourse(c,function(course){
            var isLastPoll = DATA.isLastPoll(poll.ID,course.ID,function(b){return b});
            socket.join(course.ID);
            
            poll.Active = DATA.Activity.ACTIVE;
            poll.Status = DATA.Status.VISIBLE;

            DATA.changePoll(poll);

            socket.broadcast.to(poll.CourseID).emit('goToPollByCourseSuccessful',{'courseId':poll.CourseID,'pollType':poll.Type, 'course':course,'poll':poll,'totalCount':0});
            socket.emit('goToPollByCourseForOwnerSuccessful',{'courseId':poll.CourseID,'pollType':poll.Type, 'course':course,'poll':poll, 'isLastPoll': isLastPoll, 'totalCount':0});
          });
          return true;
    }else{
      socket.emit('goToPollByCourseForOwnerFailed',{'courseId':poll.CourseID,'pollType':poll.Type,'totalCount':0});     
      //socket.emit('goToPollByCourseForOwnerFailed',poll);
      return false;
    }
  });
  return false; 
}

/**
 * set course name 
 */
function setCourseName(data,socket){
  var c = data.courseId;
  var name = data.name;

  //TODO: user have be checked!

  DATA.findCourse(c,function(course){
    if(Boolean(course)){
      var nCourse = clone(course);
      nCourse.Name = name;
      DATA.changeCourse(nCourse);

      socket.emit('setCourseNameSuccessful',nCourse);
      return true;
    }else{
      socket.emit('setCourseNameFailed',course);
      return false;
    }
  });
  return true;
}

/**
 * get all courses for a single user by his sessionid 
 */
function getAllCoursesByUser(data,socket){
  var userId = data.userId;

  DATA.findCoursesByOwner(userId,function(courses){
    if(courses == null){
      socket.emit('getAllCoursesByUserSuccessful',{'courses':[],'polls':[]});
    }else if(courses.length > 0){

      // get course infos for every courseid
      var coursObjectsList = new Array();
      var pollObjectsList = new Array();
      for(c in courses){

        DATA.findCourse(courses[c],function(course){
          coursObjectsList.push(course);

          var pollObjectsByCourseList = new Array();

          if(Boolean(course.Polls)){
            var polls = course.Polls;//.slice(0,3);

            for(p in polls){
              DATA.findPoll(polls[p],function(poll){

                if(Boolean(poll)){
                  pollObjectsByCourseList.push(new Object(poll));
                  return true;
                }

                return false;
              });
            }
          }

          pollObjectsList.push(clone(pollObjectsByCourseList));

          return true;
        });
      }

      socket.emit('getAllCoursesByUserSuccessful',{'courses':coursObjectsList,'polls':pollObjectsList});
      return true;
    }else{
      socket.emit('getAllCoursesByUserFailed');
      return false;
    }
  });
  return true;
}

/**
 * Clone an existing course to reuse its structure
 */
function cloneCourse(data,socket){
  var c = data.courseId;
  
  DATA.resetPollsOfCourse(c,function(course){
    if(Boolean(course)){
      // get all polls of the cloned an course
      _getAllPollsByCourse({courseId:course.ID}, socket, function(polls){
        // we need maiden polls!
        DATA.resetPollsOfCourse(course.ID);
        socket.emit('cloneCourseSuccessful',{'course':course,'polls':polls});
        return true;
      });
      return true;
    }else{
      socket.emit('cloneCourseFailed');
      return false;
    }
  });
  return true;
}

/**
 * Delete a course complitly
 */
function deleteCourse(data,socket){
  var c = data.courseId;
  if(Boolean(c)){
    DATA.deleteCourse(c);
    socket.emit('deleteCourseSuccessful', {courseId: c});
  }else{
    socket.emit('deleteCourseFailed');
  }
}

/**
 * Reset all pools of a course 
 */
function resetPollsOfCourse(data,socket){
  var c = data.courseId;
  if(Boolean(c)){
    DATA.resetPollsOfCourse(c);
    socket.emit('resetPollsOfCourseSuccessful');
  }else{
    socket.emit('resetPollsOfCourseFailed');
  }
}

/**
 * checks if user is logged in
 * data = {userId}
 */
function isSessionValid(data,socket){
  var userId = data.userId;
  var sessionId = sid.get(socket);

  DATA.getUserBySID(sessionId,function(id){
    if(Boolean(id)){
      DATA.getUser(id,function(user){
        if(userId==user.ID){
          socket.emit('isSessionValidSuccessful',{isLoggedIn:true});
          return true;
        }else{
          socket.emit('isSessionValidFailed',{isLoggedIn:false});
          return false;
        }
      });
      return true;
    }else{
      socket.emit('isSessionValidFailed',{isLoggedIn:false});
      return false;
    }
  });
}