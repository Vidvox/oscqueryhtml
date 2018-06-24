const osc = require('osc');
const oscTransports = require('osc-transports');
const oscWebsocketClient = require('osc-websocket-client');

const retrieve = require('./retrieve.js');
const colorpicker = require('./colorpicker.js');

const listenBase64 = require("base64-image-loader!../assets/img/listen.png");
const pressedBase64 = require("base64-image-loader!../assets/img/pressed.png");

var g_allControlStruct = null;
var g_hostInfo = null;
var g_extensions = null;
var g_idGen = 0;

function $(selector) {
    return document.querySelector(selector);
}

function objectGetValue(obj, i) {
    return obj[Object.keys(obj)[i]];
}

function generateId() {
    let result = g_idGen;
    g_idGen++;
    return result;
}

function storeHostInfo(hostInfo) {
    g_hostInfo = hostInfo;
    g_extensions = hostInfo.EXTENSIONS;
}

var g_supportHtml5Color = false;

function detectColorPicker() {
    let input = document.createElement('input');
    input.setAttribute('type', 'color');
    input.setAttribute('value', '$');
    g_supportHtml5Color = (input.type == 'color' && input.value != '$');
}

function buildColorPicker() {
    detectColorPicker();
    if (g_supportHtml5Color) {
        return;
    }
    let mainContentsElem = $('#mainContents');
    let colorPickerElem = document.createElement('div');
    colorPickerElem.id = 'colorPicker';
    colorPickerElem.innerHTML = '<div id="picker-wrapper"><div id="picker"></div></div><div id="slider-wrapper"><div id="slider"></div></div>';
    mainContentsElem.appendChild(colorPickerElem);
    let pickerElem = $('#picker');
    let sliderElem = $('#slider');
    ColorPicker(sliderElem, pickerElem, colorControlPickedColor);
}

function buildFromQueryResult(result) {
    let mainContentsElem = $('#mainContents');
    {
        let refreshMessageElem = document.createElement('div');
        refreshMessageElem.id = 'refresh-butter';
        refreshMessageElem.style.display = 'none';
        refreshMessageElem.style.backgroundColor = '#ffff88';
        refreshMessageElem.style.position = 'absolute';
        refreshMessageElem.style.top = '2px';
        refreshMessageElem.style.left = '2px';
        refreshMessageElem.style.textAlign = 'center';
        refreshMessageElem.style.width = '40%';
        refreshMessageElem.textContent = 'Changes found, refresh to see them';
        document.body.appendChild(refreshMessageElem);
    }
    let contents = result.CONTENTS;
    if (!contents) {
        let noControlsElem = document.createElement('div');
        noControlsElem = 'No controls detected';
        mainContentsElem.appendChild(noControlsElem);
        return;
    }
    if (g_extensions.LISTEN) {
        // Label for listen button.
        let labelDivElem = document.createElement('div');
        labelDivElem.className = 'listen-label';
        labelDivElem.textContent = 'Listen for OSC: ';
        mainContentsElem.appendChild(labelDivElem);
        // Listen button.
        let listenImgElem = document.createElement('img');
        listenImgElem.src = listenBase64;
        let listenSpanElem = document.createElement('span');
        listenSpanElem.className = 'listen-button';
        listenSpanElem.appendChild(listenImgElem);
        mainContentsElem.appendChild(listenSpanElem);
    }
    // Build contents for the main container.
    buildContentsAddToContainer(contents, mainContentsElem)
}

function buildContentsAddToContainer(contents, parentContainer) {
    let dirNames = Object.keys(contents);
    dirNames.sort();
    for (let j = 0; j < dirNames.length; j++) {
        let name = dirNames[j];
        let dirObj = contents[dirNames[j]];
        // Container for this directory.
        let directoryElem = document.createElement('div');
        if (dirObj.CONTENTS) {
            // TODO: Refactor into common utility function.
            var id = generateId();
            let html = '';
            html += '<div class="toggle-show" id="toggle_show_' + id +
                '" style="display:none">[+] '
            html += '<span class="dir-name">' + E(dirNames[j]) + '</span>';
            html += '</div>';
            html += '<div class="toggle-hide" id="toggle_hide_' + id + '">[-]';
            html += '</div>';
            html += '<div id="control_body_' + id + '">';
            html += '<span class="dir-name">' + E(dirNames[j]) + '</span>';
            html += '</div>';
            // Recursive call to handle the inner contents.
            directoryElem.innerHTML = html;
            directoryElem.className = 'dir-container';
            directoryContainer = directoryElem.querySelector('#control_body_' + id);
            buildContentsAddToContainer(dirObj.CONTENTS, directoryContainer);
        } else {
            // Build a control from the details.
            buildControlElements(directoryElem, name, dirObj);
        }
        parentContainer.appendChild(directoryElem);
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
            buildSingleControl(containerElem, name, details, type, selector);
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
    if (!text) {
        return "";
    }
    return text.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').
        replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildSingleControl(container, name, details, type, selector) {
    var id = generateId();
    var html = '';
    html += '<div id="control_body_' + id + '">';
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
            html += '<input data-event="keypress" type="text" maxlength="1" ' +
                'size="3"/>';
            getter = 'value';
        }
    } else if (type == 'r') {
        // Color
        if (g_supportHtml5Color) {
            html += '<input type="color" value="#4466ff" />';
        } else {
            html += '<div class="color-control"></div>'
        }
        getter = 'color';
        setter = 'color';
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
        if (details.RANGE && applySelector(details.RANGE, selector).VALS) {
            var values = applySelector(details.RANGE, selector).VALS;
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
    html += '</div>';
    container.innerHTML = html;
    container.className = 'control';
}

function extractControlPaths(obj) {
    var paths = [];
    if (obj.CONTENTS) {
        let dirNames = Object.keys(obj.CONTENTS);
        dirNames.sort();
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
    g_allControlStruct = extractControlPaths(data);
}

function textToHexColor(elem) {
    return '#' + num2Hex(elem['r']) + num2Hex(elem['g']) + num2Hex(elem['b']);
}

function num2Hex(num) {
    let hex = Number(num).toString(16);
    if (hex.length < 2) {
        hex = '0' + hex;
    }
    return hex;
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
                    let refreshElem = document.getElementById('refresh-butter');
                    refreshElem.style.display = 'inline';
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
            var setter = detailsElem.attributes['data-setter'];
            if (setter) {
                if (setter.value == 'color') {
                    value = textToHexColor(value);
                } else {
                    runSetter(controlElem, setter.value, targetElem.value);
                }
            }
            targetElem.value = value;
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
        var firstArg = {type: dataType, value: {r:r, g:g, b:b, a:1} };
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

function charKeyPressEvent(e) {
    e.target.value = String.fromCharCode(e.keyCode);
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
        for (let i = 0; i < g_allControlStruct.length; i++) {
            var path = g_allControlStruct[i];
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

function toggleHide(e) {
    let text = e.target.id;
    let id = text.substr(12);
    $('#control_body_' + id).style.display = 'none';
    $('#toggle_show_'  + id).style.display = 'block';
    $('#toggle_hide_'  + id).style.display = 'none';
}

function toggleShow(e) {
    let text = e.target.id;
    let id = text.substr(12);
    $('#control_body_' + id).style.display = 'block';
    $('#toggle_show_'  + id).style.display = 'none';
    $('#toggle_hide_'  + id).style.display = 'block';
}

function colorControlClick(e) {
    colorPickerElem = $('#colorPicker');
    colorPickerElem.style.display = 'inline';
    let y = e.target.offsetTop + 10;
    let x = e.target.offsetLeft + 20;
    colorPickerElem.style.position = 'absolute';
    colorPickerElem.style.top = y + 'px';
    colorPickerElem.style.left = x + 'px';
    colorPickerElem.controlTarget = e.target;
}

function colorControlPickedColor(hex, hsv, rgb) {
    colorPickerElem = $('#colorPicker');
    colorPickerElem.style.display = 'none';
    let controlElem = colorPickerElem.controlTarget;
    controlElem.style.backgroundColor = hex;
    controlElem.value = hex;
    controlEvent({
        target: controlElem,
    });
}

function addInputEventHandlers() {
    let inputs = document.getElementsByTagName("input");
    for (let i = 0; i < inputs.length; i++) {
        let input = inputs[i];
        if (getDataEvent(input) == 'keypress') {
            input.addEventListener('keypress', charKeyPressEvent, false);
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
    let listenButtons = document.getElementsByClassName('listen-button');
    for (let i = 0; i < listenButtons.length; i++) {
        let listenBtn = listenButtons[i];
        listenBtn.addEventListener('click', listenClick, false);
    }
    let toggleHideElems = document.getElementsByClassName('toggle-hide');
    for (let i = 0; i < toggleHideElems.length; i++) {
        let elem = toggleHideElems[i];
        elem.addEventListener('click', toggleHide, false);
    }
    let toggleShowElems = document.getElementsByClassName('toggle-show');
    for (let i = 0; i < toggleShowElems.length; i++) {
        let elem = toggleShowElems[i];
        elem.addEventListener('click', toggleShow, false);
    }
    let colorControlElems = document.getElementsByClassName('color-control');
    for (let i = 0; i < colorControlElems.length; i++) {
        let elem = colorControlElems[i];
        elem.addEventListener('click', colorControlClick, false);
    }
}

function createApp(serverUrl) {
    initWebSocket(serverUrl.replace("http", "ws"));
    retrieve.retrieveHostInfo(serverUrl, (hostInfo) => {
        storeHostInfo(hostInfo);
        retrieve.retrieveJson(serverUrl, (result) => {
            buildColorPicker();
            buildFromQueryResult(result);
            storeControlStructure(result);
            addInputEventHandlers();
        });
    });
}

module.exports = {
    createApp: createApp,
};
