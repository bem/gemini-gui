'use strict';

const _ = require('lodash');
const proxyquire = require('proxyquire');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const path = require('path');

const RunnerFactory = require('../lib/runner');
const AllSuitesRunner = require('../lib/runner/all-suites-runner');
const mkDummyCollection = require('./test-utils').mkDummyCollection;

describe('lib/app', () => {
    const sandbox = sinon.sandbox.create();

    let suiteCollection;
    let Gemini;
    let App;
    let app;
    let runner;

    const stubFs_ = () => {
        sandbox.stub(fs, 'removeAsync').returns(Promise.resolve());
        sandbox.stub(fs, 'mkdirpAsync').returns(Promise.resolve());
        sandbox.stub(fs, 'copyAsync').returns(Promise.resolve());
        sandbox.stub(fs, 'readJsonAsync').returns(Promise.resolve({}));
    };

    const mkApp_ = (config) => new App(config || {});

    beforeEach(() => {
        suiteCollection = mkDummyCollection();

        runner = {emit: sandbox.spy()};

        Gemini = sandbox.stub();
        Gemini.prototype.browserIds = [];
        Gemini.prototype.readTests = sandbox.stub().returns(Promise.resolve(suiteCollection));
        Gemini.prototype.test = sandbox.stub().returns(Promise.resolve());
        Gemini.prototype.on = sandbox.stub().yields(runner);

        App = proxyquire('../lib/app', {
            './find-gemini': sandbox.stub().returns(Gemini)
        });

        app = mkApp_();
    });

    afterEach(() => sandbox.restore());

    describe('initialize', () => {
        beforeEach(() => stubFs_());

        it('should remove old fs tree for current images dir if it exists', () => {
            app.currentDir = 'current_dir';

            return app.initialize()
                .then(() => assert.calledWith(fs.removeAsync, 'current_dir'));
        });

        it('should remove old fs tree for diff images dir if it exists', () => {
            app.diffDir = 'diff_dir';

            return app.initialize()
                .then(() => assert.calledWith(fs.removeAsync, 'diff_dir'));
        });

        it('should create new tree for current images dir', () => {
            app.currentDir = 'current_dir';

            return app.initialize()
                .then(() => assert.calledWith(fs.mkdirpAsync, 'current_dir'));
        });

        it('should create new tree for diff images dir', () => {
            app.currentDir = 'diff_dir';

            return app.initialize()
                .then(() => assert.calledWith(fs.mkdirpAsync, 'diff_dir'));
        });

        it('should read tests', () => {
            const app = mkApp_({
                testFiles: ['test_file', 'another_test_file']
            });

            return app.initialize()
                .then(() => {
                    assert.calledWith(Gemini.prototype.readTests,
                        ['test_file', 'another_test_file']);
                });
        });

        it('should pass options from cli to Gemini', () => {
            const app = mkApp_({
                testFiles: ['test_file'],
                grep: 'grep',
                set: ['set']
            });

            return app.initialize()
                .then(() => {
                    assert.calledWith(Gemini.prototype.readTests,
                        ['test_file'], {grep: 'grep', sets: ['set']});
                });
        });
    });

    describe('run', () => {
        it('should create and execute runner', () => {
            const runnerInstance = sinon.createStubInstance(AllSuitesRunner);

            sandbox.stub(RunnerFactory, 'create').returns(runnerInstance);

            app.run();

            assert.called(runnerInstance.run);
        });

        it('should pass run handler to runner which will execute gemeni', () => {
            const runnerInstance = sinon.createStubInstance(AllSuitesRunner);

            runnerInstance.run.yields();
            sandbox.stub(RunnerFactory, 'create').returns(runnerInstance);

            app.run();

            assert.called(Gemini.prototype.test);
        });
    });

    describe('addNoReferenceTest', () => {
        beforeEach(() => sandbox.stub(app, 'addFailedTest'));

        it('should add to test reference image path', () => {
            const test = {
                suite: {id: 1},
                state: {name: 'state'},
                browserId: 'browser'
            };

            sandbox.stub(app, 'getScreenshotPath').returns('some_screenshot_path');
            app.addNoReferenceTest(test);

            assert.equal(test.referencePath, 'some_screenshot_path');
        });

        it('should add test with no reference error to failed tests', () => {
            const test = {
                suite: {id: 1},
                state: {name: 'state'},
                browserId: 'browser'
            };

            sandbox.stub(app, 'getScreenshotPath');
            app.addNoReferenceTest(test);

            assert.calledWith(app.addFailedTest, test);
        });
    });

    describe('updateReferenceImage', () => {
        const mkDummyTest_ = (params) => {
            return _.defaults(params || {}, {
                suite: {path: 'default_suite_path'},
                state: 'default_state',
                browserId: 'default_browser',
                referencePath: 'default/reference/path',
                currentPath: 'default/current/path'
            });
        };

        beforeEach(() => {
            stubFs_();
            sandbox.stub(app, 'refPathToURL');
        });

        it('should reject reference update if no failed test registered', () => {
            const test = mkDummyTest_();

            return assert.isRejected(app.updateReferenceImage(test), 'No such test failed');
        });

        it('should create directory tree for reference image before saving', () => {
            const test = mkDummyTest_({referencePath: 'path/to/reference/image.png'});

            app.addFailedTest(test);

            return app.updateReferenceImage(test)
                .then(() => assert.calledWith(fs.mkdirpAsync, 'path/to/reference'));
        });

        it('should copy current image to reference folder', () => {
            const referencePath = 'path/to/reference/image.png';
            const currentPath = 'path/to/current/image.png';

            const test = mkDummyTest_({referencePath, currentPath});

            app.addFailedTest(test);

            return app.updateReferenceImage(test)
                .then(() => assert.calledWith(fs.copyAsync, currentPath, referencePath));
        });

        it('should emit updateResult event with result argument by emit', () => {
            const test = mkDummyTest_({referencePath: 'path/to/reference.png'});

            const result = {
                imagePath: 'path/to/reference.png',
                updated: true,
                suite: test.state.suite,
                state: test.state,
                browserId: test.browserId
            };

            app.addFailedTest(test);

            return app.updateReferenceImage(test)
                .then(() => assert.calledWithExactly(runner.emit, 'updateResult', result));
        });

        it('should emit updateResult event only after copy current image to reference folder', () => {
            const test = mkDummyTest_();

            app.addFailedTest(test);

            return app.updateReferenceImage(test)
                .then(() => assert.isTrue(runner.emit.calledAfter(fs.copyAsync)));
        });

        it('should be resolved with URL to updated reference', () => {
            const test = mkDummyTest_();

            app.refPathToURL.returns(Promise.resolve('http://dummy_ref.url'));
            app.addFailedTest(test);

            return app.updateReferenceImage(test)
                .then((result) => assert.equal(result, 'http://dummy_ref.url'));
        });
    });

    describe('refPathToURL', () => {
        beforeEach(() => {
            app.referenceDirs = {
                'browser_id': 'browser_reference_dir'
            };
        });

        it('should append timestamp to resulting URL', () => {
            const result = app.refPathToURL('full_path', 'browser_id');

            return assert.match(result, /\?t=\d+/);
        });
    });

    describe('currentPathToURL', () => {
        it('should append timestamp to resulting URL', () => {
            const result = app.currentPathToURL('full_path');

            return assert.match(result, /\?t=\d+/);
        });
    });

    describe('copyImage', () => {
        beforeEach(() => {
            stubFs_();
            sandbox.stub(path, 'resolve');
        });

        it('should reject if copying failed', () => {
            fs.copyAsync.returns(Promise.reject());

            return app.initialize()
                .then(() => assert.isRejected(app.copyImage('src/rel/path', '/dst/abs/path')));
        });

        it('should resolve if image was copied successfully', () => {
            return app.initialize()
                .then(() => assert.isFulfilled(app.copyImage('src/rel/path', '/dst/abs/path')));
        });
    });
});
