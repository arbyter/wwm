/*
 * Table of contents
 *
 * Section 1: Generic Testframework
 * Section 2: Testsuites
 */


/******************** Section 1 **********************/


// list of tests to be performed
exports.testSuites = [];

// logging function shortcut
var l = console.log;

// cloning dictionaries
var clone = require('./utils.js').clone;

// data module to be tested
var DATA = require('./data.js'); // data API using file storage

/*
 * generates text of test results
 */
function printResult(result) {
  if(result) {
    return '\033[32mOK\033[39m';
  } else {
    return '\033[31mFAILED\033[39m';
  }
}

// iteration variables
exports._i = -1; // outer loop
exports._j = -1; // inner loop

/*
 * performing one test
 */
exports._step = function() {
  if(exports._j == -1) { // starting next outer loop step
    l();
    if(++exports._i < exports.testSuites.length) { // starting inner loop
      l('[\033[33mTest suite\033[39m: \033[36m' + exports.testSuites[exports._i].Name + '\033[39m]');
    } else { // finished outer loop
      l('[\033[33mFinished test cases\033[39m]');

      // exit
      process.exit(0);
    }
  }

  if(++exports._j >= exports.testSuites[exports._i].Tests.length) { // finished inner loop
    exports._j = -1; // reset counter
    process.nextTick(exports._step); // schedule cleanup for next step
    return; // skip further steps
  }

  // actually performing a test
  try {
    exports.testSuites[exports._i].Tests[exports._j].run(function(result) {
      l(exports.testSuites[exports._i].Tests[exports._j].Name + ': ' + printResult(result));
      process.nextTick(exports._step); // prepare next step
    });
  } catch(e) {
    l(exports.testSuites[exports._i].Tests[exports._j].Name + ': ' + printResult(false) + ' [E]');
    l(e);
    process.nextTick(exports._step); // prepare next step
  }
}


/*
 * main routine to run tests
 */
exports.run = function() {
  l();
  l('[\033[33mRunning test cases\033[39m]');

  DATA.INIT(exports._step);
}

/*
 * test creating funciton
 */
function createTest(s, n, f) {
  s.Tests.push({'Name': n, 'run': f});
}

/*
 * suite creating funciton
 */
function createTestSuite(n) {
  return {'Name': n, 'Tests': []};
}



/******************** Section 2 **********************/

var suite;

/*
 * self test and sample test suite
 */
suite = createTestSuite('Selftest');
createTest(suite, 'This is what a successful test should look like', function(callback) {
  callback(true);
});
createTest(suite, 'This is what a failed test should look like', function(callback) {
  callback(false);
});
exports.testSuites.push(suite);




if(CONFIG.DATA_STORAGE == 'FILE') {
  // testing data module using file storage
  suite = createTestSuite('Data API (Files)');
}
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  // testing data module using MongoDB
  suite = createTestSuite('Data API (MongoDB)');
}


createTest(suite, 'creating a course', function(callback) {
  DATA.createCourse('foo', 'foo' + (new Date()).getTime(), function(course) {
    suite.course = clone(course);
    callback((course != null) && (course.Owner == 'foo'));
  });
});

createTest(suite, 'finding a course (1)', function(callback) {
  DATA.findCourse(suite.course.ID, function(course) {
    callback((course != null) && (course.ID == suite.course.ID));
  });
});

createTest(suite, 'finding a course (2)', function(callback) {
  DATA.findCourse(-1, function(course) {
    callback(course == null);
  });
});

createTest(suite, 'finding a course by owner (1)', function(callback) {
  DATA.findCoursesByOwner('foo', function(courses) {
    callback((courses != null) && (suite.course.ID == courses[courses.length - 1]));
  });
});

createTest(suite, 'finding a course by owner (2)', function(callback) {
  DATA.findCoursesByOwner('zzz', function(courses) {
    //
    // Actually, only session-IDs should be "owner" of a course, so
    // 'foo' should not yield results in the first place.
    // So now we test with 'zzz' if we get 'no result'.
    //
    callback(courses == null);
  });
});

createTest(suite, 'create poll (1)', function(callback) {
  DATA.createPoll(suite.course.ID, 'myType', function(poll){
    suite.poll = clone(poll);
    callback((poll != null) && (poll.CourseID == suite.course.ID));
  });
});

createTest(suite, 'create poll (2)', function(callback) {
  DATA.createPoll(-1, 'myType', function(poll){
    callback(poll == null);
  });
});

createTest(suite, 'find poll (1)', function(callback) {
  DATA.findPoll(suite.poll.ID, function(poll) {
    callback((poll != null) && (poll.ID == suite.poll.ID));
  });
});

createTest(suite, 'find poll (2)', function(callback) {
  DATA.findPoll(-1, function(poll) {
    callback(poll == null);
  });
});

createTest(suite, 'change poll (1)', function(callback) {
  var p = clone(suite.poll);
  p.Stats = 'myStats';
  DATA.changePoll(p, function(poll) {
    callback((poll != null) && (poll.ID == p.ID) && (poll.Stats == 'myStats'));
  });
});

createTest(suite, 'change poll (2)', function(callback) {
  var p = clone(suite.poll);
  p.ID = -1;
  DATA.changePoll(p, function(poll) {
    callback(poll == null);
  });
});

createTest(suite, 'getCourseStatus (1)', function(callback) {
  DATA.getCourseStatus(suite.course.ID, function(stat) {
    callback((stat != null) && (stat == DATA.Status.VISIBLE));
  });
});

createTest(suite, 'getCourseStatus (2)', function(callback) {
  DATA.getCourseStatus(-1, function(stat) {
    callback(stat == null);
  });
});

createTest(suite, 'getPollVisibility (1)', function(callback) {
  DATA.getPollVisibility(suite.poll.ID, function(vis) {
    callback((vis != null) && (vis == DATA.Status.VISIBLE));
  });
});

createTest(suite, 'getPollVisibility (2)', function(callback) {
  DATA.getPollVisibility(-1, function(vis) {
    callback(vis == null);
  });
});

createTest(suite, 'isCourseOwner (1)', function(callback) {
  DATA.isCourseOwner(suite.course.ID, 'foo', function(result) {
    callback(result == true);
  });
});

createTest(suite, 'isCourseOwner (2)', function(callback) {
  DATA.isCourseOwner(suite.course.ID, 'bar', function(result) {
    callback(result == false)
  });
});

createTest(suite, 'isCourseOwner (3)', function(callback) {
  DATA.isCourseOwner(-1, 'foo', function(result) {
    callback(result == null)
  });
});

createTest(suite, 'isPollOwner (1)', function(callback) {
  DATA.isPollOwner(suite.poll.ID, 'foo', function(result) {
    callback(result == true);
  });
});

createTest(suite, 'isPollOwner (2)', function(callback) {
  DATA.isPollOwner(suite.poll.ID, 'bar', function(result) {
    callback(result == false)
  });
});

createTest(suite, 'isPollOwner (3)', function(callback) {
  DATA.isPollOwner(-1, 'foo', function(result) {
    callback(result == null)
  });
});

createTest(suite, 'getCurrentPollOfCourse (1)', function(callback) {
  DATA.getCurrentPollOfCourse(suite.course.ID, function(poll) {
    callback((poll != null) && (poll.ID == suite.poll.ID));
  });
});

createTest(suite, 'getCurrentPollOfCourse (2)', function(callback) {
  DATA.getCurrentPollOfCourse(-1, function(poll) {
    callback(poll == null);
  });
});

createTest(suite, 'storeResultOfCurrentPoll', function(callback) {
  DATA.storeResultOfCurrentPoll(suite.course.ID, "lorem ipsum", function() {
    DATA.getCurrentPollOfCourse(suite.course.ID, function(poll) {
      callback((poll != null) && (poll.Stats == 'lorem ipsum'));
    });
  });
});

createTest(suite, 'closeCurrentPollOfCourse', function(callback) {
  DATA.getCurrentPollOfCourse(suite.course.ID, function(poll1){
    var tmp = ((poll1 != null) && (poll1.Active == DATA.Activity.ACTIVE));
    DATA.closeCurrentPollOfCourse(suite.course.ID, function(poll3){
      DATA.getCurrentPollOfCourse(suite.course.ID, function(poll2){
        callback(tmp && (poll2 != null) && (poll2.Active == DATA.Activity.INACTIVE) &&
                 (poll3 != null) && (poll3.ID == poll2.ID));
      });
    });
  });
});

createTest(suite, 'createUser (1)', function(callback) {
  suite.uName = 'foo' + (new Date()).getTime();
  DATA.createUser(suite.uName, 'Testaccount', '1234', null, function(uID) {
    suite.userID = uID;
    callback(uID != null);
  });
});

createTest(suite, 'createUser (2)', function(callback) {
  DATA.createUser(suite.uName, 'Testaccount', '1234', null, function(uID) {
    callback(uID == null);
  });
});

createTest(suite, 'loginUser (1)', function(callback) {
  DATA.loginUser(suite.uName, '1234', function(user) {
    callback((user != null) && (user.Nick == suite.uName) && (user.Name == 'Testaccount'));
  });
});

createTest(suite, 'loginUser (2)', function(callback) {
  DATA.loginUser(suite.uName, '12345', function(user) {
    callback(user == null);
  });
});

createTest(suite, 'getUser (1)', function(callback) {
  DATA.getUser(suite.userID, function(user) {
    callback((user != null) && (user.Nick == suite.uName));
  });
});

createTest(suite, 'getUser (2)', function(callback) {
  DATA.getUser(-1, function(user) {
    callback(user == null);
  });
});

createTest(suite, 'setUserPassword (1)', function(callback) {
  DATA.setUserPassword(suite.userID, '1234', '1234', function(result) {
    callback(result == true);
  });
});

createTest(suite, 'setUserPassword (2)', function(callback) {
  DATA.setUserPassword(suite.userID, '12345', '1234', function(result) {
    callback(result == false);
  });
});

createTest(suite, 'setUserPassword (3)', function(callback) {
  DATA.setUserPassword(-1, '1234', '1234', function(result) {
    callback(result == false);
  });
});

createTest(suite, 'resetUserPassword (1)', function(callback) {
  DATA.resetUserPassword(suite.userID, function(pw) {
    suite.uPass = pw;
    DATA.getUser(suite.userID, function(user) {
      callback((pw != null) && (user != null) && (user.Pass == pw));
    });
  });
});

createTest(suite, 'resetUserPassword (2)', function(callback) {
  DATA.resetUserPassword(-1, function(pw) {
    callback(pw == null);
  });
});

createTest(suite, 'setUserSID', function(callback) {
  suite.sid = 'mySID' + (new Date()).getTime();
  DATA.setUserSID(suite.userID, suite.sid, function() {
    DATA.getUser(suite.userID, function(user) {
      callback((user != null) && (user.SID == suite.sid));
    })
  });
});

createTest(suite, 'getUserBySID (1)', function(callback) {
  DATA.getUserBySID(suite.sid, function(uid) {
    callback(uid == suite.userID);
  });
});

createTest(suite, 'getUserBySID (2)', function(callback) {
  DATA.getUserBySID('_', function(uid) {
    callback(uid == null);
  });
});

createTest(suite, 'setQuestion/getQuestion', function(callback) {
  DATA.createPoll(suite.course.ID, 'myType', function(poll) {
    suite.poll2 = clone(poll);
    DATA.setQuestion(suite.poll2.ID, 'nyan?', function(couldSet) {
      DATA.getQuestion(suite.poll2.ID, function(question) {
        callback(couldSet && (question == 'nyan?'));
      });
    });
  });
});

createTest(suite, 'setAnswer/getAnswer', function(callback) {
  DATA.setAnswers(suite.poll2.ID, '42', function(couldSet) {
    DATA.getAnswers(suite.poll2.ID, function(answer) {
      callback(couldSet && (answer == '42'));
    });
  });
});

createTest(suite, 'navToFirstPoll (1)', function(callback) {
  DATA.createPoll(suite.course.ID, 'myType', function(poll) {
    suite.poll3 = clone(poll);
    DATA.navToFirstPoll(suite.course.ID, function(poll1) {
      DATA.getCurrentPollOfCourse(suite.course.ID, function(poll2) {
        callback((poll1 != null) && (poll2 != null) &&
                 (poll1.ID == suite.poll.ID) &&
                 (poll2.ID == suite.poll.ID));
      });
    });
  });
});

createTest(suite, 'navToFirstPoll (2)', function(callback) {
  DATA.navToFirstPoll(-1, function(poll) {
    callback(poll == null);
  });
});

createTest(suite, 'navToLastPoll (1)', function(callback) {
  DATA.navToLastPoll(suite.course.ID, function(poll1) {
    DATA.getCurrentPollOfCourse(suite.course.ID, function(poll2) {
      callback((poll1 != null) && (poll2 != null) &&
               (poll1.ID == suite.poll3.ID) &&
               (poll2.ID == suite.poll3.ID));
    });
  });
});

createTest(suite, 'navToLastPoll (2)', function(callback) {
  DATA.navToLastPoll(-1, function(poll) {
    callback(poll == null);
  });
});

createTest(suite, 'navToNextPoll (1)', function(callback) {
  DATA.navToFirstPoll(suite.course.ID, function() {
    DATA.navToNextPoll(suite.course.ID, function(poll1, overflow) {
      DATA.getCurrentPollOfCourse(suite.course.ID, function(poll2) {
        callback((poll1 != null) && (poll2 != null) &&
                 (poll1.ID == suite.poll2.ID) &&
                 (poll2.ID == suite.poll2.ID) && (!overflow));
      });
    });
  });
});

createTest(suite, 'navToNextPoll (2)', function(callback) {
  DATA.navToLastPoll(suite.course.ID, function() {
    DATA.navToNextPoll(suite.course.ID, function(poll1, overflow) {
      DATA.getCurrentPollOfCourse(suite.course.ID, function(poll2) {
        callback((poll1 != null) && (poll2 != null) &&
                 (poll1.ID == suite.poll.ID) &&
                 (poll2.ID == suite.poll.ID) && overflow);
      });
    });
  });
});

createTest(suite, 'navToNextPoll (3)', function(callback) {
  DATA.navToNextPoll(-1, function(poll, overflow) {
    callback(poll == null);
  });
});

createTest(suite, 'navToPreviousPoll (1)', function(callback) {
  DATA.navToLastPoll(suite.course.ID, function() {
    DATA.navToPreviousPoll(suite.course.ID, function(poll1, overflow) {
      DATA.getCurrentPollOfCourse(suite.course.ID, function(poll2) {
        callback((poll1 != null) && (poll2 != null) &&
                 (poll1.ID == suite.poll2.ID) &&
                 (poll2.ID == suite.poll2.ID) && (!overflow));
      });
    });
  });
});

createTest(suite, 'navToPreviousPoll (2)', function(callback) {
  DATA.navToFirstPoll(suite.course.ID, function() {
    DATA.navToPreviousPoll(suite.course.ID, function(poll1, overflow) {
      DATA.getCurrentPollOfCourse(suite.course.ID, function(poll2) {
        callback((poll1 != null) && (poll2 != null) &&
                 (poll1.ID == suite.poll3.ID) &&
                 (poll2.ID == suite.poll3.ID) && overflow);
      });
    });
  });
});

createTest(suite, 'navToPreviousPoll (3)', function(callback) {
  DATA.navToPreviousPoll(-1, function(poll, overflow) {
    callback(poll == null);
  });
});

createTest(suite, 'isLastPoll (1)', function(callback) {
  DATA.isLastPoll(suite.course.ID, suite.poll3.ID, function(result) {
    callback(result == true);
  });
});

createTest(suite, 'isLastPoll (2)', function(callback) {
  DATA.isLastPoll(suite.course.ID, suite.poll.ID, function(result) {
    callback(result == false);
  });
});

createTest(suite, 'isLastPoll (3)', function(callback) {
  DATA.isLastPoll(-1, -1, function(result) {
    callback(result == false);
  });
});

createTest(suite, 'navToPoll (1)', function(callback) {
  DATA.navToPoll(suite.course.ID, suite.poll.ID, function(poll1) {
    DATA.getCurrentPollOfCourse(suite.course.ID, function(poll2) {
      callback((poll1 != null) &&
               (poll1.ID == suite.poll.ID) &&
               (poll2.ID == suite.poll.ID));
    });
  });
});

createTest(suite, 'navToPoll (2)', function(callback) {
  DATA.navToPoll(suite.course.ID, -1, function(poll) {
    callback(poll == null);
  });
});

createTest(suite, 'navToPoll (3)', function(callback) {
  DATA.navToPoll(-1, suite.poll.ID, function(poll) {
    callback(poll == null);
  });
});

createTest(suite, 'deletePoll (1)', function(callback) {
  DATA.deletePoll(suite.poll2.ID, function() {
    DATA.findPoll(suite.poll2.ID, function(poll) {
      DATA.findCourse(suite.course.ID, function(course) {
        callback((poll == null) && (course.Polls.length == 2));
      });
    });
  });
});

// "regression test"
createTest(suite, 'deletePoll (2)', function(callback) {
  DATA.createCourse('regression', 'regression' + (new Date()).getTime(), function(course) {
    DATA.createPoll(course.ID, 'yn', function() {
    DATA.createPoll(course.ID, 'yn', function() {
    DATA.createPoll(course.ID, 'yn', function() {
    DATA.createPoll(course.ID, 'yn', function() {
    DATA.createPoll(course.ID, 'yn', function() {
    DATA.createPoll(course.ID, 'yn', function() {
      DATA.findCourse(course.ID, function(course2) {
        var toDelete = [course2.Polls[1], course2.Polls[2], course2.Polls[5]];
        DATA.deletePoll(toDelete[0], function() {
        DATA.deletePoll(toDelete[1], function() {
        DATA.deletePoll(toDelete[2], function() {
          DATA.findCourse(course.ID, function(course4) {
          DATA.createPoll(course.ID, 'yn', function() {
          DATA.createPoll(course.ID, 'yn', function() {
          DATA.createPoll(course.ID, 'yn', function() {
            DATA.findCourse(course.ID, function(course3) {
              var result = (course3.Polls.length == 6);
              for(var i = 0; i < course3.Polls.length; ++i) {
                result = (result &&
                          (typeof(course3.Polls[i]) == 'number') &&
                          (course3.Polls[i] != 0));
              }
              callback(result);
            });
          });
          });
          });
          });
        });
        });
        });
      });
    });
    });
    });
    });
    });
    });
  });
});

createTest(suite, 'cloneCourse', function(callback) {
  // refresh data
  DATA.findCourse(suite.course.ID, function(course) {
    DATA.findPoll(course.Polls[0], function(poll) {
      suite.poll = clone(poll);

      DATA.cloneCourse(suite.course.ID, function(course2) {
        suite.course2 = course2;
        if(course2 != null) {
          DATA.findPoll(course2.Polls[0], function(poll2) {
            suite.poll2 = clone(poll2);
            callback((poll2 != null) &&
                     (poll2.ID != suite.poll.ID) && 
                     (poll2.Stats == suite.poll.Stats));
          });
        } else {
          l(false);
          callback(false);
        }
      });
    });
  });
});

createTest(suite, 'resetPollsOfCourse', function(callback) {
  DATA.resetPollsOfCourse(suite.course2.ID, function() {
    DATA.findPoll(suite.course2.Polls[0], function(poll) {
      callback((poll != null) &&
               (poll.ID == suite.poll2.ID) &&
               (poll.Stats != suite.poll.Stats)); // see test above
    });
  });
});

createTest(suite, 'deleteCourse', function(callback) {
  DATA.deleteCourse(suite.course2.ID, function() {
    DATA.findCourse(suite.course2.ID, function(course) {
      DATA.findPoll(suite.poll2.ID, function(poll) {
        callback((course == null) && (poll == null));
      });
    });
  });
});

exports.testSuites.push(suite);

