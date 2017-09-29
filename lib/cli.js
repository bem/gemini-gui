'use strict';
const path = require('path');
const opener = require('opener');
const chalk = require('chalk');
const program = require('commander');

const pkg = require('../package.json');
const server = require('./server');

const collect = (newValue, array) => (array || []).concat(newValue);

exports.run = () => {
    program
        .version(pkg.version)
        .allowUnknownOption(true)
        .option('-b, --browser <browser>', 'run test only in the specified browser', collect)
        .option('-p, --port <port>', 'port to launch server on', 8000)
        .option('-h, --hostname <hostname>', 'hostname to launch server on', 'localhost')
        .option('-c, --config <file>', 'gemini config file', path.resolve, '')
        .option('-g, --grep <pattern>', 'run only suites matching the pattern', RegExp)
        .option('-s, --set <set>', 'set to run', collect)
        .option('-a, --auto-run', 'auto run immediately')
        .option('-O, --no-open', 'not to open a browser window after starting the server')
        .on('--help', () => {
            console.log('\n    Also you can override gemini config options via environment variables and CLI options.' +
                ' See gemini documentation for details.');
        })
        .parse(process.argv);

    program.testFiles = [].concat(program.args);
    server.start(program).then((result) => {
        console.log(`GUI is running at ${chalk.cyan(result.url)}`);
        if (program.open) {
            opener(result.url);
        }
    }).done();
};
