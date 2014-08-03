/*
 * Configuration
 */
CONFIG = {

/*** these lines should be everything you ever have to touch ***/

  // config server
  SERVER_PORT: 3333,

  // base directory where all files were put
  BASE_DIR: __dirname + '/',

  // data directory
  DATA_DIR: __dirname + '/data/',

  // uncomment exactly ONE of these lines
  DATA_STORAGE: 'FILE',
  //DATA_STORAGE: 'MONGODB',

  // mongodb configuration
  MONGO_SERVER: 'localhost',
  MONGO_PORT: 27017, // mongodb default port: 27017
  MONGO_DB: 'wwm',

  // operating system (needed to choose shipped mongodb binary)
  //OS: 'LINUX32', // 32 bit Linux
  //OS: 'LINUX64', // 64 bit Linus
  //OS: 'WIN32', // 32 bit Windows
  //OS: 'WIN64', // 64 bit Windows
  OS: 'OSX64', // 64 bit Windows

  // disable saving data
  SAVE_DATA: true,

  // enable logging
  ENABLE_LOGGING: false,

  // skip main (used for tests)
  SKIP: false,

/*** everything below is generic ***/

  // TODO: comment me
  POLL_TYPE_JN: 'ja_nein',
  POLL_TYPE_AB: 'a_b',
  POLL_TYPE_ABC: 'a_b_c',
  POLL_TYPE_ABCD: 'a_b_c_d'
};

// directories relative to other directories
CONFIG.STATIC_DIR = CONFIG.BASE_DIR + 'static/';
CONFIG.HTML_DIR = CONFIG.STATIC_DIR + 'html/';
CONFIG.MONGO_DIR = CONFIG.DATA_DIR + 'mongodb/'

// path to mongo binaries
var mongoDir = {
  'LINUX32': 'mongodb-linux-i686-2.0.1',
  'LINUX64': 'mongodb-linux-x86_64-2.0.1',
  'WIN32': 'mongodb-win32-i386-2.0.1',
  'WIN64': 'mongodb-win32-x86_64-2.0.1',
  'OSX64': 'mongodb-osx-x86_64-2.0.9'
};
CONFIG.MONGO_BIN = __dirname + '/server/mongodb/' + mongoDir[CONFIG.OS] + '/bin/';

// parse command line
require('./server/cmdline.js');

/*
 * Run Actual Server
 */
if(!CONFIG.SKIP) {
  require('./server/main.js');
}

