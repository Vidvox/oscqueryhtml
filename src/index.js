const osc = require('osc');
const oscTransports = require('osc-transports');
const oscWebsocketClient = require('osc-websocket-client');

function $(selector) {
    return document.querySelector(selector);
}

function objectGetValue(obj, i) {
    return obj[Object.keys(obj)[i]];
}

function buildFromQueryResult(result) {
    let contents = result.CONTENTS;
    // TODO: Iterate all directories?
    let dir = objectGetValue(contents, 0);
    let innerContents = dir.CONTENTS;
    let innerKeys = Object.keys(innerContents);
    for (let k = 0; k < innerKeys.length; k++) {
        let key = innerKeys[k];
        var control = buildSingleControl(key, innerContents[key]);
        var mainContents = $('#mainContents');
        mainContents.appendChild(control);
    }
}

function buildSingleControl(name, details) {
    var html = '';
    html += '<span class="control-name">' + name + '</span>';
    html += '<span class="full-path">' + details.FULL_PATH + '</span>';
    html += '<span class="description">' + details.DESCRIPTION + '</span>';
    var getter = null;
    var setter = null;
    if (details.TYPE == 'c') {
        // Char
        html += '<input data-event="keydown" type="text" maxlength="1" ' +
            'size="3"/>';
        getter = 'value';
    } else if (details.TYPE == 'r') {
        // Color
        html += '<input type="color" value="#4466ff" />';
        getter = 'color';
    } else if (details.TYPE == 'd') {
        // Double
        var min = details.RANGE[0].MIN;
        var max = details.RANGE[0].MAX;
        var value = 0;
        html += '<input type="range" min="' + min + '" max="' + max + '" ' +
            ' value="' + value + '" step="any"/>';
        html += '<span class="curr-val">' + value + '</span>';
        html += '<span class="range-val"> (' + min + '-' + max + ')</span>'
        getter = 'parseFloat';
        setter = 'float';
    } else if (details.TYPE == 'F') {
        // False
        html += '<input type="button" value="Send false"/>';
    } else if (details.TYPE == 'f') {
        // Float
        var min = details.RANGE[0].MIN;
        var max = details.RANGE[0].MAX;
        var value = 0;
        html += '<input type="range" min="' + min + '" max="' + max + '" ' +
            ' value="' + value + '" step="any"/>';
        html += '<span class="curr-val">' + value + '</span>';
        html += '<span class="range-val"> (' + min + '-' + max + ')</span>'
        getter = 'parseFloat';
        setter = 'float';
    } else if (details.TYPE == 'I') {
        // Infinity
        html += '<input type="button" value="Send infinity"/>';
    } else if (details.TYPE == 'i') {
        // Integer
        var min = details.RANGE[0].MIN;
        var max = details.RANGE[0].MAX;
        var value = 0;
        html += '<input type="range" min="' + min + '" max="' + max + '" ' +
            ' value="' + value + '"/>';
        html += '<span class="curr-val">' + value + '</span>';
        html += '<span class="range-val"> (' + min + '-' + max + ')</span>'
        getter = 'parseInt';
        setter = 'int';
    } else if (details.TYPE == 'h') {
        // Longlong
        var min = details.RANGE[0].MIN;
        var max = details.RANGE[0].MAX;
        html += '<input type="range" min="' + min + '" max="' + max + '"/>';
        getter = 'value';
    } else if (details.TYPE == 'm') {
        // Midi
        html += '<span class="type">TODO: midi node</span>';
        console.log('========================================');
        console.log(details);
    } else if (details.TYPE == 'N') {
        // Null
        html += '<input type="button" value="Send null"/>';
    } else if (details.TYPE == 's') {
        // String
        html += '<input type="text"/>';
        getter = 'value';
    } else if (details.TYPE == 'T') {
        // True
        html += '<input type="button" value="Send true"/>';
    } else if (details.TYPE == 't') {
        // Timetag
        html += '<span class="type">TODO: timetag node</span>';
        console.log('========================================');
        console.log(details);
    } else {
        html += '<span class="type">UNKNOWN (' + details.TYPE + ')</span>';
    }
    html += '<span class="details" ' +
        'data-full-path="' + details.FULL_PATH + '" ' +
        'data-type="' + details.TYPE + '" ';
    if (getter) {
        html += 'data-getter="' + getter + '" ';
    }
    if (setter) {
        html += 'data-setter="' + setter + '" ';
    }
    html += '/></span>';
    var div = document.createElement('div');
    div.setAttribute('class', 'control');
    div.innerHTML = html;
    return div;
}

var oscPort;
var isOscReady = false;

function initWebSocket(url) {
    oscPort = new osc.WebSocketPort({
        url: url,
        metadata: true
    });
    oscPort.open();
    oscPort.on('ready', function() {
        isOscReady = true;
    });
}

function controlEvent(e) {
    var controlElem = e.target.parentNode;
    var detailsElem = controlElem.querySelector('.details');
    var fullPath = detailsElem.attributes['data-full-path'].value;
    var dataType = detailsElem.attributes['data-type'].value;
    var getter = detailsElem.attributes['data-getter'];
    var setter = detailsElem.attributes['data-setter'];
    if (!getter) {
        var firstArg = {type: dataType};
    } else if (getter.value == 'value') {
        var firstArg = {type: dataType, value: e.target.value };
    } else if (getter.value == 'parseInt') {
        var firstArg = {type: dataType, value: parseInt(e.target.value) };
    } else if (getter.value == 'parseFloat') {
        var firstArg = {type: dataType, value: parseFloat(e.target.value) };
    } else if (getter.value == 'color') {
        var color = e.target.value;
        var r = parseInt(color.substr(1, 2), 16);
        var g = parseInt(color.substr(3, 2), 16);
        var b = parseInt(color.substr(5, 2), 16);
        var firstArg = {type: dataType, value: {r:r, g:g, b:b} };
    }
    if (setter) {
        if (setter.value == 'int') {
            var currValElem = controlElem.querySelector('.curr-val');
            currValElem.textContent = e.target.value;
        } else if (setter.value == 'float') {
            var currValElem = controlElem.querySelector('.curr-val');
            currValElem.textContent = Math.round(e.target.value * 1000 / 1000);
        }
    }
    var message = {
        address: fullPath,
        args: [firstArg],
    };
    console.log('***** Sending value: ' + JSON.stringify(message));
    if (isOscReady) {
        oscPort.send(message);
    }
}

function charKeyDownEvent(e) {
    e.target.value = e.key;
    controlEvent(e);
}

function getDataEvent(element) {
    if (element.attributes['data-event']) {
        return element.attributes['data-event'].value;
    }
    return null;
}

function addInputEventHandlers() {
    var inputs = document.getElementsByTagName("input");
    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        if (getDataEvent(input) == 'keydown') {
            input.addEventListener('keydown', charKeyDownEvent, false);
        } else if (input.type == "button") {
            input.addEventListener('click', controlEvent, false);
        } else {
            input.addEventListener('change', controlEvent, false);
        }
    }
}

module.exports = {
    initWebSocket: initWebSocket,
    buildFromQueryResult: buildFromQueryResult,
    addInputEventHandlers: addInputEventHandlers,
};
