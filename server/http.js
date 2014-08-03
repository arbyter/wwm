/*
 * HTTP server will be created here
 */


// load the filesystem plugin
// allows easy file access
var fs = require('fs');

// load the connect webserver framework
var __connect = require('connect');

// create filehandler for static files
var static_css    = __connect.static(CONFIG.STATIC_DIR + 'css');
var static_jslib  = __connect.static(CONFIG.STATIC_DIR + 'jslib');
var static_js     = __connect.static(CONFIG.STATIC_DIR + 'js');
var static_images = __connect.static(CONFIG.STATIC_DIR + 'images');

// main handler
var router = __connect.router(function(app) {

  // interface to create a new course and manage polls
  app.get('/', function(req, res) {
      fs.readFile(CONFIG.HTML_DIR + '/create.html', function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
        });
  });
    
  // attend polls for voting
  app.get('/:id', function(req, res) {
      fs.readFile(CONFIG.HTML_DIR + '/poll.html', function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
        });
  });
  
});

// cookie handler
function processCookies(req, res, next) {
  if(require('url').parse(req.url).pathname.split('/').length > 2) {
    // not top level directory; skip cookie
    next();
    return; // should not be necessary, but to be safe...
  }

  if('sessionid' in req.cookies) { // parsing turns string to lower case
    // cookie already set; skip
    next();
    return; // should not be necessary, but to be safe...
  }

  // set cookie
  DATA.getSessionID(function(sid) {
    res.setHeader("Set-Cookie", ["sessionID=" + sid]);
    next();
  });
}

// create the webserver with all his handlers
var http_server = __connect.createServer( __connect.cookieParser(),
                                          // key will also be usesd in server/socket.js
                                          __connect.session({
                                            key:'wwm.sid',
                                            secret: 'GEVPwMpcgYvthTku0wP4OhOVpNvSyh2XFj9wl9JFf4',
                                            cookie:{maxAge:60*60*24*30*12*1000,httpOnly:false},
                                          })
                                          );
http_server
  .use('/', router)
  .use('/css', static_css)
  .use('/jslib', static_jslib)
  .use('/js', static_js)
  .use('/images', static_images)
  .listen(CONFIG.SERVER_PORT); // DO NOT specify a server address here!

// export server as result
exports.server = http_server;

