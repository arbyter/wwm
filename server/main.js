// shurtcut for log functionality
l = require('./utils.js').log;

// data storage
DATA = require('./data.js');


/*** actual server ***/

DATA.INIT(function() { // init data backend
  // TODO: remove me!
  l('LOG: i am started!');

  // create webserver
  var http_server = require('./http.js').server;

  // create socket server
  require('./socket.js').createServer(http_server);
});

