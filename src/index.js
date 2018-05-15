const osc = require('osc');
const oscTransports = require('osc-transports');
const oscWebsocketClient = require('osc-websocket-client');

const retrieve = require('./retrieve.js');

const listenBase64 = require("base64-image-loader!../assets/img/listen.png");
const pressedBase64 = require("base64-image-loader!../assets/img/pressed.png");

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
    html += '<span class="listen-button"><img src="';
    html += listenBase64;
    html += '" width=24 height=24/></span>';
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
        if (details.RANGE) {
            var min = details.RANGE[0].MIN;
            var max = details.RANGE[0].MAX;
            var value = details.VALUE || 0;
            html += '<input type="range" min="' + min + '" max="' + max + '" ' +
                ' value="' + value + '" step="any"/>';
            html += '<span class="curr-val">' + value + '</span>';
            html += '<span class="range-val"> (' + min + '-' + max + ')</span>'
        } else {
            var value = details.VALUE || 0;
            html += '<input type="range" value="' + value + '" step="any"/>';
            html += '<span class="curr-val">' + value + '</span>';
        }
        getter = 'parseFloat';
        setter = 'float';
    } else if (details.TYPE == 'F') {
        // False
        html += '<input type="button" value="Send false"/>';
    } else if (details.TYPE == 'f') {
        // Float
        if (details.RANGE) {
            var min = details.RANGE[0].MIN;
            var max = details.RANGE[0].MAX;
            var value = details.VALUE || 0;
            html += '<input type="range" min="' + min + '" max="' + max + '" ' +
                ' value="' + value + '" step="any"/>';
            html += '<span class="curr-val">' + value + '</span>';
            html += '<span class="range-val"> (' + min + '-' + max + ')</span>'
        } else {
            var value = details.VALUE || 0;
            html += '<input type="range" value="' + value + '" step="any"/>';
            html += '<span class="curr-val">' + value + '</span>';
        }
        getter = 'parseFloat';
        setter = 'float';
    } else if (details.TYPE == 'I') {
        // Infinity
        html += '<input type="button" value="Send infinity"/>';
    } else if (details.TYPE == 'i') {
        // Integer
        if (details.RANGE) {
            var min = details.RANGE[0].MIN;
            var max = details.RANGE[0].MAX;
            var value = details.VALUE || 0;
            html += '<input type="range" min="' + min + '" max="' + max + '" ' +
                ' value="' + value + '"/>';
            html += '<span class="curr-val">' + value + '</span>';
            html += '<span class="range-val"> (' + min + '-' + max + ')</span>'
        } else {
            var value = details.VALUE || 0;
            html += '<input type="range" value="' + value + '"/>';
            html += '<span class="curr-val">' + value + '</span>';
        }
        getter = 'parseInt';
        setter = 'int';
    } else if (details.TYPE == 'h') {
        // Longlong
        var min = details.RANGE[0].MIN;
        var max = details.RANGE[0].MAX;
        if (details.RANGE) {
            html += '<input type="range" min="' + min + '" max="' + max + '"/>';
        } else {
            html += '<input type="range" />';
        }
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
        oscPort.socket.onmessage = function(e) {
            // Check if message was a JSON command.
            var msg = null;
            try {
                msg = JSON.parse(e.data);
            } catch (e) {
                // pass
            }
            if (msg) {
                if (msg.COMMAND == 'PATH_CHANGED') {
                    // TODO: Handle this message.
                } else {
                    console.log('??????????');
                    console.log('Unknown message: ' + e.data);
                }
                return;
            }
            // Non-JSON data, assume it's a binary OSC packet.
            var packet = osc.readPacket(new Uint8Array(e.data), {});
            console.log('***** Got packet <' + JSON.stringify(packet) + '>');
            var address = packet.address;
            var value = packet.args[0];
            // TODO: Validate address contains allowed characters.
            var query = '[data-full-path="' + address + '"]';
            var detailsElem = document.querySelector(query);
            // Apply OSC packet by setting control value, update UI.
            var controlElem = detailsElem.parentNode;
            var targetElem = controlElem.querySelector('input');
            targetElem.value = value;
            var setter = detailsElem.attributes['data-setter'];
            if (setter) {
                runSetter(controlElem, setter.value, targetElem.value);
            }
        }
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
        runSetter(controlElem, setter.value, e.target.value);
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

function runSetter(controlElem, type, value) {
    if (type == 'int') {
        var currValElem = controlElem.querySelector('.curr-val');
        currValElem.textContent = value;
    } else if (type == 'float') {
        var currValElem = controlElem.querySelector('.curr-val');
        currValElem.textContent = Math.round(value * 1000) / 1000;
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

function listenClick(e) {
    var imgElem = e.target;
    var spanElem = imgElem.parentNode;
    if (spanElem.className.indexOf('pressed') == -1) {
        imgElem.src = pressedBase64;
        spanElem.className = 'listen-button pressed';
        var fullPathElem = spanElem.parentNode.querySelector('.full-path');
        var path = fullPathElem.textContent;
        if (isOscReady) {
            var msg = JSON.stringify(
{
    'COMMAND': 'LISTEN',
    'DATA': path
});
            console.log('***** Sending WS: ' + msg);
            oscPort.socket.send(msg);
        }

    } else {
        imgElem.src = listenBase64;
        spanElem.className = 'listen-button';
    }
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
    var listenButtons = document.getElementsByClassName("listen-button");
    for (var i = 0; i < listenButtons.length; i++) {
        var listenBtn = listenButtons[i];
        listenBtn.addEventListener('click', listenClick, false);
    }
}

function createApp(serverUrl) {
    initWebSocket(serverUrl.replace("http", "ws"));
    retrieve.retrieveHostInfo(serverUrl, (hostInfo) => {
        // TODO: Parse the hostInfo, act based upon what extensions are allowed.
        console.log(hostInfo);
        retrieve.retrieveJson(serverUrl, (result) => {
            buildFromQueryResult(result);
            addInputEventHandlers();
        });
    });
}

module.exports = {
    createApp: createApp,
};
