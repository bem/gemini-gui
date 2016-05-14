'use strict';
var SuiteControls = require('./suite-controls'),
    successTemplate = require('../views/partials/success-result.hbs'),
    failTemplate = require('../views/partials/fail-result.hbs'),
    errorTemplate = require('../views/partials/error-result.hbs'),
    skipTemplate = require('../views/partials/skip-result.hbs'),
    noReferenceTemplate = require('../views/partials/no-reference-result.hbs'),
    xhr = require('./xhr');

var statusList = [
    'idle',
    'queued',
    'running',
    'success',
    'fail',
    'skip'
];

function statusClass(status) {
    return 'section_status_' + status;
}

function getInitialStatus(sectionNode) {
    var status;
    for (var i = 0; i< statusList.length; i++) {
        status = statusList[i];
        if (sectionNode.classList.contains(statusClass(status))) {
            return status;
        }
    }
    return null;
}

function Section(node, parent, runStateHandler) {
    this.suite = {path: node.getAttribute('data-suite-path')};
    this.state = {name: node.getAttribute('data-state-name')};
    this.browserId = node.getAttribute('data-browser-id');
    this.domNode = node;
    this._status = getInitialStatus(node);
    this._titleNode = node.querySelector('.section__title');
    this._bodyNode = node.querySelector('.section__body');
    this._titleNode.addEventListener('click', this.toggle.bind(this));
    this._parent = parent;
    this._runStateHandler = runStateHandler;
    this._suiteControls = null;
}

Section.prototype = {
    constructor: Section,
    expand:function() {
        this.domNode.classList.remove('section_collapsed');
    },

    collapse: function() {
        this.domNode.classList.add('section_collapsed');
    },

    toggle: function() {
        this.domNode.classList.toggle('section_collapsed');
    },

    get status() {
        return this._status;
    },

    set status(value) {
        if (this._status) {
            this.domNode.classList.remove(statusClass(this._status));
        }

        this._status = value;
        this.domNode.classList.add(statusClass(this._status));
    },

    expandIfError: function() {
        if (this.status === 'fail') {
            this.expand();
        } else {
            this.collapse();
        }
    },

    setAsQueued: function() {
        this.status = 'queued';
        while (this._bodyNode.hasChildNodes()) {
            this._bodyNode.removeChild(this._bodyNode.firstChild);
        }
    },

    setAsFailure: function(results) {
        this.status = 'fail';
        this._bodyNode.innerHTML = failTemplate(results);

        this._suiteControls = new SuiteControls(this._bodyNode);
        this._suiteControls.setAsFailure(this.retry.bind(this), this.updateReference.bind(this));
    },

    setAsSuccess: function(results) {
        var failedChild = this.domNode.querySelector('.section.' + statusClass('fail'));
        if (failedChild) {
            return;
        }

        this.status = 'success';
        if (results) {
            this._bodyNode.innerHTML = successTemplate(results);

            this._suiteControls = new SuiteControls(this._bodyNode);
            this._suiteControls.setAsSuccess(this.retry.bind(this));
        }

        if (this._parent && this._parent.status === 'fail') {
            this._parent.setAsSuccess();
        }
    },

    setAsSkipped: function() {
        this.status = 'skipped';
        this._bodyNode.innerHTML = skipTemplate();
    },

    setAsError: function(error) {
        var buildSelector = function(error) {
                return 'error-' + error.stateName + '-' + error.browserId;
            },
            errorContainer = this._bodyNode.querySelector('.' + buildSelector(error));

        this.status = 'fail';

        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'error ' + buildSelector(error);
            this._bodyNode.appendChild(errorContainer);
        }

        errorContainer.innerHTML += errorTemplate(error);
    },

    setAsNewReference: function(result) {
        this.status = 'fail';
        this._bodyNode.innerHTML = noReferenceTemplate(result);

        this._suiteControls = new SuiteControls(this._bodyNode);
        this._suiteControls.setAsNewReference(this.retry.bind(this), this.updateReference.bind(this));
    },

    isFinished: function() {
        return this.status !== 'queued' &&
            this.status !== 'running';
    },

    updateReference: function() {
        var _this = this,
            postData = this._collectStateData();
        xhr.post('/update-ref', postData, function(error, response) {
            if (!error) {
                _this.setAsSuccess(response);
            }
        });
    },

    retry: function() {
        this._runStateHandler(this._collectStateData());
    },

    toggleRetry: function(isEnabled) {
        if (this._suiteControls) {
            this._suiteControls.toggleRetry(isEnabled);
        }
    },

    _collectStateData: function() {
        return {
            suite: this.suite,
            state: this.state,
            browserId: this.browserId
        };
    }
};

module.exports = Section;
