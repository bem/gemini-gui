'use strict';
var path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    exphbs = require('express-handlebars'),
    Promise = require('bluebird'),
    _ = require('lodash'),

    App = require('./app');

exports.start = function(options) {
    var app = new App(options);
    var server = express();
    server.engine('.hbs', exphbs({
        extname: '.hbs',
        compilerOptions: {
            preventIndent: true
        },
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
        app.getTests(req.query.suite)
            .then(function(suites) {
                res.render('main', {
                    suites: suites,
                    autoRun: options.autoRun
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

    return app.initialize()
        .then(function() {
            return Promise.fromCallback(
                callback => server.listen(options.port, options.hostname, callback)
            );
        })
        .then(function() {
            return {
                url: 'http://' + options.hostname + ':' + options.port
            };
        });
};
