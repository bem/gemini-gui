'use strict';

var path = require('path'),
    q = require('q'),
    fs = require('q-io/fs'),
    temp = require('temp'),
    _ = require('lodash'),
    findGemini = require('./find-gemini'),
    reporter = require('./reporter'),

    Tests = require('./tests-model'),
    Index = require('./common/tests-index'),
    EventSource = require('./event-source'),
    Runner = require('./runner');

function removeTreeIfExists(path) {
    return fs.exists(path)
        .then(function(exists) {
            if (exists) {
                return fs.removeTree(path);
            }
        });
}

function App(options) {
    this._options = options;
    this.diffDir = temp.path('gemini-gui-diff');
    this.currentDir = temp.path('gemini-gui-curr');
    this._failedTests = new Index();

    this._eventSource = new EventSource();

    var Gemini = findGemini();
    this._gemini = new Gemini(this._options.configFile, {cli: true, env: true});
    _.set(this._gemini.config, 'system.tempDir', this.currentDir);

    var browserIds = this._gemini.browserIds;
    this.referenceDirs = _.zipObject(
        browserIds,
        browserIds.map(function(browserId) {
            return this._gemini.config.forBrowser(browserId).screenshotsDir;
        }.bind(this))
    );
}

App.prototype.initialize = function() {
    return this._recreateTmpDirs()
        .then(this._readTests.bind(this));
};

App.prototype.addClient = function(connection) {
    this._eventSource.addConnection(connection);
};

App.prototype.sendClientEvent = function(event, data) {
    this._eventSource.emit(event, data);
};

App.prototype.getTests = function() {
    return q.resolve(this._tests.data);
};

App.prototype._readTests = function() {
    var _this = this;

    return this._gemini.readTests(this._options.testFiles, this._options.grep)
        .then(function(collection) {
            _this._collection = collection;
            _this._tests = new Tests(_this, collection);
        });
};

App.prototype.run = function(specificTests) {
    var _this = this;
    return Runner.create(this._collection, specificTests)
        .run(function(collection) {
            return _this._gemini.test(collection, {
                reporters: [reporter(_this), 'flat']
            });
        });
};

App.prototype._recreateTmpDirs = function() {
    var _this = this;
    return q.all([removeTreeIfExists(this.currentDir), removeTreeIfExists(this.diffDir)])
        .then(function() {
            return q.all([
                fs.makeDirectory(_this.currentDir),
                fs.makeDirectory(_this.diffDir)
            ]);
        });
};

App.prototype.buildDiff = function(failureReport) {
    var _this = this;
    return this._buildDiffFile(failureReport)
        .then(function(diffPath) {
            return _this.diffPathToURL(diffPath);
        });
};

App.prototype._buildDiffFile = function(failureReport) {
    var diffPath = temp.path({dir: this.diffDir, suffix: '.png'});
    return failureReport.saveDiffTo(diffPath).thenResolve(diffPath);
};

App.prototype.addNoReferenceTest = function(test) {
    //adding ref path here because gemini requires real suite to calc ref path
    //and on client we have just stringified path
    test.referencePath = this.getScreenshotPath(test.suite, test.state.name, test.browserId);
    this.addFailedTest(test);
};

App.prototype.addFailedTest = function(test) {
    this._failedTests.add(test);
};

App.prototype.updateReferenceImage = function(testData) {
    var _this = this,
        test = this._failedTests.find(testData);

    if (!test) {
        return q.reject(new Error('No such test failed'));
    }

    return fs.makeTree(path.dirname(test.referencePath))
        .then(function() {
            return fs.copy(test.currentPath, test.referencePath);
        })
        .then(function() {
            console.log('Reference image %s has been updated.', test.referencePath);
            return _this.refPathToURL(test.referencePath, test.browserId);
        });
};

App.prototype.getScreenshotPath = function(suite, stateName, browserId) {
    return this._gemini.getScreenshotPath(suite, stateName, browserId);
};

App.prototype.getBrowserCapabilites = function(browserId) {
    return this._gemini.getBrowserCapabilites(browserId);
};

App.prototype.refPathToURL = function(fullPath, browserId) {
    return this._appendTimestampToURL(
        this._pathToURL(this.referenceDirs[browserId], fullPath, App.refPrefix + '/' + browserId)
    );
};

App.prototype.currentPathToURL = function(fullPath) {
    return this._appendTimestampToURL(
        this._pathToURL(this.currentDir, fullPath, App.currentPrefix)
    );
};

// add query string timestamp to avoid caching on client
App.prototype._appendTimestampToURL = function(URL) {
    return URL + '?t=' + new Date().valueOf();
};

App.prototype.diffPathToURL = function(fullPath) {
    return this._pathToURL(this.diffDir, fullPath, App.diffPrefix);
};

App.prototype._pathToURL = function(rootDir, fullPath, prefix) {
    var relPath = path.relative(rootDir, fullPath);
    return prefix + '/' + encodeURI(relPath);
};

App.refPrefix = '/ref';
App.currentPrefix = '/curr';
App.diffPrefix = '/diff';

module.exports = App;
