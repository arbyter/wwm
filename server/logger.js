if(CONFIG.ENABLE_LOGGING) {

  // access to file system
  var fs = require('fs');

  // file we will write to
  var __out = fs.createWriteStream(CONFIG.DATA_DIR + (new Date()).getTime() + '.log', {flags: 'w'});

  /*
   * logging function
   */
  exports.log = function(socket, message) {
    var line = '[' + (new Date()).getTime() + '] ['
               + parseInt(socket.id).toString(36) + '] '
               + message + '\n';
    __out.write(line);
  }

  /*
   * termination handler
   */
  process.on('exit', function() {
    __out.end();
  });

} else {
  // empty function
  exports.log = function(){};
}

