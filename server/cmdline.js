/*
 * command line parser is written here
 */

// get helper function for output
function l() {
  console.log(arguments[0]);
}
var fs = require('fs');

// get parameters
var params = {};
for(var i = 1; i < process.argv.length; ++i) {
  // search for --help parameter
  if('--help' == process.argv[i]) {
    // print help and exit
    l('TODO: Name Program here!');
    l('');
    l('The following command line parameters are defined:');
    l(' --help       Prints this text.');
    l(' --runTest    Run a bunch of tests.');
    l(' --clearData  Wipes all data from disk and exits.');
    l(' --port=PORT  Listen on port PORT.');
    l('              Default port is ' + CONFIG.SERVER_PORT);
    l(' --log        Enables logging');
    l('');
    l(' --disableDataStorage  No data will be loaded or saved');
    process.exit(0);
  }

  var tmp = process.argv[i].split('--');
  // if parameter starts with "--"
  if(tmp[0] == '') {
    // split in key and value
    tmp = tmp[1].split('=');
    if(tmp.length == 2) {
      params[tmp[0]] = tmp[1];
    } else {
      params[tmp[0]] = null;
    }
  }
}


/*** evaluate parameters ***/

// --clearData
if('clearData' in params) {
  // clear main files
  fs.writeFileSync(CONFIG.DATA_DIR + 'courses.dat', JSON.stringify({}));
  fs.writeFileSync(CONFIG.DATA_DIR + 'polls.dat', JSON.stringify({}));
  fs.writeFileSync(CONFIG.DATA_DIR + 'sessionIDs.dat', JSON.stringify([]));

  // clear temporary files
  var tmpDirs = ['courses/', 'polls/', 'sessionIDs/'];
  for(var i = 0; i < tmpDirs.length; ++i) {
    var path = CONFIG.DATA_DIR + 'tmp/' + tmpDirs[i];
    var files = fs.readdirSync(path).filter(function(value){return (value > '0');});
    for(var j = 0; j < files.length; ++j) {
      fs.unlink(path + files[j]); // no callback needed
    }
  }

  // exit
  process.exit(0);
}

// --port=PORT
if(('port' in params) && (params.port != null)) {
  CONFIG.SERVER_PORT = parseInt(params.port);
}

// --disableDataStorage
if('disableDataStorage' in params) {
  CONFIG.DATA_STORAGE = 'FILE';
  CONFIG.SAVE_DATA = false;
}

// --log
if('log' in params) {
  CONFIG.ENABLE_LOGGING = true;
}

// --runTest
if('runTest' in params) {
  TEST = require('./test.js');
  TEST.run();

  // skip main
  CONFIG.SKIP = true;
}

