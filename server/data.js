/*
 * Data Storage API
 *
 * USAGE:
 *
 * 1.: load in main.js: DATA = require('./data.js');
 * 2.: call INIT: DATA.INIT(callback: function(void));
 * 3.: use DATA object for data access: DATA.bar(baz, function(foo){...});
 *
 * Methods ment to be used:
 *  - createCourse(owner: String, sid: (String or null), callback: function(Course))
 *  - changeCourse(course: Course, callback: function(Course or null))
 *  - findCourse(courseID: Integer, callback: function(Course or null))
 *  - findCoursesByOwner(owner: String, callback: function(list of Integer or null))
 *  - findCoursesBySID(sid: String, callback: function(list of Integer or null))
 *  - createPoll(courseID: Integer, type: String, callback: function(Poll or null (if course not found)))
 *  - changePoll(poll: Poll, callback: function(Poll or null))
 *  - findPoll(pollID: Integer, callback: function(Poll or null))
 *  - getSessionID(callback function(String))
 *
 *  - getCourseStatus(courseID: Integer, callack: function(Status or null (if course not found)))
 *  - getPollVisibility(pollID: Integer, callback: function(Status or null (if poll not found)))
 *  - isCourseOwner(courseID: Integer, user: String, callback: function(bool or null (if course not found)))
 *  - isPollOwner(pollID: Integer, user: String, callback: function(bool or null (if poll not found)))
 *  - isPollOwnerBySID(pollID: Integer, SID: String, callback: function(bool or null (if poll not found)))
 *  - getCurrentPollOfCourse(courseID: Integer, callback: function(Poll or null))
 *  - closeCurrentPollOfCourse(courseID: Integer, callback: function(Poll or null))
 *  - storeResultOfCurrentPoll(courseID: Integer, result: String, callback: function(void))
 *
 *  - createUser(nick: String, name: String, pass: String, mail: String or null, callback: function(Integer or null))
 *  - loginUser(nick: String, pass: String, callback: function(User or null))
 *  - getUser(uid: Integer, callback: function(User or null))
 *  - setUserPassword(uid: Integer, oldPass: String, newPass: String, callback: function(bool))
 *  - resetUserPassword(uid: Integer, callback: function(String or null))
 *  - setUserSID(uid: Integer, sid: String, callback: function(void))
 *  - getUserBySID(sid: String, callback: function(Integer or null))
 *
 *  - setQuestion(pollID: Integer, question: String or null, callback: function(bool))
 *  - getQuestion(pollID: Integer, callback: function(string or null))
 *  - setAnswers(pollID: Integer, answers: String or null, callback: function(bool))
 *  - getAnswers(pollID: Integer, callback: function(string or null))
 *
 *  - deletePoll(pollID: Integer, callback: function(void))
 *
 *  - navToNextPoll(courseID: Integer, callback: function(Poll or null, bool))
 *  - navToPreviousPoll(courseID: Integer, callback: function(Poll or null, bool))
 *  - navToFirstPoll(courseID: Integer, callback: function(Poll or null))
 *  - navToLastPoll(courseID: Integer, callback: function(Poll or null))
 *  - isLastPoll(courseID: Integer, pollID: Integer, callback: function(bool))
 *  - navToPoll(courseID: Integer, pollID: Integer, callback: function(Poll or null))
 *
 *  - deleteCourse(courseID: Integer, callback: function(void))
 *  - resetPollsOfCourse(courseID: Integer, callback: function(void))
 *  - cloneCourse(courseID: Integer, callback: function(course or null))
 *  - setCourseOwner(courseID: Integer, owner: String, callback: function(void))
 *
 * Objects defined here:
 *  - Status: { VISIBLE, INVISIBLE } (enum)
 *  - Activity: { ACTIVE, INACTIVE } (enum)
 *  - Course: {
 *      + Name: String
 *      + ID: Integer
 *      + Owner: (String or null)
 *      + OwnerSID: (String or null)
 *      + Created: Date
 *      + Polls: Array of Integer
 *      + Status: Status
 *      + CurrentPoll: Integer
 *    }
 *  - Poll: {
 *      + ID: Integer
 *      + CourseID: Integer
 *      + Type: String (serialized JSON; initial empty)
 *      + Stats: String (serialized JSON; initial empty)
 *      + Status: Status
 *      + Active: Activity
 *      + Question: String or null
 *      + Answers: String or null (serialized JSON)
 *    }
 *
 *  - User: {
 *      + ID: Integer
 *      + Nick: String
 *      + Name: String
 *      + Pass: String
 *      + Mail: String or null
 *      + SID: String or null
 *      + SIDStore : List
 *    }
 *
 * Objects for internal use:
 *  - DataType: { COURSE, POLL, USER, SESSIONID } (enum)
 */



/*** includes ***/

// general includes
var clone = require('./utils.js').clone;
var l = console.log; // TODO: remove me (needed for debugging only)

// platform specific path separators
var separators = {
  'LINUX32': ':',
  'LINUX64': ':',
  'WIN32': ';',
  'WIN64': ';'
};

// mongodb includes
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  // make binaries accessable
  process.env['PATH'] += separators[CONFIG.OS] + CONFIG.MONGO_BIN;
  // start database daemon
  var child = require('child_process').exec('mongod --port ' + CONFIG.MONGO_PORT + ' --dbpath="' + CONFIG.MONGO_DIR + '"');

  var mongodb = require('mongodb');
};


/*** data objects ***/


// status types
exports.Status = {
  INVISIBLE: 0,
  VISIBLE: 1
};

// activity types
exports.Activity = {
  INACTIVE: 0,
  ACTIVE: 1,
};


exports.StatTyps = {'yn':{'values':{'ja':0,'nein':0},'count':0},
                    'ab':{'values':{'a':0,'b':0},'count':0},
                    'abc':{'values':{'a':0,'b':0,'c':0},'count':0},
                    'abcd':{'values':{'a':0,'b':0,'c':0,'d':0},'count':0},
                    'guess':{'values':{},'count':0}};

// next course ID
var nextCourseID = 1;

// next poll ID
var nextPollID = 1;

// next user ID
var nextUserID = 1;


// objects for storing data in files
if(CONFIG.DATA_STORAGE == 'FILE') {
  // data type
  var DataType = {
    COURSE: 0,
    POLL: 1,
    USER: 2,
    SESSIONID: 3,
    DELPOLL: 4,
    DELCOURSE: 5
  };

  // mapping from data types to directory names
  var __tmpDirs = {
    0: 'courses/',
    1: 'polls/',
    2: 'users/',
    3: 'sessionIDs/',
    4: 'delpoll/',
    5: 'delcourse/'
  };

  // list of all courses
  exports.courses = {};
  exports.coursesByOwner = {};
  exports.coursesBySID = {};

  // list of all polls
  exports.polls = {};

  // list of all users
  exports.users = {};

  // sessionIDs
  var sessionIDs = [];

  // INIT function
  exports.INIT = function(callback) {
    // call callback
    if(typeof callback == 'function') {
      callback();
    }
  };
};

// objects for mongodb
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  // connection to server
  exports._server = new mongodb.Server(CONFIG.MONGO_SERVER, CONFIG.MONGO_PORT, {});
  // client connecting to actual database
  exports._client = new mongodb.Db(CONFIG.MONGO_DB, exports._server);

  // startup switches
  exports._startup = [false, false, false];

  // save callback function here
  exports._initCallback = null;

  // call init callback
  exports._initReturn = function() {
    if(exports._startup[0] && exports._startup[1] && exports._startup[2]) {
      process.nextTick(exports._initCallback);
      return;
    }
    setTimeout(exports._initReturn, 10);
  }
  
  // INIT function
  exports.INIT = function(callback) {
    // save callback
    exports._initCallback = callback;

    exports._client.open(function(err, p_client){
      // restore counters
      exports._client.collection('course', function(err, collection) {
        collection.find().sort([['ID', 'desc']]).nextObject(function(err, obj) {
          if(obj != null) {
            nextCourseID = parseInt(obj.ID) + 1;
          }

          // startup done for this ID
          exports._startup[0] = true;
        });
      });
      exports._client.collection('poll', function(err, collection) {
        collection.find().sort([['ID', 'desc']]).nextObject(function(err, obj) {
          if(obj != null) {
            nextPollID = parseInt(obj.ID) + 1;
          }

          // startup done for this ID
          exports._startup[1] = true;
        });
      });
      exports._client.collection('user', function(err, collection) {
        collection.find().sort([['ID', 'desc']]).nextObject(function(err, obj) {
          if(obj != null) {
            nextUserID = parseInt(obj.ID) + 1;
          }

          // startup done for this ID
          exports._startup[2] = true;
        });
      });

      // call callback
      if(typeof callback == 'function') {
        setTimeout(exports._initReturn, 20);
      }
    });
  };

  // termination handler
  process.on('exit', function() {
    // shut down database daemon
    (new mongodb.Admin(exports._client)).command({'shutdown': 1});
  });
}





/*** general (local) funcitons ***/

/*
 * creates a course
 */
function _createCourse(owner,sid) {
  return {
    Name:'',
    ID: nextCourseID++,
    Owner: owner,
    OwnerSID: sid,
    Created: Date(),
    Polls: new Array(),
    Status: exports.Status.VISIBLE,
    CurrentPoll: -1
  };
}

/*
 * creates a poll
 */
function _createPoll(courseID, type) {
  return {
    ID: nextPollID++,
    CourseID: courseID,
    Type: type,
    Stats: clone(exports.StatTyps[type]),
    Status: exports.Status.VISIBLE,
    Active: exports.Activity.ACTIVE,
    Question: null,
    Answers: null
  };
}

/*
 * creates a user
 */
function _createUser(nick, name, pass, mail) {
  return {
    ID: nextUserID++,
    Nick: nick,
    Name: name,
    Pass: pass,
    Mail: mail,
    SID: null
  };
}

/*
 * create random password
 */
function _createPassword() {
  // random number and timestamp as "seed"
  return Math.floor((new Date()).getTime() * Math.random()).toString(16);
}

/*
 * remove poll from its course
 */
function _removePollFromCourse(course, pollID) {
  var tmp = [];
  for(var i = 0; i < course.Polls.length; ++i) {
    if(course.Polls[i] != pollID) {
      tmp.push(course.Polls[i]);
    } else {
      if(course.CurrentPoll >= i) {
        course.CurrentPoll--;
      }
    }
  }
  course.Polls = tmp;
  return course;
}



/*** course/poll functions ***/



/*
 *  create a new course
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.createCourse = function(owner, sid, callback) {
    // create new course
    var result = _createCourse(owner, sid);

    // write in course list
    exports.courses[result.ID] = result;
    if(owner != null) {
      if (!(owner in exports.coursesByOwner)) {
        exports.coursesByOwner[owner] = [];
      }
      exports.coursesByOwner[owner].push(result.ID);
    }
    if(sid != null) {
      if (!(sid in exports.coursesBySID)) {
        exports.coursesBySID[sid] = [];
      }
      exports.coursesBySID[sid].push(result.ID);
    }

    // save to disk
    __quicksave(DataType.COURSE, result);

    // return result
    if(typeof callback == 'function') {
      callback(result);
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.createCourse = function(owner, sid, callback) {
    // create new course
    var result = _createCourse(owner, sid);

    // save result
    exports._client.collection('course', function(err, collection) {
      collection.insert(result, {safe: true}, function() {
        // return result
        if(typeof callback == 'function') {
          callback(result);
        }
      });
    });
  };
};


/*
 * given a course object, its representation will
 * be changed in course list
 *
 * returns written object
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.changeCourse = function(course, callback) {
    if (!(course.ID in exports.courses)) {
      callback(null);
      return; // no course to change
    }

    // get original
    var origin = exports.courses[course.ID];

    // generic copy values
    for(k in course){
      origin[k] = course[k];
    }
    // copy values
    /*
    origin.Polls = course.Polls;
    origin.Status = course.Status;
    origin.CurrentPoll = course.CurrentPoll;
    */

    // write back
    exports.courses[course.ID] = origin;

    // save to disk
    __quicksave(DataType.COURSE, origin);

    // return written object
    if(typeof callback == 'function') {
      callback(origin);
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.changeCourse = function(course, callback) {
    exports._client.collection('course', function(err, collection) {
      collection.find({'ID': course.ID}).toArray(function(err, queryResult) {
        if(queryResult.length == 0) {
          // no course to change
          if(typeof callback == 'function') {
            callback(null);
          }
          return;
        }

        // get original
        var orig = queryResult[0];

        // copy values
        orig.Polls = course.Polls;
        orig.Status = course.Status;
        origin.CurrentPoll = course.CurrentPoll;

        // write back
        collection.update({'_id': orig._id}, orig, {safe: true});

        // clean object
        delete orig._id;

        // return result
        if(typeof callback == 'function') {
          callback(orig);
        }
      });
    });
  };
};

/*
 * deletes a given course and all its polls
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.deleteCourse = function(courseID, callback) {
    if(courseID in exports.courses) { // skip, if course does not exist
      // get course
      var course = exports.courses[courseID];
      // delete polls
      for(var i = 0; i < course.Polls.length; ++i) {
        delete (exports.polls[course.Polls[i]]);
      }

      // save changes
      __quicksave(DataType.DELCOURSE, course);

      // remove from cache
      if(course.Owner != null) {
        var tmp = [];
        var list = exports.coursesByOwner[course.Owner];
        for(var i = 0; i < list.length; ++i) {
          if(list[i] != course.ID) {
            tmp.push(list[i]);
          }
        }
        if(tmp.length == 0) {
          delete (exports.coursesByOwner[course.Owner]);
        } else {
          exports.coursesByOwner[course.Owner] = tmp;
        }
      }
      if(course.OwnerSID != null) {
        var tmp = [];
        var list = exports.coursesBySID[course.OwnerSID];
        for(var i = 0; i < list.length; ++i) {
          if(list[i] != course.ID) {
            tmp.push(list[i]);
          }
        }
        if(tmp.length == 0) {
          delete (exports.coursesBySID[course.OwnerSID]);
        } else {
          exports.coursesBySID[course.OwnerSID] = tmp;
        }
      }

      // delete course
      delete exports.courses[courseID];
    }

    // return
    if(typeof callback == 'function') {
      callback();
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.deleteCourse = function(courseID, callback) {
    exports._client.collection('course', function(err, collection) {
      collection.find({'ID': courseID}).nextObject(function(err, course) {
        if(course != null) {
          exports._client.collection('poll', function(err, coll) {
            // remove polls from poll list
            for(var i = 0; i < course.Polls.length; ++i) {
              coll.findAndModify({'ID': course.Polls[i]}, [], {}, {remove: true}, function(){});
            }

            // delete course
            collection.findAndModify({'ID': courseID}, [], {}, {remove: true}, function(err, object) {
              // return
              if(typeof callback == 'function') {
                callback();
              }
            });
          });
        } else {
          // return
          if(typeof callback == 'function') {
            callback();
          }
        }
      });
    });
  };
};

/*
 * clones a course and all of its polls; returns resulting course
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.cloneCourse = function(courseID, callback) {
    var result = null;

    if(courseID in exports.courses) {
      // get original course
      var course = exports.courses[courseID];
      // create result (i.e. get ID)
      result = _createCourse(course.Owner, course.OwnerSID);
      // copy data
      result.Name = course.Name;
      result.Created = course.Created;
      result.Status = course.Status;
      result.CurrentPoll = course.CurrentPoll;

      // copy polls
      for(var i = 0; i < course.Polls.length; ++i) {
        // get origin
        var poll = exports.polls[course.Polls[i]];
        // create new poll
        var newPoll = _createPoll(result.ID, poll.Type);
        // copy values
        newPoll.Stats = clone(poll.Stats);
        newPoll.Status = poll.Status;
        newPoll.Active = poll.Active;
        newPoll.Question = clone(poll.Question);
        newPoll.Answers = clone(poll.Answers);
        // add to course
        result.Polls.push(newPoll.ID);
        // save poll
        exports.polls[newPoll.ID] = newPoll;
        __quicksave(DataType.POLL, newPoll);
      }

      // write to cache
      if(course.Owner != null) {
        exports.coursesByOwner[course.Owner].push(result.ID);
      }
      if(course.OwnerSID != null) {
        exports.coursesBySID[course.OwnerSID].push(result.ID);
      }

      // save course
      exports.courses[result.ID] = result;
      __quicksave(DataType.COURSE, result);
    }

    // return result
    if(typeof callback == 'function') {
      callback(result);
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.cloneCourse = function(courseID, callback) {
    exports._client.collection('course', function(err, coll1) {
      coll1.find({'ID': courseID}).nextObject(function(err, course) {
        if(course != null) {
          exports._client.collection('poll', function(err, coll2) {
            // create new course
            var result = _createCourse(course.Owner, course.OwnerSID);
            // copy data
            result.Name = course.Name;
            result.Created = course.Created;
            result.Status = course.Status;
            result.CurrentPoll = course.CurrentPoll;
            // copy polls
            copypoll = function(i) {
              return function() {
                if(i == course.Polls.length) {
                  // insert resulting course
                  coll1.insert(result, {safe: true}, function() {
                    // return result
                    if(typeof callback == 'function') {
                      callback(result);
                    }
                  });
                } else {
                  // create new poll
                  var newPoll = _createPoll(null, null); // only need the ID
                  result.Polls.push(newPoll.ID);
                  // find original poll
                  coll2.find({'ID': course.Polls[i]}).nextObject(function(err, poll) {
                    // delete mongoDB internal id
                    delete (poll._id);
                    // overwrite ID and courseID
                    poll.ID = newPoll.ID;
                    poll.CourseID = result.ID;
                    // insert as new poll
                    coll2.insert(poll, {safe: true}, copypoll(i+1));
                  });
                };
              };
            };
            copypoll(0)();
          });
        } else {
          // return result
          if(typeof callback == 'function') {
            callback(null);
          }
        }
      });
    });
  };
};

/*
 * resets OwnerSID of the given course and sets its Owner
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.setCourseOwner = function(courseID, owner, callback) {
    if(courseID in exports.courses) {
      // get course
      var course = exports.courses[courseID];

      // remove from cache
      if(course.Owner != null) {
        var tmp = [];
        var list = exports.coursesByOwner[course.Owner];
        for(var i = 0; i < list.length; ++i) {
          if(list[i] != course.ID) {
            tmp.push(list[i]);
          }
        }
        if(tmp.length == 0) {
          delete (exports.coursesByOwner[course.Owner]);
        } else {
          exports.coursesByOwner[course.Owner] = tmp;
        }
      }
      if(course.OwnerSID != null) {
        var tmp = [];
        var list = exports.coursesBySID[course.OwnerSID];
        for(var i = 0; i < list.length; ++i) {
          if(list[i] != course.ID) {
            tmp.push(list[i]);
          }
        }
        if(tmp.length == 0) {
          delete (exports.coursesBySID[course.OwnerSID]);
        } else {
          exports.coursesBySID[course.OwnerSID] = tmp;
        }
        // remove SID
        course.OwnerSID = null;
      }

      // set owner
      course.Owner = owner;

      // write to cache
      if(!(owner in exports.coursesByOwner)) {
        exports.coursesByOwner[owner] = [];
      }
      exports.coursesByOwner[owner].push(course.ID);

      // write back
      exports.courses[courseID] = course;
      __quicksave(DataType.COURSE, course);
    }
    // return
    if(typeof callback == 'function') {
      callback();
    }
  }
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.setCourseOwner = function(courseID, owner, callback) {
    exports._client.collection('course', function(err, collection) {
      collection.findAndModify({'ID': courseID}, [],
                               {$set: {Owner: owner,
                                       OwnerSID: null}},
                               {safe: true},
                               function() {
                                 if(typeof callback == 'function') {
                                   callback();
                                 }
                               });
    });
  }
};

/*
 *  try to find a course by its ID
 *
 *  returns null if not found
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.findCourse = function(courseID, callback) {
    if(courseID in exports.courses) {
      if(typeof callback == 'function') {
        callback(exports.courses[courseID]);
      }
      return;
    }
    
    if(typeof callback == 'function') {
      callback(null);
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.findCourse = function(courseID, callback) {
    exports._client.collection('course', function(err, collection) {
      // get result
      collection.find({'ID': parseInt(courseID)}).toArray(function(err, result) {
        if(result.length == 0) {
          // not found
          if(typeof callback == 'function') {
            callback(null);
          }
          return;
        }

        // cleanup
        delete result[0]._id;

        // return result
        if(typeof callback == 'function') {
          callback(result[0]);
        }
      });
    });
  };
};

/*
 * this function will return a list of IDs
 * of courses owned by the given name
 * or null if the name was not found
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.findCoursesByOwner = function(owner, callback) {
    if(owner in exports.coursesByOwner) {
      if(typeof callback == 'function') {
        callback(exports.coursesByOwner[owner]);
      }
      return;
    }
    
    if(typeof callback == 'function') {
      callback(null);
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.findCoursesByOwner = function(owner, callback) {
    exports._client.collection('course', function(err, collection) {
      collection.find({'Owner': owner}).toArray(function(err, result) {
        var res = [];
        for(var i = 0; i < result.length; ++i) {
          // cleanup
          res.push(result[i].ID);
        }
        if(result.length > 0) {
          if(typeof callback == 'function') {
            callback(res);
          }
          return;
        }

        if(typeof callback == 'function') {
          callback(null);
        }
      });
    });
  };
};

/*
 * this function will return a list of IDs
 * of courses owned by the given session ID
 * or null if the ID was not found
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.findCoursesBySID = function(sid, callback) {
    if(sid in exports.coursesBySID) {
      if(typeof callback == 'function') {
        callback(exports.coursesBySID[sid]);
      }
      return;
    }
    
    if(typeof callback == 'function') {
      callback(null);
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.findCoursesBySID = function(sid, callback) {
    exports._client.collection('course', function(err, collection) {
      collection.find({'OwnerSID': sid}).toArray(function(err, result) {
        var res = [];
        for(var i = 0; i < result.length; ++i) {
          // cleanup
          res.push(result[i].ID);
        }
        if(result.length > 0) {
          if(typeof callback == 'function') {
            callback(res);
          }
          return;
        }

        if(typeof callback == 'function') {
          callback(null);
        }
      });
    });
  };
};

/*
 * gets the current status of a course
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.getCourseStatus = function(courseID, callback) {
    if(!(courseID in exports.courses)) {
      // course does not exist; hence it has no status
      if(typeof callback == 'function') {
        callback(null);
      }
      return;
    }
    // return current status
    if(typeof callback == 'function') {
      callback(exports.courses[courseID].Status);
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.getCourseStatus = function(courseID, callback) {
    exports._client.collection('course', function(err, collection) {
      collection.find({'ID': parseInt(courseID)}).toArray(function(err, result) {
        if(result.length > 0) {
          if(typeof callback == 'function') {
            callback(result[0].Status);
            return;
          }
        }
        // course does not exist
        if(typeof callback == 'function') {
          callback(null);
        }
      });
    });
  };
};

/*
 * whether given user is owner of given course
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.isCourseOwner = function(courseID, user, callback) {
    if(courseID in exports.courses) {
      if(typeof callback == 'function') {
        var owner = exports.courses[courseID].Owner;
        var ownerSID = exports.courses[courseID].OwnerSID;

        if(Boolean(owner)) return callback(owner==user);
        if(Boolean(ownerSID)) return callback(ownerSID==user);
      }

    }
    // course not found
    if(typeof callback == 'function') {
      callback(null);
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.isCourseOwner = function(courseID, user, callback) {
    exports._client.collection('course', function(err, collection) {
      collection.find({'ID': parseInt(courseID)}).toArray(function(err, result) {
        if(result.length > 0) {
          if(typeof callback == 'function') {
            var owner = result[0].Owner;
            var ownerSID = result[0].OwnerSID;

            if(Boolean(owner)) return callback(owner==user);
            if(Boolean(ownerSID)) return callback(ownerSID==user);
          }
        }
        // course not found
        if(typeof callback == 'function') {
          callback(null);
        }
      });
    });
  };
};

/*
 * get current (i.e. first active) poll of a course
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.getCurrentPollOfCourse = function(courseID, callback) {

    if(courseID in exports.courses) {
      var course = exports.courses[courseID];
      if(course.Polls.length > 0) {
        if(course.CurrentPoll == -1) {
          course.CurrentPoll = course.Polls.length - 1;
          __quicksave(DataType.COURSE, course);
        }
        if(typeof callback == 'function') {
          callback(exports.polls[course.Polls[course.CurrentPoll]]);
        }
        return;
      }
    }
    // nothing found
    if(typeof callback == 'function') {
      callback(null);
    }
    return;
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.getCurrentPollOfCourse = function(courseID, callback) {
    exports._client.collection('course', function(err, collection) {
      collection.find({'ID': parseInt(courseID)}).nextObject(function(err, course) {
        if((course != null) && (course.Polls.length > 0)) {
          if(course.CurrentPoll < 0)
          {
            course.CurrentPoll = course.Polls.length - 1;
            // write back
            collection.update({'CourseID': parseInt(courseID)}, {$set: {'CurrentPoll': course.CurrentPoll}});
          }
          exports._client.collection('poll', function(err, collection2) {
            collection2.find({'ID': course.Polls[course.CurrentPoll]}).nextObject(function(err, obj) {
              if(obj != null) {
                // cleanup
                delete obj._id;
                // return result
                if(typeof callback == 'function') {
                  callback(obj);
                }
                return;
              }

              // nothing found
              if(typeof callback == 'function') {
                callback(null);
              }
              return;
            });
          });
        } else {
          // nothing found
          if(typeof callback == 'function') {
            callback(null);
          }
          return;
        }
      });
    });
  };
};

/*
 * close current (i.e. first active) poll of a course
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.closeCurrentPollOfCourse = function(courseID, callback) {
    // get poll
    exports.getCurrentPollOfCourse(courseID, function(p) {
      if(p != null) { // if poll found
        // close poll
        p.Active = exports.Activity.INACTIVE;
        // write back
        exports.polls[p.ID] = p;
        __quicksave(DataType.POLL, p);
      }
  
      if(typeof callback == 'function') {
        callback(p);
      }
      return;
    });
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.closeCurrentPollOfCourse = function(courseID, callback) {
    // get poll
    exports.getCurrentPollOfCourse(courseID, function(p) {
      if(p != null) { // poll found
        // write result
        exports._client.collection('poll', function(err, collection) {
          collection.findAndModify({'ID': p.ID}, [],
                                   {$set: {'Active': exports.Activity.INACTIVE}},
                                   {safe: true},
                                   function(err, poll){
                                     // cleanup
                                     if(poll != null) {
                                       delete (poll._id);
                                     }
                                     if(typeof callback == 'function') {
                                       callback(poll);
                                     }
                                   });
        });
      } else {
        if(typeof callback == 'function') {
          callback(null);
        }
      }
    });
  };
};

/*
 * store results (i.e. stats) of the current poll of a course
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.storeResultOfCurrentPoll = function(courseID, result, callback) {
    // get poll
    exports.getCurrentPollOfCourse(courseID, function(poll) {
      if(poll != null) {
        // store result
        poll.Stats = result;
        // write back
        exports.polls[poll.ID] = poll;
        __quicksave(DataType.POLL, poll);
      }

      if(typeof callback == 'function') {
        callback();
      }
    });
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.storeResultOfCurrentPoll = function(courseID, result, callback) {
    // get poll
    exports.getCurrentPollOfCourse(courseID, function(p) {
      if(p != null) { // poll found
        // write result
        exports._client.collection('poll', function(err, collection) {
          collection.update({
            'ID': p.ID
          }, {$set: {
            'Stats': result
          }}, {safe: true});
        });
      }

      if(typeof callback == 'function') {
        callback();
      }
    });
  };
};

/*
 * resets results from all polls of given course
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.resetPollsOfCourse = function(courseID, callback) {
    if(courseID in exports.courses) {
      // get course
      var course = exports.courses[courseID];

      // iterate over all polls
      for(var i = 0; i < course.Polls.length; ++i) {
        // get poll
        var poll = exports.polls[course.Polls[i]];

        // reset stats
        poll.Stats = clone(exports.StatTyps[poll.Type]);

        // write back
        exports.polls[poll.ID] = poll;
        __quicksave(DataType.POLL, poll);
      }
    }

    // return
    if(typeof callback == 'function') {
      callback();
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.resetPollsOfCourse = function(courseID, callback) {
    exports._client.collection('poll', function(err, collection) {
      collection.find({'CourseID': courseID}).toArray(function(err, polls) {
        resetpolls = function(i) {
          return function() {
            if(i == polls.length) {
              // return
              if(typeof callback == 'function') {
                callback();
              }
            } else {
              collection.findAndModify({'ID': polls[i].ID}, [],
                                       {$set: {'Stats': exports.StatTyps[polls[i].Type]}},
                                       {safe: true},
                                       resetpolls(i+1));
            }
          };
        }
        resetpolls(0)();
      });
    });
  };
};



/*
 * moves 'current' pointer to next poll in course
 *
 * When priviously current poll was already the last one
 * the first poll will now be the current one.
 * This 'overflow' will be marked by setting the boolean
 * value in the callback function to 'true'.
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.navToNextPoll = function(courseID, callback) {
    if(courseID in exports.courses) {
      var course = exports.courses[courseID];
      if(course.Polls.length > 0) {
        var overflow = false;
        if(++course.CurrentPoll >= course.Polls.length) {
          course.CurrentPoll = 0;
          overflow = true;
        }

        // write back
        __quicksave(DataType.COURSE, course);

        // return result
        if(typeof callback == 'function') {
          callback(exports.polls[course.Polls[course.CurrentPoll]], overflow);
        }
        return;
      }
    }

    if(typeof callback == 'function') {
      callback(null, false);
    }
  }
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.navToNextPoll = function(courseID, callback) {
    // get course
    exports._client.collection('course', function(err, collection) {
      collection.find({'ID': courseID}).nextObject(function(err, course) {
        if((course == null) || (course.Polls.length == 0)) {
          if(typeof callback == 'function') {
            callback(null, false); // no poll to return
          }
          return;
        }

        // increment index
        var i = parseInt(course.CurrentPoll) + 1;

        // overflow
        if(i >= course.Polls.length) {
          i = 0;
        }

        // write back
        collection.update({'_id': course._id}, {$set: {CurrentPoll: i}}, {safe: true});

        // return poll
        exports._client.collection('poll', function(err, col) {
          col.find({'ID': course.Polls[i]}).nextObject(function(err, poll) {
            // cleanup
            if(poll != null) {
              delete (poll._id);
            }

            // return
            if(typeof callback == 'function') {
              callback(poll, (i == 0));
            }
          });
        });
      });
    });
  }
};

/*
 * moves 'current' pointer to previous poll in course
 *
 * When priviously current poll was already the first one
 * the last poll will now be the current one.
 * This 'overflow' will be marked by setting the boolean
 * value in the callback function to 'true'.
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.navToPreviousPoll = function(courseID, callback) {
    if(courseID in exports.courses) {
      var course = exports.courses[courseID];
      if(course.Polls.length > 0) {
        var overflow = false;
        if(--course.CurrentPoll < 0) {
          course.CurrentPoll = course.Polls.length - 1;
          overflow = true;
        }

        // write back
        __quicksave(DataType.COURSE, course);

        // return result
        if(typeof callback == 'function') {
          callback(exports.polls[course.Polls[course.CurrentPoll]], overflow);
        }
        return;
      }
    }

    if(typeof callback == 'function') {
      callback(null, false);
    }
  }
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.navToPreviousPoll = function(courseID, callback) {
    // get course
    exports._client.collection('course', function(err, collection) {
      collection.find({'ID': courseID}).nextObject(function(err, course) {
        if((course == null) || (course.Polls.length == 0)) {
          if(typeof callback == 'function') {
            callback(null, false); // no poll to return
          }
          return;
        }

        // decrement index
        var i = parseInt(course.CurrentPoll) - 1;

        // overflow
        if(i < 0) {
          i = course.Polls.length - 1;
        }

        // write back
        collection.update({'_id': course._id}, {$set: {CurrentPoll: i}}, {safe: true});

        // return poll
        exports._client.collection('poll', function(err, col) {
          col.find({'ID': course.Polls[i]}).nextObject(function(err, poll) {
            // cleanup
            if(poll != null) {
              delete (poll._id);
            }

            // return
            if(typeof callback == 'function') {
              callback(poll, (i == course.Polls.length - 1));
            }
          });
        });
      });
    });
  }
};

/*
 * moves 'current' pointer to first poll in course
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.navToFirstPoll = function(courseID, callback) {
    if(courseID in exports.courses) {
      var course = exports.courses[courseID];
      if(course.Polls.length > 0) {        
        course.CurrentPoll = 0;

        // write back
        __quicksave(DataType.COURSE, course);

        // return result
        if(typeof callback == 'function') {
          callback(exports.polls[course.Polls[course.CurrentPoll]]);
        }
        return;
      }
    }

    if(typeof callback == 'function') {
      callback(null, false);
    }
  }
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.navToFirstPoll = function(courseID, callback) {
    // get course
    exports._client.collection('course', function(err, collection) {
      collection.find({'ID': courseID}).nextObject(function(err, course) {
        if((course == null) || (course.Polls.length == 0)) {
          if(typeof callback == 'function') {
            callback(null); // no poll to return
          }
          return;
        }

        // write back
        collection.update({'_id': course._id}, {$set: {CurrentPoll: 0}}, {safe: true});

        // return poll
        exports._client.collection('poll', function(err, col) {
          col.find({'ID': course.Polls[0]}).nextObject(function(err, poll) {
            // cleanup
            if(poll != null) {
              delete (poll._id);
            }

            // return
            if(typeof callback == 'function') {
              callback(poll);
            }
          });
        });
      });
    });
  }
};

/*
 * moves 'current' pointer to last poll in course
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.navToLastPoll = function(courseID, callback) {
    if(courseID in exports.courses) {
      var course = exports.courses[courseID];
      if(course.Polls.length > 0) {        
        course.CurrentPoll = course.Polls.length - 1;

        // write back
        __quicksave(DataType.COURSE, course);

        // return result
        if(typeof callback == 'function') {
          callback(exports.polls[course.Polls[course.CurrentPoll]]);
        }
        return;
      }
    }

    if(typeof callback == 'function') {
      callback(null, false);
    }
  }
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.navToLastPoll = function(courseID, callback) {
    // get course
    exports._client.collection('course', function(err, collection) {
      collection.find({'ID': courseID}).nextObject(function(err, course) {
        if((course == null) || (course.Polls.length == 0)) {
          if(typeof callback == 'function') {
            callback(null); // no poll to return
          }
          return;
        }

        // set index
        var i = course.Polls.length - 1;

        // write back
        collection.update({'_id': course._id}, {$set: {CurrentPoll: i}}, {safe: true});

        // return poll
        exports._client.collection('poll', function(err, col) {
          col.find({'ID': course.Polls[i]}).nextObject(function(err, poll) {
            // cleanup
            if(poll != null) {
              delete (poll._id);
            }

            // return
            if(typeof callback == 'function') {
              callback(poll);
            }
          });
        });
      });
    });
  }
};

/*
 * checks whether the given poll is the last poll of the given course
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.isLastPoll = function(courseID, pollID, callback) {
    if(courseID in exports.courses) {
      var course = exports.courses[courseID];
      if(typeof callback == 'function') {
        callback((course.Polls.length > 0) && (course.Polls[course.Polls.length - 1] == pollID));
      }
      return;
    }
    if(typeof callback == 'function') {
      callback(false);
    }
  }
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.isLastPoll = function(courseID, pollID, callback) {
    // get course
    exports._client.collection('course', function(err, collection) {
      collection.find({'ID': courseID}).nextObject(function(err, course) {
        if((course == null) || (course.Polls.length == 0)) {
          if(typeof callback == 'function') {
            callback(false); // no poll to compare
          }
          return;
        }

        // return result
        if(typeof callback == 'function') {
          callback(course.Polls[course.Polls.length - 1] == parseInt(pollID));
        }
      });
    });
  }
};

/*
 * checks whether the given poll is the last poll of the given course
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.navToPoll = function(courseID, pollID, callback) {
    if(courseID in exports.courses) {
      var course = exports.courses[courseID];
      for(var i = 0; i < course.Polls.length; ++i) {
        if(course.Polls[i] == pollID) {
          exports.courses[courseID].CurrentPoll = i;
          // write back
          __quicksave(DataType.COURSE, exports.courses[courseID]);
          callback(exports.polls[course.Polls[i]]);
          return;
        }
      }
    }
    if(typeof callback == 'function') {
      callback(null);
    }
  }
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.navToPoll = function(courseID, pollID, callback) {
    // get course
    exports._client.collection('course', function(err, collection) {
      collection.find({'ID': courseID}).nextObject(function(err, course) {
        if((course == null) || (course.Polls.length == 0)) {
          if(typeof callback == 'function') {
            callback(null); // no poll to return
          }
          return;
        }

        // find poll
        var i = course.Polls.indexOf(parseInt(pollID));
        if(i < 0) {
          if(typeof callback == 'function') {
            callback(null); // no poll to return
          }
          return;
        }

        // write back
        collection.update({'_id': course._id}, {$set: {CurrentPoll: i}}, {safe: true});

        // return poll
        exports._client.collection('poll', function(err, col) {
          col.find({'ID': course.Polls[i]}).nextObject(function(err, poll) {
            // cleanup
            if(poll != null) {
              delete (poll._id);
            }

            // return
            if(typeof callback == 'function') {
              callback(poll);
            }
          });
        });
      });
    });
  }
};





/*
 * create a new poll
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.createPoll = function(courseID, type, callback) {
    exports.findCourse(courseID, function(course) {
      if(course == null) {
        // no course, no new poll!
        if(typeof callback == 'function') {
          callback(null);
        }
        return;
      }

      // create result
      var result = _createPoll(courseID, type);

      // write (back)
      exports.polls[result.ID] = result;
      course.Polls.push(0);
      course.CurrentPoll++;
      for(var i = course.Polls.length - 1; i > course.CurrentPoll; --i) {
        course.Polls[i] = course.Polls[i - 1];
      }
      course.Polls[course.CurrentPoll] = result.ID;
      exports.courses[course.ID] = course;

      // save to disk
      __quicksave(DataType.POLL, result);
      __quicksave(DataType.COURSE, course);

      // return result
      if(typeof callback == 'function') {
        callback(result);
      }
    });
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.createPoll = function(courseID, type, callback) {
    exports._client.collection('course', function(err, collection) {
      // search course
      collection.find({'ID': parseInt(courseID)}).toArray(function(err, courses) {
        if(courses.length == 0) {
          // course not found
          if(typeof callback == 'function') {
            callback(null);
          }
          return;
        }

        // create poll
        var result = _createPoll(courseID, type);

        // write data
        courses[0].Polls.push(0);
        courses[0].CurrentPoll++;
        for(var i = courses[0].Polls.length - 1; i > courses[0].CurrentPoll; --i) {
          courses[0].Polls[i] = courses[0].Polls[i - 1];
        }
        courses[0].Polls[courses[0].CurrentPoll] = result.ID;
        exports._client.collection('poll', function(err, coll) {
          coll.insert(result, {safe: true});
        });
        collection.update({'_id': courses[0]._id}, courses[0], {safe: true});

        // return result
        if(typeof callback == 'function') {
          callback(result);
        }
      });
    });
  };
};

/*
 * given a poll its representation will
 * be changed in poll list
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.changePoll = function(poll, callback) {
    if (!(poll.ID in exports.polls)) {
      if(typeof callback == 'function') {
        callback(null); // no poll, no change
      }
      return;
    }

    // get original
    // (this steps shoul be equivalent to the
    // change data step in changeCourse but
    // is omitted since _all_ data will be changed
    // so simply the given poll will be written
    // in poll list)

    // change data (see above)

    // write back (see above)
    exports.polls[poll.ID] = poll;

    // save to disk
    __quicksave(DataType.POLL, poll);

    // return written object
    if(typeof callback == 'function') {
      callback(poll);
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.changePoll = function(poll, callback) {
    exports._client.collection('poll', function(err, collection) {
      collection.find({'ID': poll.ID}).toArray(function(err, polls) {
        if(polls.length == 0) {
          // no original poll found
          if(typeof callback == 'function') {
            callback(null);
          }
          return;
        }

        // write data
        collection.update({'ID': poll.ID}, {$set: {
          Type: poll.Type,
          Stats: poll.Stats,
          Status: poll.Status,
          Active: poll.Active
        }}, {safe: true});

        // return result
        if(typeof callback == 'function') {
          callback(poll);
        }
      });
    });
  };
};


/*
 * deletes poll with given ID (if poll does not exist nothing will be done)
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.deletePoll = function(pollID, callback) {
    var poll = exports.polls[pollID];
    if(poll != null) {
      // remove poll from its course
      var course = exports.courses[poll.CourseID];
      course = _removePollFromCourse(course, pollID);

      // write back
      exports.courses[course.ID] = course;

      // save to disk
      __quicksave(DataType.COURSE, course);
    }

    // remove from global poll list
    delete(exports.polls[pollID]);

    // delete from disk
    __quicksave(DataType.DELPOLL, {'ID': pollID});

    // callback
    if(typeof callback == 'function') {
      callback();
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.deletePoll = function(pollID, callback) {
    exports._client.collection('poll', function(err, collection) {
      collection.find({'ID': pollID}).toArray(function(err, polls) {
        if(polls.length > 0) {
          // remove poll from its course
          exports._client.collection('course', function(err, collection2) {
            collection2.find({'ID': polls[0].CourseID}).toArray(function(err, courses) {
              if(courses.length > 0) {
                var course = _removePollFromCourse(courses[0], pollID);
                collection2.findAndModify({'ID': course.ID}, [],
                                          {$set: {
                                                   Polls: course.Polls,
                                                   CurrentPoll: course.CurrentPoll
                                                 }},
                                          {safe: true},
                                          function() {
                                            // remove poll from poll list
                                            collection.findAndModify({'ID': pollID}, [],{}, {remove: true},
                                              function(err, object) {
                                                if(typeof callback == 'function') {
                                                  callback();
                                                }
                                              });
                                          });
              } else {
                // remove poll from poll list
                collection.findAndModify({'ID': pollID}, [],{}, {remove: true},
                  function(err, object) {
                    if(typeof callback == 'function') {
                      callback();
                    }
                  });
              }
            });
          });
        } else {
          if(typeof callback == 'function') {
            callback();
          }
        }
      });
    });
  };
};

/*
 * try to find a poll by its ID
 *
 * returns null if not found
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.findPoll = function(pollID, callback) {
    if(pollID in exports.polls) {
      if(typeof callback == 'function') {
        callback(exports.polls[pollID]);
      }
    } else {
      if(typeof callback == 'function') {
        callback(null);
      }
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.findPoll = function(pollID, callback) {
    exports._client.collection('poll', function(err, collection) {
      collection.find({'ID': parseInt(pollID)}).toArray(function(err, result) {
        if(result.length > 0) {
          // cleanup
          delete result[0]._id;
  
          // return result
          if(typeof callback == 'function') {
            callback(result[0]);
          }
        } else {
          // nothing found
          if(typeof callback == 'function') {
            callback(null);
          }
        }
      });
    });
  };
};

/*
 * gets the current visibility of a poll
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.getPollVisibility = function(pollID, callback) {
    if(!(pollID in exports.polls)) {
      if(typeof callback == 'function') {
        callback(null);
      } // poll does not exist; hence it has no status
      return;
    }
    // return current status
    if(typeof callback == 'function') {
      callback(exports.polls[pollID].Status);
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.getPollVisibility = function(pollID, callback) {
    exports.findPoll(pollID, function(poll) {
      if(poll != null) {
        // return result
        if(typeof callback == 'function') {
          callback(poll.Status);
        }
      } else {
        // poll not found
        if(typeof callback == 'function') {
          callback(null);
        }
      }
    });
  };
};

/*
 * gets the current activity-status of a poll
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.getPollActivity = function(pollID, callback) {

    if(!(pollID in exports.polls)) {
      if(typeof callback == 'function') {
        callback(null); // poll does not exist; hence it has no status
      }
      return;
    }
    // return current activity-status
    if(typeof callback == 'function') {
      callback(exports.polls[pollID].Active);
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.getPollActivity = function(pollID, callback) {
    exports.findPoll(pollID, function(poll) {
      if(poll != null) {
        // return result
        if(typeof callback == 'function') {
          callback(poll.Active);
        }
      } else {
        // poll not found
        if(typeof callback == 'function') {
          callback(null);
        }
      }
      return;
    });
  };
};



/*
 * whether given user is owner of given poll
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.isPollOwner = function(pollID, user, callback) {
    if(pollID in exports.polls) {
      if(typeof callback == 'function') {
        callback(exports.courses[exports.polls[pollID].CourseID].Owner == user);
      }
    } else {
      // poll not found
      if(typeof callback == 'function') {
        callback(null);
      }
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.isPollOwner = function(pollID, user, callback) {
    if(typeof callback != 'function') {
      return; // skip this
    }
    exports._client.collection('course', function(err, collection) {
      collection.find({'Polls': parseInt(pollID)}).count(function(err, count) {
        if(count == 0) {
          // poll not found
          callback(null);
          return;
        }
        // actual owner check
        collection.find({'Owner': user, 'Polls': parseInt(pollID)}).count(function(err, count2) {
          callback(count2 > 0);
        });
      });
    });
  };
};

/*
 * whether given user is owner of given poll
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.isPollOwnerBySID = function(pollID, sid, callback) {
    if(pollID in exports.polls) {
      if(typeof callback == 'function') {
        callback(exports.courses[exports.polls[pollID].CourseID].OwnerSID == sid);
      }
    } else {
      // poll not found
      if(typeof callback == 'function') {
        callback(null);
      }
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.isPollOwnerBySID = function(pollID, sid, callback) {
    if(typeof callback != 'function') {
      return; // skip this
    }
    exports._client.collection('course', function(err, collection) {
      collection.find({'Polls': parseInt(pollID)}).count(function(err, count) {
        if(count == 0) {
          // poll not found
          callback(null);
          return;
        }
        // actual owner check
        collection.find({'OwnerSID': sid, 'Polls': parseInt(pollID)}).count(function(err, count2) {
          callback(count2 > 0);
        });
      });
    });
  };
};


/*
 * set a poll question
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.setQuestion = function(pollID, question, callback) {
    if(pollID in exports.polls) {
      // write question
      var poll = exports.polls[pollID];
      poll.Question = question;

      // write back
      exports.polls[pollID] = poll;
      __quicksave(DataType.POLL, poll);

      // return result
      if(typeof callback == 'function') {
        callback(true);
      }
      return;
    }

    if(typeof callback == 'function') {
      callback(false);
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.setQuestion = function(pollID, question, callback) {
    exports.findPoll(pollID, function(poll) {
      if(poll == null) {
        if(typeof callback == 'function') {
          callback(false);
        }
        return;
      }
      exports._client.collection('poll', function(err, collection) {
        collection.update({'ID': pollID}, {$set: {
          Question: question
        }}, {safe: true}, function(err) {
          if(typeof callback == 'function') {
            callback(err == null);
          }
        });
      });
    });
  };
};


/*
 * get a question of a poll
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.getQuestion = function(pollID, callback) {
    if(pollID in exports.polls) {
      if(typeof callback == 'function') {
        callback(exports.polls[pollID].Question);
      }
      return;
    }
    if(typeof callback == 'function') {
      callback(null);
    }
  }
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.getQuestion = function(pollID, callback) {
    exports.findPoll(pollID, function(poll) {
      if(poll == null) {
        if(typeof callback == 'function') {
          callback(null);
        }
        return;
      }
      if(typeof callback == 'function') {
        callback(poll.Question);
      }
    });
  };
};


/*
 * set poll answers
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.setAnswers = function(pollID, answers, callback) {
    if(pollID in exports.polls) {
      // write question
      var poll = exports.polls[pollID];
      poll.Answers = answers;

      // write back
      exports.polls[pollID] = poll;
      __quicksave(DataType.POLL, poll);

      // return result
      if(typeof callback == 'function') {
        callback(true);
      }
      return;
    }

    if(typeof callback == 'function') {
      callback(false);
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.setAnswers = function(pollID, answers, callback) {
    exports.findPoll(pollID, function(poll) {
      if(poll == null) {
        if(typeof callback == 'function') {
          callback(false);
        }
        return;
      }
      exports._client.collection('poll', function(err, collection) {
        collection.update({'ID': pollID}, {$set: {
          Answers: answers
        }}, {safe: true}, function(err) {
          if(typeof callback == 'function') {
            callback(err == null);
          }
        });
      });
    });
  };
};


/*
 * get answers of poll
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.getAnswers = function(pollID, callback) {
    if(pollID in exports.polls) {
      if(typeof callback == 'function') {
        callback(exports.polls[pollID].Answers);
      }
      return;
    }
    if(typeof callback == 'function') {
      callback(null);
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.getAnswers = function(pollID, callback) {
    exports.findPoll(pollID, function(poll) {
      if(poll == null) {
        if(typeof callback == 'function') {
          callback(null);
        }
        return;
      }
      if(typeof callback == 'function') {
        callback(poll.Answers);
      }
    });
  };
};




/*** user functions ***/



/*
 * gets a new unique session ID
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.getSessionID = function(callback) {
    // random number an timestamp as "seed"
    var seed = Math.floor((new Date()).getTime() * Math.random());
    var result = null;

    // try to find unique ID
    while(result == null) {
      // convert to hex and increment for next iteration
      result = (seed++).toString(16);

      if(result in sessionIDs) {
        // ID already exists; try again
        result = null;
      }
    }

    // save ID
    sessionIDs.push(result);
    __quicksave(DataType.SESSIONID, result);

    // return ID
    if(typeof callback == 'function') {
      callback(result);
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.getSessionID = function(callback) {
    exports._client.collection('session', function(err, collection) {
      // random number an timestamp as "seed"
      var seed = Math.floor((new Date()).getTime() * Math.random());
      var result = null;

      // try to find unique ID
      while(result == null) {
        // convert to hex and increment for next iteration
        result = (seed++).toString(16);

        if(collection.find({'ID': result}).count() > 0) {
          // ID already exists; try again
          result = null;
        }
      }

      // save ID
      collection.insert({'ID': result}, {safe: true});

      // return ID
      if(typeof callback == 'function') {
        callback(result);
      }
    });
  };
};






/*
 * creates a new user
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  /*
   * TODO: Check for existing names atm in O(n).
   *       Add additional cache to reduce to O(log n) or O(1)
   *       (depending on performance of JS dictionary lookups).
   */
  exports.createUser = function(nick, name, pass, mail, callback) {
    // check for existing user name
    var user = null;
    for(var i in exports.users) {
      if(exports.users[i].Nick == nick) {
        user = exports.users[i];
        break;
      }
    }

    if(user == null) {
      // create user
      user = _createUser(nick, name, pass, mail);

      // store user
      exports.users[user.ID] = user;
      __quicksave(DataType.USER, user);

      // return user ID
      if(typeof callback == 'function') {
        callback(user.ID);
      }
    } else {
      // return null
      if(typeof callback == 'function') {
        callback(null);
      }
    }
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.createUser = function(nick, name, pass, mail, callback) {
    // get collection
    exports._client.collection('user', function(err, collection) {
      // look for existing user
      collection.find({'Nick': nick}).toArray(function(err, result) {
        if((err == null) && (result.length == 0)) {
          // create user
          var user = _createUser(nick, name, pass, mail);

          // store user
          collection.insert(user, {safe: true}, function() {
            // return user ID
            if(typeof callback == 'function') {
              callback(user.ID);
            }
          });
        } else {
          // return null
          if(typeof callback == 'function') {
            callback(null);
          }
        }
      })
    });
  };
};

/*
 * user login
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.loginUser = function(nick, pass, callback) {
    // find user
    for(var i in exports.users) {
      if(exports.users[i].Nick == nick) {
        if(pass == exports.users[i].Pass) {
          if(typeof callback == 'function') {
            callback(exports.users[i]);
          }
          return;
        }
        break;
      }
    }
    if(typeof callback == 'function') {
      callback(null);
    }
  }
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.loginUser = function(nick, pass, callback) {
    exports._client.collection('user', function(err, collection) {
      collection.find({'Nick': nick, 'Pass': pass}).toArray(function(err, result) {
        if(result.length > 0) {
          if(typeof callback == 'function') {
            callback(result[0]);
          }
        } else {
          if(typeof callback == 'function') {
            callback(null);
          }
        }
      });
    });
  }
}

/*
 * get user by ID
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.getUser = function(uid, callback) {
    if(uid in exports.users) {
      if(typeof callback == 'function') {
        callback(exports.users[uid]);
      }
      return;
    }
    if(typeof callback == 'function') {
      callback(null);
    }
  }
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.getUser = function(uid, callback) {
    exports._client.collection('user', function(err, collection) {
      collection.find({'ID': parseInt(uid)}).toArray(function(err, result) {
        if(result.length > 0) {
          // cleanup
          delete result[0]._id;
  
          // return result
          if(typeof callback == 'function') {
            callback(result[0]);
          }
        } else {
          // nothing found
          if(typeof callback == 'function') {
            callback(null);
          }
        }
      });
    });
  }
}

/*
 * set user password
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.setUserPassword = function(uid, oldPass, newPass, callback) {
    // get user
    exports.getUser(uid, function(user) {
      if((user != null) &&(user.Pass == oldPass)) {
        // set new password
        user.Pass = newPass;

        // write back
        exports.users[user.ID] = user;
        __quicksave(DataType.USER, user);

        // return result
        if(typeof callback == 'function') {
          callback(true);
        }
        return;
      }
      // could not set password
      if(typeof callback == 'function') {
        callback(false);
      }
    });
  };
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.setUserPassword = function(uid, oldPass, newPass, callback) {
    exports._client.collection('user', function(err, collection) {
      collection.findAndModify({'ID': uid, 'Pass': oldPass},
                               [['_id', 'asc']],
                               {$set: {Pass: newPass}},
                               {safe: true},
                               function(err, obj) {
                                 if(typeof callback == 'function') {
                                   callback((err == null) && (obj != null));
                                 }
                               });
    });
  };
};

/*
 * reset password to random string
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.resetUserPassword = function(uid, callback) {
    // find user
    if(uid in exports.users) {
      // generate password
      var user = exports.users[uid];
      user.Pass = _createPassword();

      // write back
      exports.users[uid] = user;
      __quicksave(DataType.USER, user);

      // return result
      if(typeof callback == 'function') {
        callback(user.Pass);
      }
    } else {
      // user not found
      if(typeof callback == 'function') {
        callback(null);
      }
    }
  }
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.resetUserPassword = function(uid, callback) {
    var pass = _createPassword();
    exports._client.collection('user', function(err, collection) {
      collection.findAndModify({'ID': uid},
                               [['_id', 'asc']],
                               {$set: {Pass: pass}},
                               {safe: true},
                               function(err, obj) {
        if((obj == null) || (err != null)) {
          // user not found
          if(typeof callback == 'function') {
            callback(null);
          }
        } else {
          // return result
          if(typeof callback == 'function') {
            callback(pass);
          }
        }
      });
    });
  };
};

/*
 * bind session ID to user
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.setUserSID = function(uid, sid, callback) {
    if(uid in exports.users) {
      // set SID
      var user = exports.users[uid];
      user.SID = sid;

      // write back
      exports.users[uid] = user;
      __quicksave(DataType.USER, user);
    }
    if(typeof callback == 'function') {
      // call callback
      callback();
    }
  }
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.setUserSID = function(uid, sid, callback) {
    exports._client.collection('user', function(err, collection) {
      collection.update({'ID': uid}, {$set: {SID: sid}}, {safe: true}, function(err) {
        if(typeof callback == 'function') {
          callback();
        }
      });
    });
  };
};

/*
 * find user to a given SID
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  exports.getUserBySID = function(sid, callback) {
    for(var i in exports.users) {
      if(exports.users[i].SID == sid) {
        if(typeof callback == 'function') {
          callback(i);
        }
        return;
      }
    }
    // not found
   if(typeof callback == 'function') {
     callback(null);
   }
  }
};
if(CONFIG.DATA_STORAGE == 'MONGODB') {
  exports.getUserBySID = function(sid, callback) {
    exports._client.collection('user', function(err, collection) {
      collection.find({'SID': sid}).toArray(function(err, result) {
        if(result.length > 0) {
          // return result
          if(typeof callback == 'function') {
            callback(result[0].ID);
          }
        } else {
          // nothing found
          if(typeof callback == 'function') {
            callback(null);
          }
        }
      });
    });
  }
};








/*** internal functions ***/



/*
 * funcitons to write data to their files
 */
if(CONFIG.DATA_STORAGE == 'FILE') {
  // access to file system
  var fs = require('fs');
  
  // counter to avoid writing in same file
  var fileCounter = 0;
  
  
  /*
   * loading data from disk
   */
  function __loadData() {
    // load data
    exports.courses = JSON.parse(fs.readFileSync(CONFIG.DATA_DIR + 'courses.dat', 'utf8'));
    exports.polls = JSON.parse(fs.readFileSync(CONFIG.DATA_DIR + 'polls.dat', 'utf8'));
    exports.users = JSON.parse(fs.readFileSync(CONFIG.DATA_DIR + 'users.dat', 'utf8'));
    sessionIDs = JSON.parse(fs.readFileSync(CONFIG.DATA_DIR + 'sessionIDs.dat', 'utf8'));
  
    // re-initiate counters and course cache
    nextCourseID = 0;
    nextPollID = 0;
    nextUserID = 0;
    exports.coursesByOwner = {};
  
    // set counters and fill course cache
    for(var i in exports.courses) {
      nextCourseID = Math.max(nextCourseID, i);
      var course = exports.courses[i];
      if(course.Owner != null) {
        if(!(course.Owner in exports.coursesByOwner)) {
          exports.coursesByOwner[course.Owner] = [];
        }
        exports.coursesByOwner[course.Owner].push(parseInt(i));
      }
      if(course.OwnerSID != null) {
        if(!(course.OwnerSID in exports.coursesBySID)) {
          exports.coursesBySID[course.OwnerSID] = [];
        }
        exports.coursesBySID[course.OwnerSID].push(parseInt(i));
      }
    }
    for(var i in exports.polls) {
      nextPollID = Math.max(nextPollID, i);
    }
    for(var i in exports.users) {
      nextUserID = Math.max(nextUserID, i);
    }
    ++nextPollID;
    ++nextCourseID;
    ++nextUserID;
  }
  
  /*
   * writes temporary file in data directory
   */
  function __quicksave(type, data) {
    // if no data should be saved
    if(CONFIG.SAVE_DATA == false) {
      return;
    }

    // serialize object
    var str = JSON.stringify(data);
  
    // choose directory
    var fileNumber = 1;
    var path = CONFIG.DATA_DIR + 'tmp/' + __tmpDirs[type]
             + (new Date()).getTime() + '.' + (++fileCounter);
    fileCounter = fileCounter % 10000; // avoid long numbers
  
    // open file and write content
    fs.writeFileSync(path, str);
  }
  
  /*
   * collects temporary files and updates main files
   */
  function __fullsave() {
    // only files older than this will be collected
    var limit = '' + (new Date()).getTime();
  
    // get paths
    var coursePath = CONFIG.DATA_DIR + 'courses.dat';
    var pollPath = CONFIG.DATA_DIR + 'polls.dat';
    var userPath = CONFIG.DATA_DIR + 'users.dat';
    var sessionIDPath = CONFIG.DATA_DIR + 'sessionIDs.dat';
  
    // create backup
    try {
      // try to rename
      fs.renameSync(coursePath, coursePath + '.bak');
    } catch(e) {
      // if file does not exist, create it
      fs.writeFileSync(coursePath + '.bak', JSON.stringify({}));
    }
    try {
      // try to rename
      fs.renameSync(pollPath, pollPath + '.bak');
    } catch(e) {
      // if file does not exist, create it
      fs.writeFileSync(pollPath + '.bak', JSON.stringify({}));
    }
    try {
      // try to rename
      fs.renameSync(userPath, userPath + '.bak');
    } catch(e) {
      // if file does not exist, create it
      fs.writeFileSync(userPath + '.bak', JSON.stringify({}));
    }
    try {
      // try to rename
      fs.renameSync(sessionIDPath, sessionIDPath + '.bak');
    } catch(e) {
      // if file does not exist, create it
      fs.writeFileSync(sessionIDPath + '.bak', JSON.stringify([]));
    }
  
    // read old data
    var courses = JSON.parse(fs.readFileSync(coursePath + '.bak', 'utf8'));
    var polls = JSON.parse(fs.readFileSync(pollPath + '.bak', 'utf8'));
    var users = JSON.parse(fs.readFileSync(userPath + '.bak', 'utf8'));
    var SIDs = JSON.parse(fs.readFileSync(sessionIDPath + '.bak', 'utf8'));
  
    // read updates
    var courseFiles = fs.readdirSync(CONFIG.DATA_DIR + 'tmp/courses/')
                      .filter(function(fileName) {
                        return (('0' < fileName) && (fileName <= limit));
                      });
    var pollFiles = fs.readdirSync(CONFIG.DATA_DIR + 'tmp/polls/')
                    .filter(function(fileName) {
                      return (('0' < fileName) && (fileName <= limit));
                    });
    var delPollFiles = fs.readdirSync(CONFIG.DATA_DIR + 'tmp/delpoll/')
                       .filter(function(fileName) {
                         return (('0' < fileName) && (fileName <= limit));
                       });
    var delCourseFiles = fs.readdirSync(CONFIG.DATA_DIR + 'tmp/delcourse/')
                         .filter(function(fileName) {
                           return (('0' < fileName) && (fileName <= limit));
                         });
    var userFiles = fs.readdirSync(CONFIG.DATA_DIR + 'tmp/users/')
                    .filter(function(fileName) {
                      return (('0' < fileName) && (fileName <= limit));
                    });
    var sessionIDFiles = fs.readdirSync(CONFIG.DATA_DIR + 'tmp/sessionIDs/')
                         .filter(function(fileName) {
                           return (('0' < fileName) && (fileName <= limit));
                         });
    for(var i = 0; i < courseFiles.length; ++i) {
      var course = JSON.parse(fs.readFileSync(CONFIG.DATA_DIR + 'tmp/courses/' + courseFiles[i], 'utf8'));
      courses[course.ID] = course;
    }
    for(var i = 0; i < pollFiles.length; ++i) {
      var poll = JSON.parse(fs.readFileSync(CONFIG.DATA_DIR + 'tmp/polls/' + pollFiles[i], 'utf8'));
      polls[poll.ID] = poll;
    }
    for(var i = 0; i < delPollFiles.length; ++i) {
      var poll = JSON.parse(fs.readFileSync(CONFIG.DATA_DIR + 'tmp/delpoll/' + delPollFiles[i], 'utf8'));
      delete (polls[poll.ID]);
    }
    for(var i = 0; i < delCourseFiles.length; ++i) {
      var course = JSON.parse(fs.readFileSync(CONFIG.DATA_DIR + 'tmp/delcourse/' + delCourseFiles[i], 'utf8'));
      // delete polls
      for(var j = 0; j < course.Polls.length; ++j) {
        delete (polls[course.Polls[i]]);
      }
      // delete course
      delete (courses[course.ID]);
    }
    for(var i = 0; i < userFiles.length; ++i) {
      var user = JSON.parse(fs.readFileSync(CONFIG.DATA_DIR + 'tmp/users/' + userFiles[i], 'utf8'));
      users[user.ID] = user;
    }
    for(var i = 0; i < sessionIDFiles.length; ++i) {
      var sid = JSON.parse(fs.readFileSync(CONFIG.DATA_DIR + 'tmp/sessionIDs/' + sessionIDFiles[i], 'utf8'));
      SIDs.push(sid);
    }
  
    // write result
    fs.writeFileSync(coursePath, JSON.stringify(courses));
    fs.writeFileSync(pollPath, JSON.stringify(polls));
    fs.writeFileSync(userPath, JSON.stringify(users));
    fs.writeFileSync(sessionIDPath, JSON.stringify(SIDs));
  
    // cleanup
    for(var i = 0; i < courseFiles.length; ++i) {
      fs.unlink(CONFIG.DATA_DIR + 'tmp/courses/' + courseFiles[i]); // no callback needed
    }
    for (var i = 0; i < pollFiles.length; ++i) {
      fs.unlink(CONFIG.DATA_DIR + 'tmp/polls/' + pollFiles[i]); // no callback needed
    }
    for(var i = 0; i < userFiles.length; ++i) {
      fs.unlink(CONFIG.DATA_DIR + 'tmp/users/' + userFiles[i]); // no callback needed
    }
    for (var i = 0; i < sessionIDFiles.length; ++i) {
      fs.unlink(CONFIG.DATA_DIR + 'tmp/sessionIDs/' + sessionIDFiles[i]); // no callback needed
    }
    fs.unlink(coursePath + '.bak');
    fs.unlink(pollPath + '.bak');
    fs.unlink(userPath + '.bak');
    fs.unlink(sessionIDPath + '.bak');
  }
  
  /*
   * initializes data API routines for saving data to disk
   */
  function __init() {
    // if no data should be saved
    if(CONFIG.SAVE_DATA == false) {
      return;
    }

    // cleanup leftovers from previous runs
    __fullsave();
  
    // load data
    __loadData();
  
    // cleanup every hour
    setInterval(__fullsave, 1000*60*15); // fullsave every 15 minutes
  }
  
  // initializing
  __init();
}

