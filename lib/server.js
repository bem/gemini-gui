'use strict';
var path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    exphbs  = require('express-handlebars'),
    q = require('q'),
    _ = require('lodash'),
    fs = require('fs'),
    exec = require('child_process').exec,

    App = require('./app');

var repo = '', defaultBranch = '', currentBranch = '';
exec('git remote get-url origin', function(error, stdout, stderr) {
    repo = stdout.trim().replace(/\n|^git@|^https?:\/\/|\.git$/g, '').replace(/:/, '/');
});
exec('git branch -a | grep "remotes/origin/HEAD" | grep -oE "\w+$"', function(error, stdout, stderr) {
    defaultBranch = stdout.trim();
});
exec('git rev-parse --abbrev-ref @', function(error, stdout, stderr) {
    currentBranch = stdout.trim();
});

exports.start = function(options) {
    var app = new App(options);
    var server = express();
    server.engine('.hbs', exphbs({
        extname: '.hbs',
        partialsDir: path.join(__dirname, 'views', 'partials')
    }));

    server.set('view engine', '.hbs');
    server.set('views', path.join(__dirname, 'views'));

    server.use(bodyParser.json());
    server.use(express.static(path.join(__dirname, 'static')));
    server.use(App.currentPrefix, express.static(app.currentDir));
    server.use(App.diffPrefix, express.static(app.diffDir));
    _.forEach(app.referenceDirs, function(dir, browserId) {
        server.use(App.refPrefix + '/' + browserId, express.static(dir));
    });

    server.get('/', function(req, res) {
        app.getTests()
            .then(function(suites) {
                res.render('main', {
                    suites: suites
                });
            })
            .catch(function(e) {
                res.status(500).send(e.stack);
            });
    });

    server.get('/events', function(req, res) {
        res.writeHead(200, {'Content-Type': 'text/event-stream'});

        app.addClient(res);
    });

    server.post('/run', function(req, res) {
        app.run(req.body)
            .catch(function(e) {
                console.error(e);
            });

        res.send({status: 'ok'});
    });

    server.post('/update-ref', function(req, res) {
        app.updateReferenceImage(req.body)
            .then(function(referenceURL) {
                res.send({referenceURL: referenceURL});
            })
            .catch(function(error) {
                res.status(500);
                res.send({error: error.message});
            });
    });

    // Get suite code file:line
    server.get('/suite-code-position', function(req, res) {
        options.testFiles.forEach(function(filePath) {
            fs.readFile(filePath, 'utf8', function(err, data) {
                data.split(/\n/).forEach(function(lineStr, lineIndex) {
                    var isSuite = lineStr.match(/gemini\(|suite\(|capture\(/);
                    if (isSuite && lineStr.match(req.query.suite)) {
                        res.send({
                            file: filePath,
                            line: lineIndex + 1,
                            repo: repo,
                            branch: {default: defaultBranch, current: currentBranch}
                        });
                    }
                });
            });
        });
    });

    return app.initialize()
        .then(function() {
            return q.nfcall(server.listen.bind(server), options.port, options.hostname);
        })
        .then(function() {
            return {
                url: 'http://' + options.hostname + ':' + options.port
            };
        });
};
