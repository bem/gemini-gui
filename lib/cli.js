'use strict';
var path = require('path'),
    opener = require('opener'),
    chalk = require('chalk'),
    pkg = require('../package.json'),
    server = require('./server'),
    program = require('commander');

exports.run = function() {
    program
        .version(pkg.version)
        .allowUnknownOption(true)
        .option('-b, --browser <browser>', 'run test only in the specified browser', collect)
        .option('-p, --port <port>', 'Port to launch server on', 8000)
        .option('-h, --hostname <hostname>', 'Hostname to launch server on', 'localhost')
        .option('-c, --config <file>', 'Gemini config file', resolvePath)
        .option('-g, --grep <pattern>', 'run only suites matching the pattern', RegExp)
        .option('-a, --auto-run', 'auto run immediately')
        .parse(process.argv);

    program.on('--help', function() {
        console.log('Also you can override gemini config options.');
        console.log('See all possible options in gemini documentation.');
    });

    program.testFiles = [].concat(program.args);
    server.start(program).then(function(result) {
        console.log('GUI is running at %s', chalk.cyan(result.url));
        opener(result.url);
    }).done();
};

function collect(newValue, array) {
    return (array || []).concat(newValue);
}

function resolvePath(pathToResolve) {
    return path.resolve(pathToResolve);
}
