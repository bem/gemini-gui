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
            if (query.length > 1) {
                return _(query)
                    .map(this.find, this)
                    .compact()
                    .value();
            } else {
                query = query[0];
            }
        }

        var indexData = query.suite && this._index[query.suite.path],
            findStateIn = this._findStateIn.bind(this, query);

        var items = indexData? [findStateIn(indexData)] : _(this._index).map(findStateIn).flatten().value();
        items.states = indexData.states;
        return items;
    },

    _findStateIn: function(query, indexData) {
        if (!query.state || query.state.name == null) {
            return indexData.suite;
        }

        var stateData = indexData.states[query.state.name],
            findBrowserIn = this._findBrowserIn.bind(this, query.browserId);

        // Конкретный state не задан, значит считаем, что матчатся все стейты
        return stateData? findBrowserIn(stateData) : indexData.states.map(findBrowserIn);
    },

    _findBrowserIn: function(browserId, stateData) {
        if (browserId == null) {
            return stateData.state;
        }

        return stateData.browsers[browserId] || null;
    }

};

module.exports = TestsIndex;
