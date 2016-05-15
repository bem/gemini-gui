/*jshint browser:true*/
'use strict';

exports.post = function(url, data, callback) {
    if (!callback) {
        callback = data;
        data = null;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        var data = JSON.parse(xhr.responseText);
        if (xhr.status === 200) {
            callback(null, data);
        } else {
            callback(new Error(data.error));
        }
    };
    xhr.onerror = function(e) {
        callback(e);
    };

    if (data) {
        xhr.send(JSON.stringify(data));
    } else {
        xhr.send();
    }
};

exports.request = function(verb, url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open(verb, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        var data = JSON.parse(xhr.responseText);
        if (xhr.status === 200) {
            callback(null, data);
        } else {
            callback(new Error(data.error));
        }
    };
    xhr.onerror = function(e) {
        callback(e);
    };

    xhr.send();
};

exports.get = function(url, callback) {
    return this.request('GET', url, callback);
};
