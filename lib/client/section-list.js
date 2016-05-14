/*jshint browser:true*/
'use strict';
var Section = require('./section'),
    Index = require('../common/tests-index'),
    map = Array.prototype.map,
    every = Array.prototype.every;

function SectionList(controller) {
    this._controller = controller;
    this._sectionsIndex = new Index();
    this._sections = map.call(document.querySelectorAll('.section'), function(node) {
        var parentNode = this._findParentSectionNode(node),
            section = new Section(node, parentNode && this._sectionForNode(parentNode), this._onRunState.bind(this));

        this._sectionsIndex.add(section);
        return section;
    }, this);
}

SectionList.prototype = {
    constructor: SectionList,

    expandAll: function() {
        this._sections.forEach(function(section) {
            section.expand();
        });
    },

    collapseAll: function() {
        this._sections.forEach(function(section) {
            section.collapse();
        });
    },

    expandErrors: function() {
        this._sections.forEach(function(section) {
            section.expandIfError();
        });
    },

    markAsQueued: function(leafQueries) {
        leafQueries = [].concat(leafQueries);

        var _this = this;

        this._sectionsIndex.find(leafQueries)
            .forEach(function(section) {
                section.setAsQueued();

                while ((section = _this.findParent(section))) {
                    section.status = 'queued';
                }
            });
    },

    markAllAsQueued: function() {
        this._sections.forEach(function(section) {
            section.status = 'queued';
        });
    },

    markIfFinished: function(sections) {
        if (!Array.isArray(sections)) {
            sections = [sections];
        }

        sections.forEach(function(section) {
            if (section.status === 'fail') {
                //already marked as fail
                return;
            }
            var nodes = section.domNode.querySelectorAll('.section');
            var allChildrenFinished = every.call(nodes, function(node) {
                return this._sectionForNode(node).isFinished();
            }, this);

            if (allChildrenFinished) {
                section.status = 'success';
            }
        }.bind(this));
    },

    markBranchAsFailed: function(fromSection) {
        while ((fromSection = this.findParent(fromSection))) {
            fromSection.status = 'fail';
            fromSection.expand();
        }
    },

    resetErrors: function() {
        Array.from(document.querySelectorAll('.error')).forEach(function(e) {
            e.innerHTML = '';
        });
    },

    findSection: function(query) {
        return this._sectionsIndex.find(query);
    },

    findParent: function(section) {
        if (section.browserId) {
            return this.findSection({
                suite: section.suite,
                state: section.state
            })[0];
        }

        if (section.state && section.state.name) {
            return this.findSection({suite: section.suite})[0];
        }
        var parentSectionNode = this._findParentSectionNode(section.domNode);
        if (parentSectionNode) {
            return this._sectionForNode(parentSectionNode);
        }
        return null;
    },

    findFailedStates: function() {
        return this._sections
            .filter(function(section) {
                return section.status === 'fail' && section.browserId;
            })
            .map(function(section) {
                return {
                    suite: section.suite,
                    state: section.state,
                    browserId: section.browserId
                };
            });
    },

    toggleRetry: function(isEnabled) {
        this._sections.forEach(function(section) {
            section.toggleRetry(isEnabled);
        });
    },

    _findParentSectionNode: function(node) {
        while ((node = node.parentNode)) {
            if (node.classList && node.classList.contains('section')) {
                return node;
            }
        }
        return null;
    },

    _sectionForNode: function(domNode) {
        var query = {
            suite: {path: domNode.getAttribute('data-suite-path')},
            state: {name: domNode.getAttribute('data-state-name')},
            browserId: domNode.getAttribute('data-browser-id')
        };

        return this.findSection(query)[0];
    },

    _onRunState: function(state) {
        this._controller.runState(state);
    }
};

module.exports = SectionList;
