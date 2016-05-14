'use strict';

var _ = require('lodash');

function TestsIndex() {
    this._index = {};
}

TestsIndex.prototype = {
    constructor: TestsIndex,

    add: function(item) {
        if (!item.suite || item.suite.path == null) {
            return;
        }

        var indexData = this._index[item.suite.path];
        if (!indexData) {
            indexData = this._index[item.suite.path] = {
                suite: null,
                states: {}
            };
        }

        if (!item.state || item.state.name == null) {
            indexData.suite = item;
            return;
        }

        var stateData = indexData.states[item.state.name];
        if (!stateData) {
            stateData = indexData.states[item.state.name] = {
                state: null,
                browsers: {}
            };
        }

        if (item.browserId == null) {
            stateData.state = item;
            return;
        }
        stateData.browsers[item.browserId] = item;
    },

    find: function(query) {
        if (Array.isArray(query)) {
            return _(query)
                .map(this.find, this)
                .compact()
                .value();
        }

        var indexData = query.suite && this._index[query.suite.path];
        if (!indexData) {
            return null;
        }
        if (!query.state || query.state.name == null) {
            return indexData.suite;
        }
        var stateData = indexData.states[query.state.name];
        if (!stateData) {
            return null;
        }

        if (query.browserId == null) {
            return stateData.state;
        }

        return stateData.browsers[query.browserId] || null;
    },

    getSectionStates: function(suitePath) {
        var indexData = this._index[suitePath];
        return indexData.states;
    }
};

module.exports = TestsIndex;
