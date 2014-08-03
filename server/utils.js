/**
 * now objects (dictionary) can be checked of emptiness
 */
Object.defineProperty(Object.prototype, "isEmpty", {
    enumerable: false,
    value: function() {
    	    for (var prop in this) if (this.hasOwnProperty(prop)) return false;
    	    return true;
    	}
	}
);

/** 
 * Shortcut for the log-function
 * @author marcus
 */
exports.log = console.info;

/**
 * Broadcasts and emit an event to all listeners and myself 
 * b provides a list of rooms for braodcasting 
 * @param k key
 * @param v value
 * @param s socket-object
 * @param b list of broadcast-ids
 * @returns {Boolean}
 * @author marcus
 */
exports.broadcast_and_me = function(s,b, k, v) {
  if(typeof b == 'object'){
	  for(e in b){
		  s.broadcast.to(e).emit(k, v);
	  }
  }else{
	  s.broadcast.to(b).emit(k, v);
  }
  
  s.emit(k, v);
  return true;
}

/**
 * Clones a dictionary
 * @param d dictionary
 * @returns dictionary
 */
exports.clone = function (d){  

    if(d == null) return null;

    if(typeof(d) != 'object') return d; // 'cloning' a primitive

    if(d instanceof Array){ // it's an arry
		var nd  = new Array();
	}else{ // it's an dict
		var nd = new Object();
	}
	
	
	for(e in d){
		if(typeof d[e] == 'object'){
			nd[e] = exports.clone(d[e]);
		}else{
			nd[e] = d[e];
		}
	}

	return nd;
}

/**
 * returns a random number.  
 * @param d maximum
 * @returns
 */
exports.random = function(d){
	return parseInt(10000000*Math.random())%d;
}

/**
 * sends a message via socket.io
 * @param s socket-object
 * @param mb message body
 * @param mt message type (error,info)
 * @returns {Boolean}
 */
exports.msg = function(){
	var a = arguments;
	var ca = arguments.length;
	
	// minimum 2 arguments (socket and message body) needed! 
	if (ca<2) return false;

	// socket-object
	s = a[0]
	
	// message type
	mt = (typeof a[1]!='undefined')? a[1] : 'error';

	// messeage body
	mb = a[2];
	
	try{
		s.emit('message',{'msg_body':mb,'msg_type':mt});
		return true;
	} catch(e) {
		return false;
	}
	
}

/**
 * Sends an error message
 */
exports.err = function(socket,message){
	exports.msg(socket,'error',message);
	return true;
}

/**
 * Sends an info message
 */
exports.nfo = function(socket,message){
	exports.msg(socket,'info',message);
	return true;
}

