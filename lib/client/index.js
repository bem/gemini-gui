/*jshint browser:true*/
'use strict';
var Controller = require('./controller'),
    forEach = Array.prototype.forEach,
    filter = Array.prototype.filter,
    hbruntime = require('hbsfy/runtime'),
    xhr = require('./xhr');

hbruntime.registerPartial('cswitcher', require('../views/partials/cswitcher.hbs'));
hbruntime.registerPartial('suite-controls', require('../views/partials/suite-controls.hbs'));
hbruntime.registerPartial('controls', require('../views/partials/controls.hbs'));

function bodyClick(e) {
    var target = e.target;
    if (target.classList.contains('cswitcher__item')) {
        handleColorSwitch(
            target,
            filter.call(target.parentNode.childNodes, function(node) {
                return node.nodeType === Node.ELEMENT_NODE;
            })
        );
    }
}

function handleColorSwitch(target, sources) {
    var imageBox = findClosest(target, 'image-box');

    sources.forEach(function(item) {
        item.classList.remove('cswitcher__item_selected');
    });
    forEach.call(imageBox.classList, function(cls) {
        if (/cswitcher_color_\d+/.test(cls)) {
            imageBox.classList.remove(cls);
        }
    });

    target.classList.add('cswitcher__item_selected');
    imageBox.classList.add('cswitcher_color_' + target.dataset.id);
}

function findClosest(context, cls) {
    while ((context = context.parentNode)) {
        if (context.classList.contains(cls)) {
            return context;
        }
    }
}

function gotoSuiteCode(e) {
    var suiteText = Array.from(e.target.parentNode.childNodes).filter(function(el) {
        return el && el.classList && el.classList.contains('section__title-text');
    })[0].innerText.trim();
    xhr.get('/suite-code-position?suite=' + encodeURIComponent(suiteText), function(err, data) {
        if (err) {
            alert('Server is not responding. Try later.'); // jshint ignore:line
            return;
        }
        openWebStorm(data, function(result) {
            if (!result) { // ws not opened
                openGithub(data, e);
                alert('WebStorm is not started\n' + // jshint ignore:line
                    'or WS Platform TeamCity Integration plugin is not installed.\n' +
                    'https://quigon.yandex.ru/update/TeamCity-IDEAplugin.zip');
            }
        });
    });
}

function openWebStorm(data, callback) {
    var wsMagicUrl = 'http://' + location.hostname +
        ':63330/file?buildId=&file=' + data.file + '&line=' + data.line +
        '&noCache=' + (Math.random() * 1e6) + '&server=' + encodeURIComponent(location.origin);

    xhr.get(wsMagicUrl, function(err, res) {
        callback(!err);
    });
    return true;
}

function openGithub(data, e) {
    openTab('https://' + data.repo + '/blob/' + data.branch.current + '/' + data.file + '#L' + data.line, data, e);
}

function openTab(url, data, e) {
    var a = document.createElement('a');
    a.href = url;
    a.setAttribute('target', '_blank');
    a.click(); // try to open
    a.innerText = data.file + ':' + data.line;
    a.className = 'section__title-goto-link';
    a.onclick = function(e) {
        e.stopPropagation();
    };
    e.target.parentNode.appendChild(a);
}

document.addEventListener('DOMContentLoaded', function() {
    window.controller = new Controller();
    document.body.addEventListener('click', bodyClick);

    Array.from(document.querySelectorAll('.section__title-goto')).forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            gotoSuiteCode(e);
        });
    });
});
