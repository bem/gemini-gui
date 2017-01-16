'use strict';

const EventEmitter = require('events').EventEmitter;
const Promise = require('bluebird');
const App = require('../lib/app');
const reporter = require('../lib/reporter');

describe('reporter', () => {
    beforeEach(() => {
        this.app = sinon.createStubInstance(App);
    });

    const emitToReporter = (event, data, app) => {
        const reporterFunc = reporter(app);
        const emitter = new EventEmitter();

        reporterFunc(emitter);

        emitter.emit(event, data);
    };

    const itShouldProxyEvent = (event, data) => {
        it('should proxy ' + event, () => {
            emitToReporter(event, data, this.app);

            assert.calledWith(this.app.sendClientEvent, event, data);
        });
    };

    const mkDummyError_ = (params) => {
        const error = new Error('example');

        error.suite = params.suite || {id: -1};
        error.browserId = params.browserId || 'default_browser';
        error.state = params.state || {name: 'state'};
        error.name = params.name || 'dummy_error';

        return error;
    };

    itShouldProxyEvent('begin', {});

    itShouldProxyEvent('beginSuite', {
        suite: {name: 'test', id: 1},
        browserId: 'bro'
    });

    itShouldProxyEvent('beginState', {
        suite: {name: 'test', id: 1},
        browserId: 'bro',
        state: {name: 'state'}
    });

    itShouldProxyEvent('skipState', {
        suite: {name: 'test', id: 1},
        browserId: 'bro',
        state: {name: 'state'}
    });

    itShouldProxyEvent('endState', {
        suite: {name: 'test', id: 1},
        browserId: 'bro',
        state: {name: 'state'}
    });

    itShouldProxyEvent('endSuite', {
        suite: {name: 'test', id: 1},
        browserId: 'bro'
    });

    itShouldProxyEvent('end', {});

    it('should replace paths with URLs if endTest emitted with equal images', () => {
        this.app.refPathToURL.withArgs('ref.png', 'browser').returns('/ref/browser/image.png');
        this.app.currentPathToURL.withArgs('curr.png').returns('/curr/image.png');

        emitToReporter('endTest', {
            suite: {id: 1, name: 'test', file: '/file'},
            state: {name: 'state'},
            browserId: 'browser',
            sessionId: 'session',
            equal: true,
            referencePath: 'ref.png',
            currentPath: 'curr.png'
        }, this.app);

        assert.calledWith(this.app.sendClientEvent, 'endTest', {
            suite: {id: 1, name: 'test', file: '/file'},
            state: {
                name: 'state',
                metaInfo: {sessionId: 'session', file: '/file'}
            },
            browserId: 'browser',
            equal: true,
            referenceURL: '/ref/browser/image.png',
            currentURL: '/curr/image.png'
        });
    });

    it('should build diff if images are not equal', () => {
        this.app.buildDiff.returns(Promise.resolve());

        const failureData = {
            suite: {id: 1, name: 'test'},
            state: {name: 'state'},
            browserId: 'browser',
            equal: false,
            referencePath: 'ref.png',
            currentPath: 'curr.png'
        };

        emitToReporter('endTest', failureData, this.app);

        assert.calledWith(this.app.buildDiff, failureData);
    });

    it('should register failure', () => {
        this.app.buildDiff.returns(Promise.resolve());

        emitToReporter('endTest', {
            suite: {id: 1, name: 'test', file: '/file'},
            state: {name: 'state'},
            browserId: 'browser',
            sessionId: 'session',
            equal: false,
            referencePath: 'ref.png',
            currentPath: 'curr.png'
        }, this.app);

        assert.calledWith(this.app.addFailedTest, {
            suite: {id: 1, name: 'test', file: '/file'},
            state: {
                name: 'state',
                metaInfo: {sessionId: 'session', file: '/file'}
            },
            browserId: 'browser',
            referencePath: 'ref.png',
            currentPath: 'curr.png'
        });
    });

    it('should send event with diffURL to the client', () => {
        this.app.refPathToURL.withArgs('ref.png', 'browser').returns('/ref/browser/image.png');
        this.app.currentPathToURL.withArgs('curr.png').returns('/curr/image.png');
        this.app.buildDiff.returns(Promise.resolve('/diff/image.png'));

        emitToReporter('endTest', {
            suite: {id: 1, name: 'test', file: '/file'},
            state: {name: 'state'},
            browserId: 'browser',
            sessionId: 'session',
            equal: false,
            referencePath: 'ref.png',
            currentPath: 'curr.png'
        }, this.app);

        return Promise.resolve().then(() => {
            assert.calledWith(this.app.sendClientEvent, 'endTest', {
                suite: {id: 1, name: 'test', file: '/file'},
                state: {
                    name: 'state',
                    metaInfo: {sessionId: 'session', file: '/file'}
                },
                browserId: 'browser',
                equal: false,
                referenceURL: '/ref/browser/image.png',
                currentURL: '/curr/image.png',
                diffURL: '/diff/image.png'
            });
        });
    });

    it('should report error stack', () => {
        const error = mkDummyError_({
            suite: {id: 1},
            browserId: 'browser',
            state: {name: 'state'}
        });

        emitToReporter('err', error, this.app);

        assert.calledWith(this.app.sendClientEvent, 'err', {
            suite: {id: 1},
            state: {name: 'state'},
            browserId: 'browser',
            stack: error.stack
        });
    });

    it('should register NoRefImageError as failure', () => {
        const error = mkDummyError_({
            name: 'NoRefImageError'
        });

        emitToReporter('err', error, this.app);

        assert.calledWith(this.app.addNoReferenceTest, error);
    });

    it('should send `noReference` event to client', () => {
        this.app.currentPathToURL.returns('current_path');

        const error = mkDummyError_({
            name: 'NoRefImageError',
            suite: {id: 1},
            state: {name: 'state'},
            browserId: 'browser'
        });

        emitToReporter('err', error, this.app);

        assert.calledWith(this.app.sendClientEvent, 'noReference', {
            suite: {id: 1},
            state: {name: 'state'},
            browserId: 'browser',
            currentURL: 'current_path'
        });
    });
});
