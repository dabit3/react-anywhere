#!/usr/bin/env node

var path = require('path');
var deepEqual = require('deep-equal');
var http = require('http');
var exec = require('child_process').execFileSync;
var spawn = require('child_process').spawn;
var fs = require('fs-extra');

var VERSION_FLAG = '--react-anywhere-version=';

var userHome = process.env.HOME || process.env.USERPROFILE;
var raHome = path.join(userHome, '.ReactAnywhereData');

var raArgs = process.argv.slice(2);
var raCmd = raArgs[0];
var thisRaPath = __dirname;
var thisRaVersion = require(path.join(thisRaPath, 'package.json')).version;

// Step 1. Determinte what version of react-anywhere we want to use

var requestedRaVersion = null;

// -- Let the user override the version by specifying --react-anywhere-version=0.1.0
raArgs = raArgs.filter(function(arg) {
  if (arg.indexOf(VERSION_FLAG) === 0) {
    requestedRaVersion = arg.split(VERSION_FLAG)[1];
    return false;
  }
  return true;
});

// -- Let the project or any parent package.json specify with reactAnywhere.version
var raExplorationPath = process.cwd();
var raAppPath = null;
while (!requestedRaVersion && raExplorationPath !== '/') {
  var possiblePackagePath = path.join(raExplorationPath, 'package.json');
  if (fs.existsSync(possiblePackagePath)) {
    var pkg = require(possiblePackagePath);
    if (pkg && pkg.reactAnywhere && pkg.reactAnywhere.version) {
      requestedRaVersion = pkg.reactAnywhere.version;
      raAppPath = raExplorationPath;
      console.log('Using react-anywhere@'+requestedRaVersion+' as specified by '+possiblePackagePath);
    }
  }
  raExplorationPath = path.join(raExplorationPath, '..');
}

// -- Use the latest version of react-anywhere when creating a new project
if (!requestedRaVersion && raArgs[0] === 'init') {
  var versionOutput = null;
  try {
    versionOutput = exec('npm', ['show', 'react-anywhere', 'version']);
  } catch (e) {}
  requestedRaVersion = versionOutput && versionOutput.toString();
}

// -- Use this version by default
if (!requestedRaVersion) {
  requestedRaVersion = thisRaVersion;
}

// Step 2. Run the command using the correct react-anywhere, if not this version

if (thisRaVersion !== requestedRaVersion) {
  var destRaPath = path.join(raHome, requestedRaVersion);
  var destRaModulesPath = path.join(destRaPath, 'node_modules');
  var raExecPath = path.join(destRaModulesPath, 'react-anywhere', 'react-anywhere.js');
  if (!fs.existsSync(raExecPath)) {
    fs.mkdirsSync(destRaModulesPath);
    exec('npm', [
      'i',
      'react-anywhere@'+requestedRaVersion
    ], {
      cwd: destRaPath
    });
    console.log('Installed react-anywhere@'+requestedRaVersion);
  }
  exec(raExecPath, raArgs, {stdio: 'inherit'});
  process.exit();
}

console.log('Using react-anywhere@'+thisRaVersion+' for '+raCmd);

// Step 3. Actual implementation of react-anywhere scripts

var templatePath = path.join(thisRaPath, 'template');
var runtimeFilesPath = path.join(thisRaPath, 'runtime');

function replaceWithMap(str, map) {
  Object.keys(map).map(function(keyToReplace) {
    var replacement = map[keyToReplace];
    while (str.indexOf(keyToReplace) !== -1) {
      str = str.replace(keyToReplace, replacement);
    }
    while (str.indexOf(keyToReplace.toLowerCase()) !== -1) {
      str = str.replace(keyToReplace.toLowerCase(), replacement.toLowerCase());
    }
  });
  if (str[0] === '_') {
    return '.' + str.substr(1);
  }
  return str;
}

function templateCopy(source, dest, map, name) {
  var thisPath = path.join(source, name);
  var destPath = path.join(dest, replaceWithMap(name, map));
  var lstat = fs.lstatSync(thisPath);
  if (lstat.isDirectory()) {
    var names = fs.readdirSync(thisPath);
    names.map(function (innerName) {
      templateCopy(
        thisPath,
        destPath,
        map,
        innerName
      );
    });
  } else {
    var file = fs.readFileSync(thisPath).toString();
    fs.outputFileSync(destPath, replaceWithMap(file, map), {mode: fs.statSync(thisPath).mode});
  }
}

function moveFiles(prefixPath, moves) {
  Object.keys(moves).map(function (moveSrc) {
    var moveDest = moves[moveSrc];
    exec('mv', [path.join(prefixPath, moveSrc), path.join(prefixPath, moveDest)]);
  });
}

if (raCmd === 'init') {
  var appName = raArgs[1];
  var appPath = path.join(process.cwd(), appName);
  var appModulesPath = path.join(appPath, 'node_modules');
  if (fs.existsSync(appPath)) {
    console.error('Cannot init because a directory already exists at '+appPath);
    process.exit(1);
  }
  fs.mkdirsSync(appPath);
  var raScriptCmds = ['clean', 'warmup', 'web', 'ios', 'android', 'native'];
  var scripts = {};
  raScriptCmds.map(function(cmdName) {
    scripts[cmdName] = 'react-anywhere '+cmdName;
  });
  scripts.prepublish = 'react-anywhere clean';
  var pkg = {
    name: appName,
    author: 'React Anywhere Developer',
    description: '',
    version: '0.1.0',
    private: true,
    reactAnywhere: {
      version: thisRaVersion,
      displayName: appName,
      bundleIdentifier: 'com.'+appName.toLowerCase(),
      uriScheme: appName.toLowerCase(),
    },
    scripts: scripts,
    dependencies: require(path.join(thisRaPath, 'dependencies.json')),
  };
  fs.outputFileSync(path.join(appPath, 'package.json'), JSON.stringify(pkg, null, 2));

  var renameMap = {
    'ReactAnywhereTemplate': appName,
    'ReactAnywhereDisplayName': appName,
  };
  var names = fs.readdirSync(templatePath);
  names.map(function (name) {
    templateCopy(templatePath, appPath, renameMap, name);
  });

  // moveFiles(appPath, {
  //   '_gitignore': '.gitignore'
  // });
  fs.mkdirsSync(appModulesPath);
  exec('npm', ['i'], {cwd: appPath, stdio: 'inherit'});
  process.exit();
}

var reservedFiles = [
  'ios', 'android', 'web', 'index.js', 'index.android.js', 'index.html', 'index.ios.js', '.watchmanconfig', '.flowconfig', '.buckconfig'
];

function clean() {
  if (!raAppPath) {
    console.error('Could not find the react-anywhere app!');
    process.exit(1);
  }
  var raIdentifierPath = path.join(raAppPath, '.react-anywhere.json');
  if (fs.existsSync(raIdentifierPath)) {
    var raInfo = require(raIdentifierPath);
    var filesToDelete = reservedFiles.map(function (file) {
      return path.join(raAppPath, file);
    });
    exec('rm', ['-rf', raIdentifierPath].concat(filesToDelete)); 
    return;
  }
  reservedFiles.map(function(file) {
    if (fs.existsSync(path.join(raAppPath, file))) {
      console.error('Cannot clean app because reserved file is already here: '+file);
      process.exit(1);
    }
  });
}

function warmup() {
  var pkgPath = path.join(raAppPath, 'package.json');
  var pkg = require(pkgPath);
  var pkgRaInfo = {
    name: pkg.name,
    author: pkg.author,
    reactAnywhere: pkg.reactAnywhere,
    version: pkg.version
  };

  var raIdentifierPath = path.join(raAppPath, '.react-anywhere.json');
  var raPkg = null;

  try {
    raPkg = JSON.parse(fs.readFileSync(raIdentifierPath).toString());
  } catch (e) {}

  if (deepEqual(raPkg, pkgRaInfo)) {
    return;
  }

  if (raPkg) {
    clean();
  }

  var renameMap = {
    ReactAnywhereVersion: pkg.version,
    ReactAnywhereTemplate: pkg.name,
    ReactAnywhereDisplayName: pkg.reactAnywhere.displayName,
    ReactAnywhereAuthor: pkg.author,
    ReactAnywhereURIScheme: pkg.reactAnywhere.uriScheme,
    ReactAnywhereBundleIdentifier: pkg.reactAnywhere.bundleIdentifier
  };
  var names = fs.readdirSync(runtimeFilesPath);
  names.map(function (name) {
    templateCopy(runtimeFilesPath, raAppPath, renameMap, name);
  });

  fs.outputFileSync(raIdentifierPath, JSON.stringify(pkgRaInfo, null, 2));
}

if (raCmd === 'clean') {
  clean();
}

else if (raCmd === 'warmup') {
  clean();
  warmup();
}

else if (raCmd === 'web') {
  warmup();
  exec('node', [path.join(raAppPath, 'web', 'scripts', 'start.js')], {cwd: raAppPath, stdio: 'inherit'});

  // // Attempt to use RN packager for bundling server code:
  // // This code works but the packager's output does not seem to run well on node
  // var server = spawn('react-native', ['start'], {cwd: raAppPath});
  // server.stdout.on('data', function(data) {
  //   if (data.indexOf('React packager ready.') !== -1) {
  //     fs.mkdirsSync(path.join(raAppPath, 'web', 'build'));
  //     var fileToWrite = fs.createWriteStream(path.join(raAppPath, 'web', 'build', 'server.js'));
  //     var packageUri = 'http://localhost:8081/web/server.bundle?platform=web&dev=true&minify=false';
  //     var request = http.get(packageUri, function(response) {
  //       response.pipe(fileToWrite);
  //       fileToWrite.on('finish', function() {
  //         fileToWrite.close(function() {
  //           console.log('YES!');
  //         });
  //       });
  //     });
  //   }
  // });
}

else if (raCmd === 'ios' || raCmd === 'android') {
  warmup();
  exec('react-native', ['run-'+raCmd], {cwd: raAppPath, stdio: 'inherit'});
}

else if (raCmd === 'native') {
  warmup();
  exec('react-native', ['start'], {cwd: raAppPath, stdio: 'inherit'});
}

else {
  console.error('Could not recognize command "'+raCmd+'"');
  process.exit(1);
}
