const osc = require('osc');
const oscTransports = require('osc-transports');
const oscWebsocketClient = require('osc-websocket-client');

const retrieve = require('./retrieve.js');

const listenBase64 = require("base64-image-loader!../assets/img/listen.png");
const pressedBase64 = require("base64-image-loader!../assets/img/pressed.png");

var allControlStruct = null;

function $(selector) {
    return document.querySelector(selector);
}

function objectGetValue(obj, i) {
    return obj[Object.keys(obj)[i]];
}

function buildFromQueryResult(result) {
    let mainContentsElem = $('#mainContents');
    let contents = result.CONTENTS;
    if (!contents) {
        let noControlsElem = document.createElement('div');
        noControlsElem = 'No controls detected';
        mainContentsElem.append(noControlsElem);
        return;
    }
    // Label for listen button.
    let labelDivElem = document.createElement('div');
    labelDivElem.className = 'listen-label';
    labelDivElem.textContent = 'Listen for OSC: ';
    mainContentsElem.append(labelDivElem);
    // Listen button.
    let listenImgElem = document.createElement('img');
    listenImgElem.src = listenBase64;
    let listenSpanElem = document.createElement('span');
    listenSpanElem.className = 'listen-button';
    listenSpanElem.appendChild(listenImgElem);
    mainContentsElem.append(listenSpanElem);
    // Build contents for the main container.
    buildContentsAddToContainer(contents, mainContentsElem)
}

function buildContentsAddToContainer(contents, parentContainer) {
    let dirNames = Object.keys(contents);
    for (let j = 0; j < dirNames.length; j++) {
        let name = dirNames[j];
        let dirObj = contents[dirNames[j]];
        // Container for this directory.
        let directoryElem = document.createElement('div');
        if (dirObj.CONTENTS) {
            // Recursive call to handle the inner contents.
            directoryElem.className = 'dir-container';
            directoryElem.innerHTML = (
                '<span class="dir-name">' + E(dirNames[j]) + '</span>');
            buildContentsAddToContainer(dirObj.CONTENTS, directoryElem);
        } else {
            // Build a control from the details.
            buildControlElements(directoryElem, name, dirObj);
        }
        parentContainer.append(directoryElem);
    }
}

function buildControlElements(containerElem, name, details) {
    let selector = [0];
    for (let i = 0; i < details.TYPE.length; i++) {
        let type = details.TYPE[i];
        if (type == '[') {
            selector.push(0);
            continue;
        } else if (type == ']') {
            selector.pop();
        } else {
            var control = buildSingleControl(name, details, type, selector);
            if (control) {
                containerElem.appendChild(control);
            }
        }
        selector[selector.length - 1]++;
    }
}

function applySelector(obj, selector) {
    for (let n = 0; n < selector.length; n++) {
        let i = selector[n];
        obj = obj[i];
    }
    return obj;
}

function E(text) {
    return text.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').
        replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildSingleControl(name, details, type, selector) {
    var html = '';
    html += '<span class="control-name">' + E(name) + '</span>';
    html += '<span class="full-path">' + E(details.FULL_PATH) + '</span>';
    html += '<span class="description">' + E(details.DESCRIPTION) + '</span>';
    var getter = null;
    var setter = null;
    if (type == 'c') {
        // Char
        if (details.RANGE && applySelector(details.RANGE, selector).VALS) {
            var values = applySelector(details.RANGE, selector).VALS;
            // TODO: Set initial value from details.VALUE
            html += '<select>';
            for (let i = 0; i < values.length; i++) {
                let v = values[i];
                html += '<option value="' + E(v) + '">' + E(v) + '</option>'
            }
            html += '</select>';
            getter = 'value';
        } else {
            html += '<input data-event="keydown" type="text" maxlength="1" ' +
                'size="3"/>';
            getter = 'value';
        }
    } else if (type == 'r') {
        // Color
        html += '<input type="color" value="#4466ff" />';
        getter = 'color';
    } else if (type == 'd') {
        // Double
        if (details.RANGE) {
            var min = applySelector(details.RANGE, selector).MIN;
            var max = applySelector(details.RANGE, selector).MAX;
            var value = details.VALUE || 0;
            html += '<input type="range" min="' + E(min) + '" max="' +
                E(max) + '" value="' + E(value) + '" step="any"/>';
            html += '<span class="curr-val">' + E(value) + '</span>';
            html += '<span class="range-val"> (' + E(min) + '-' +
                E(max) + ')</span>'
        } else {
            var value = details.VALUE || 0;
            html += '<input type="range" value="' + E(value) + '" step="any"/>';
            html += '<span class="curr-val">' + E(value) + '</span>';
        }
        getter = 'parseFloat';
        setter = 'float';
    } else if (type == 'F') {
        // False
        html += '<input type="button" value="Send false"/>';
    } else if (type == 'f') {
        // Float
        if (details.RANGE) {
            var min = applySelector(details.RANGE, selector).MIN;
            var max = applySelector(details.RANGE, selector).MAX;
            var value = details.VALUE || 0;
            html += '<input type="range" min="' + E(min) + '" max="' +
                E(max) + '" value="' + E(value) + '" step="any"/>';
            html += '<span class="curr-val">' + E(value) + '</span>';
            html += '<span class="range-val"> (' + E(min) + '-' +
                E(max) + ')</span>'
        } else {
            var value = details.VALUE || 0;
            html += '<input type="range" value="' + E(value) + '" step="any"/>';
            html += '<span class="curr-val">' + E(value) + '</span>';
        }
        getter = 'parseFloat';
        setter = 'float';
    } else if (type == 'I') {
        // Infinity
        html += '<input type="button" value="Send infinity"/>';
    } else if (type == 'i') {
        // Integer
        if (details.RANGE && applySelector(details.RANGE, selector).VALS) {
            var values = applySelector(details.RANGE, selector).VALS;
            // TODO: Set initial value from details.VALUE
            html += '<select>';
            for (let i = 0; i < values.length; i++) {
                let v = values[i];
                html += '<option value="' + E(v) + '">' + E(v) + '</option>'
            }
            html += '</select>';
            getter = 'parseInt';
        } else if (details.RANGE) {
            var min = applySelector(details.RANGE, selector).MIN;
            var max = applySelector(details.RANGE, selector).MAX;
            var value = details.VALUE || 0;
            html += '<input type="range" min="' + E(min) + '" max="' +
                E(max) + '" value="' + E(value) + '"/>';
            html += '<span class="curr-val">' + E(value) + '</span>';
            html += '<span class="range-val"> (' + E(min) + '-' +
                E(max) + ')</span>'
            getter = 'parseInt';
            setter = 'int';
        } else {
            var value = details.VALUE || 0;
            html += '<input type="range" value="' + E(value) + '"/>';
            html += '<span class="curr-val">' + E(value) + '</span>';
            getter = 'parseInt';
            setter = 'int';
        }
    } else if (type == 'h') {
        // Longlong
        var min = applySelector(details.RANGE, selector).MIN;
        var max = applySelector(details.RANGE, selector).MAX;
        if (details.RANGE) {
            html += '<input type="range" min="' + E(min) + '" max="'
                + E(max) + '"/>';
        } else {
            html += '<input type="range" />';
        }
        getter = 'value';
    } else if (type == 'm') {
        // MIDI
        return null;
    } else if (type == 'N') {
        // Null
        html += '<input type="button" value="Send null"/>';
    } else if (type == 's') {
        // String
        if (details.RANGE && applySelector(details.RANGE, selector).VALS) {
            var values = applySelector(details.RANGE, selector).VALS;
            // TODO: Set initial value from details.VALUE
            html += '<select>';
            for (let i = 0; i < values.length; i++) {
                let v = values[i];
                html += '<option value="' + E(v) + '">' + E(v) + '</option>'
            }
            html += '</select>';
            getter = 'value';
        } else {
            html += '<input type="text"/>';
            getter = 'value';
        }
    } else if (type == 'T') {
        // True
        html += '<input type="button" value="Send true"/>';
    } else if (type == 't') {
        // Timetag
        return null;
    } else {
        html += '<span class="type">UNKNOWN (' + E(type) + ')</span>';
    }
    html += '<span class="details" data-full-path="' + E(details.FULL_PATH) +
        '" data-type="' + E(type) + '" ';
    if (getter) {
        html += 'data-getter="' + E(getter) + '" ';
    }
    if (setter) {
        html += 'data-setter="' + E(setter) + '" ';
    }
    html += '/></span>';
    var div = document.createElement('div');
    div.setAttribute('class', 'control');
    div.innerHTML = html;
    return div;
}

function extractControlPaths(obj) {
    var paths = [];
    if (obj.CONTENTS) {
        let dirNames = Object.keys(obj.CONTENTS);
        for (let j = 0; j < dirNames.length; j++) {
            let name = dirNames[j];
            let dirObj = obj.CONTENTS[dirNames[j]];
            paths = paths.concat(extractControlPaths(dirObj));
        }
    } else if (obj.FULL_PATH) {
        paths.push(obj.FULL_PATH);
    }
    return paths;
}

function storeControlStructure(data) {
    allControlStruct = extractControlPaths(data);
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

function rangeModifyEvent(e) {
    let value = e.target.value;
    // Cache value so that it won't send twice in a row.
    if (e.target.cacheValue === value) {
        return;
    }
    e.target.cacheValue = value
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
    var path = '/';
    var command = null;
    if (spanElem.className.indexOf('pressed') == -1) {
        imgElem.src = pressedBase64;
        spanElem.className = 'listen-button pressed';
        command = 'LISTEN';
    } else {
        imgElem.src = listenBase64;
        spanElem.className = 'listen-button';
        command = 'IGNORE';
    }
    if (isOscReady && command) {
        for (let i = 0; i < allControlStruct.length; i++) {
            var path = allControlStruct[i];
            var msg = JSON.stringify(
{
    'COMMAND': command,
    'DATA': path
});
            console.log('***** Sending WS: ' + msg);
            oscPort.socket.send(msg);
        }
    }
}

function addInputEventHandlers() {
    let inputs = document.getElementsByTagName("input");
    for (let i = 0; i < inputs.length; i++) {
        let input = inputs[i];
        if (getDataEvent(input) == 'keydown') {
            input.addEventListener('keydown', charKeyDownEvent, false);
        } else if (input.type == "button") {
            input.addEventListener('click', controlEvent, false);
        } else if (input.type == "range") {
            input.addEventListener('input', rangeModifyEvent, false);
            input.addEventListener('change', rangeModifyEvent, false);
        } else {
            input.addEventListener('change', controlEvent, false);
        }
    }
    let selects = document.getElementsByTagName("select");
    for (let i = 0; i < selects.length; i++) {
        let select = selects[i];
        select.addEventListener('change', controlEvent, false);
    }
    let listenButtons = document.getElementsByClassName("listen-button");
    for (let i = 0; i < listenButtons.length; i++) {
        let listenBtn = listenButtons[i];
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
            storeControlStructure(result);
            addInputEventHandlers();
        });
    });
}

module.exports = {
    createApp: createApp,
};
