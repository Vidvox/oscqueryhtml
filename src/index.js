const osc = require('osc');
const oscTransports = require('osc-transports');
const oscWebsocketClient = require('osc-websocket-client');

const retrieve = require('./retrieve.js');
const colorpicker = require('./colorpicker.js');

const listenBase64 = require("base64-image-loader!../assets/img/listen.png");
const pressedBase64 = require("base64-image-loader!../assets/img/pressed.png");
const toggleMinusBase64 = require("base64-image-loader!../assets/img/toggle-minus.png");
const togglePlusBase64 = require("base64-image-loader!../assets/img/toggle-plus.png");

var g_allControlStruct = null;
var g_hostInfo = {};
var g_extensions = null;
var g_idGen = 0;
var g_isListenEnabled = false;
var g_serverUrl = null;

const DEFAULT_COLOR_ELEM_VALUE = '#4466ff';

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

// Create a singleton color picker, only if this browser does not support
// the built-in html5 color picker element.
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

// Build all controls from json object, from the top-level.
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
        refreshMessageElem.textContent = 'Changes found, refreshing...';
        document.body.appendChild(refreshMessageElem);
    }
    let contents = result.CONTENTS;
    if (!contents) {
        let noControlsElem = document.createElement('div');
        noControlsElem.textContent = 'No controls detected';
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

// Build controls recursively based upon the json, and append to the parent.
function buildContentsAddToContainer(contents, parentContainer) {
    let dirNames = Object.keys(contents);
    dirNames.sort();
    for (let j = 0; j < dirNames.length; j++) {
        let nodeName = dirNames[j];
        let dirObj = contents[dirNames[j]];
        // Container for this node.
        let directoryElem = document.createElement('div');
        if (!dirObj.CONTENTS && !dirObj.TYPE) {
            directoryElem.innerHTML = (
                '<span class="error">Invalid node: ' +
                'Needs either CONTENTS or TYPE or BOTH</span>');
            parentContainer.appendChild(directoryElem);
            continue;
        }
        let id = generateId();
        let html = '<header>';
        // If this has CONTENTS, build a directory node.
        if (dirObj.CONTENTS) {
            // Toggle button when this is collapsed, will show the node.
            html += '<div class="toggle-show" id="toggle_show_' + id +
                '" style="display:none">';
            html += '<img class="toggle-show" src="' + togglePlusBase64 + '"/>';
            html += '<span class="dir-name"> ' + E(dirNames[j]) + '</span>';
            html += '</div>';
            // Toggle button when this is expanded, will hide the node.
            html += '<div class="toggle-hide" id="toggle_hide_' + id + '">';
            html += '<img class="toggle-hide" src="' + toggleMinusBase64 +'"/>';
            html += '<span class="dir-name">' + E(dirNames[j]) + '</span>';
            html += '</div>';
            directoryElem.className = 'dir-container';
        }
        html += '</header>';
        // Main body. This is the element that toggle shows or hides.
        html += '<div id="control_body_' + id +
            '" data-dir-path="' + dirObj.FULL_PATH + '">';
        html += '</div>';
        directoryElem.innerHTML = html;
        let nodeContainer = directoryElem.querySelector('#control_body_' + id);
        // If this has TYPE, build control(s) from the details.
        if (dirObj.TYPE) {
            directoryElem.classList.add('node');
            buildControlElements(nodeContainer, nodeName, dirObj);
        }
        // If this has CONTENTS, recursively handle the inner contents.
        if (dirObj.CONTENTS) {
            buildContentsAddToContainer(dirObj.CONTENTS, nodeContainer);
            directoryElem.appendChild(nodeContainer);
        }
        parentContainer.appendChild(directoryElem);
    }
}

// Add an element to the parent, with the tag, class, and text content.
function createAppendElem(parentElem, tagName, className, text) {
    let elem = document.createElement(tagName);
    elem.className = className;
    elem.textContent = text;
    parentElem.appendChild(elem);
}

// Add control nodes. Iterate the type field, adding one node per kind of type.
function buildControlElements(containerElem, name, details) {
    // Handle the case where a directory is also a control.
    let existingName = containerElem.parentNode.querySelector('.dir-name');
    if (!existingName) {
        createAppendElem(containerElem, 'span', 'control-name', name);
    }
    createAppendElem(containerElem, 'span', 'full-path', details.FULL_PATH);
    createAppendElem(containerElem, 'span', 'description', details.DESCRIPTION);
    let groupElem = document.createElement('div');
    groupElem.className = 'group';
    let selector = [0];
    let pos = 0;
    for (let i = 0; i < details.TYPE.length; i++) {
        let type = details.TYPE[i];
        if (type == '[') {
            selector.push(0);
            continue;
        } else if (type == ']') {
            selector.pop();
        } else {
            let html = buildSingleControl(details, type, selector, pos);
            if (html) {
                var id = generateId();
                let elem = document.createElement('div');
                elem.id = 'control_body_' + id;
                elem.className = 'control type_' + typeToControlName(type);
                elem.innerHTML = html;
                groupElem.appendChild(elem);
            }
            pos += 1;
        }
        selector[selector.length - 1]++;
    }
    containerElem.appendChild(groupElem);
}

function applySelector(obj, selector, key) {
    if (!obj) {
        return null;
    }
    for (let n = 0; n < selector.length; n++) {
        let i = selector[n];
        obj = obj[i];
        if (!obj) {
            return null;
        }
    }
    return obj[key];
}

function applyPos(obj, pos) {
    if (!obj) {
        return null;
    }
    return obj[pos];
}

function typeToControlName(type) {
    if (type == 'c') {
        return 'char';
    } else if (type == 'r') {
        return 'color';
    } else if (type == 'd') {
        return 'double';
    } else if (type == 'F') {
        return 'false';
    } else if (type == 'f') {
        return 'float';
    } else if (type == 'I') {
        return 'infinity';
    } else if (type == 'i') {
        return 'integer';
    } else if (type == 'h') {
        return 'longlong';
    } else if (type == 'm') {
        return 'midi';
    } else if (type == 'N') {
        return 'null';
    } else if (type == 'a') {
        return 'string';
    } else if (type == 'T') {
        return 'true';
    } else if (type == 't') {
        return 'timetag';
    } else {
        return 'unknown';
    }
}

function E(text) {
    if (text === 0) {
        return "0";
    }
    if (!text) {
        return "";
    }
    return text.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').
        replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildSingleControl(details, type, selector, pos) {
    var html = '';
    var getter = null;
    var setter = null;
    if (type == 'c') {
        // Char
        if (details.RANGE && applySelector(details.RANGE, selector, 'VALS')) {
            var options = applySelector(details.RANGE, selector, 'VALS');
            var value = applyPos(details.VALUE, pos) || '';
            html += '<select>';
            for (let i = 0; i < options.length; i++) {
                let v = options[i];
                html += '<option value="' + E(v) + '" ';
                if (v == value) {
                    html += 'selected ';
                }
                html += '>' + E(v) + '</option>';
            }
            html += '</select>';
            getter = 'value';
        } else {
            var value = applyPos(details.VALUE, pos) || '';
            html += '<input data-event="keypress" type="text" maxlength="1" ' +
                'size="3" value="' + E(value) + '"/>';
            getter = 'value';
        }
    } else if (type == 'r') {
        // Color
        var value = applyPos(details.VALUE, pos);
        if (value) {
            value = convertOSCColorToHex(value);
        } else {
            value = DEFAULT_COLOR_ELEM_VALUE;
        }
        if (g_supportHtml5Color) {
            html += '<input type="color" value="' + value + '" />';
        } else {
            html += '<div class="color-control" ';
            html += 'style="background-color:' + value + '"></div>'
        }
        getter = 'color';
        setter = 'color';
    } else if (type == 'd') {
        // Double
        if (details.RANGE && applySelector(details.RANGE, selector, 'VALS')) {
            var options = applySelector(details.RANGE, selector, 'VALS');
            var value = applyPos(details.VALUE, pos) || 0;
            html += '<select>';
            for (let i = 0; i < options.length; i++) {
                let v = options[i];
                html += '<option value="' + E(v) + '" ';
                if (v == value) {
                    html += 'selected ';
                }
                html += '>' + E(v) + '</option>';
            }
            html += '</select>';
            getter = 'value';
        } else if (details.RANGE) {
            var min = applySelector(details.RANGE, selector, 'MIN') || 0;
            var max = applySelector(details.RANGE, selector, 'MAX') || 1;
            var value = applyPos(details.VALUE, pos) || 0;
            html += '<input type="range" min="' + E(min) + '" max="' +
                E(max) + '" value="' + E(value) + '" step="any"/>';
            html += '<span class="curr-val">' + E(value) + '</span>';
            html += '<span class="range-val"> (' + E(min) + '-' +
                E(max) + ')</span>'
            getter = 'parseFloat';
            setter = 'float';
        } else {
            var value = applyPos(details.VALUE, pos) || 0;
            html += '<input type="range" value="' + E(value) + '" step="any"/>';
            html += '<span class="curr-val">' + E(value) + '</span>';
            getter = 'parseFloat';
            setter = 'float';
        }
    } else if (type == 'F') {
        // False
        html += '<input type="button" value="Send false"/>';
    } else if (type == 'f') {
        // Float
        if (details.RANGE && applySelector(details.RANGE, selector, 'VALS')) {
            var options = applySelector(details.RANGE, selector, 'VALS');
            var value = applyPos(details.VALUE, pos) || 0;
            html += '<select>';
            for (let i = 0; i < options.length; i++) {
                let v = options[i];
                html += '<option value="' + E(v) + '" ';
                if (v == value) {
                    html += 'selected ';
                }
                html += '>' + E(v) + '</option>';
            }
            html += '</select>';
            getter = 'value';
        } else if (details.RANGE) {
            var min = applySelector(details.RANGE, selector, 'MIN') || 0;
            var max = applySelector(details.RANGE, selector, 'MAX') || 1;
            var value = applyPos(details.VALUE, pos) || 0;
            html += '<input type="range" min="' + E(min) + '" max="' +
                E(max) + '" value="' + E(value) + '" step="any"/>';
            html += '<span class="curr-val">' + E(value) + '</span>';
            html += '<span class="range-val"> (' + E(min) + '-' +
                E(max) + ')</span>'
            getter = 'parseFloat';
            setter = 'float';
        } else {
            var value = applyPos(details.VALUE, pos) || 0;
            html += '<input type="range" value="' + E(value) + '" step="any"/>';
            html += '<span class="curr-val">' + E(value) + '</span>';
            getter = 'parseFloat';
            setter = 'float';
        }
    } else if (type == 'I') {
        // Infinity
        html += '<input type="button" value="Send infinity"/>';
    } else if (type == 'i') {
        // Integer
        if (details.RANGE && applySelector(details.RANGE, selector, 'VALS')) {
            var options = applySelector(details.RANGE, selector, 'VALS');
            var value = applyPos(details.VALUE, pos) || 0;
            if (options.length == 1) {
                value = options[0];
                html += '<input type="button" value="' + E(value) +
                    '" data-first="' + E(value) + '"/>';
                getter = 'sendSingle';
            } else if (options.length == 2) {
                html += '<input type="checkbox" data-first="' + E(options[0]) +
                    '" data-second="' + E(options[1]) + '"';
                if (value == options[1]) {
                    html += ' checked';
                }
                html += '/> ' + E(options[0]) + ', ' + E(options[1]);
                getter = 'sendCheckbox';
                setter = 'setCheckbox';
            } else {
                html += '<select>';
                for (let i = 0; i < options.length; i++) {
                    let v = options[i];
                    html += '<option value="' + E(v) + '" ';
                    if (v == value) {
                        html += 'selected ';
                    }
                    html += '>' + E(v) + '</option>';
                }
                html += '</select>';
                getter = 'value';
            }
        } else if (details.RANGE) {
            var min = applySelector(details.RANGE, selector, 'MIN');
            var max = applySelector(details.RANGE, selector, 'MAX');
            if (min == null || max == null) {
                return ('<span class="error">Invalid node: RANGE needs ' +
                        'MIN,MAX or VALS</span>');
            }
            var value = applyPos(details.VALUE, pos) || 0;
            if (max - min == 0) {
                value = min;
                html += '<input type="button" value="' + E(value) +
                    '" data-first="' + E(value) + '"/>';
                getter = 'sendSingle';
            } else if (max - min == 1) {
                html += '<input type="checkbox" data-first="' + E(min) +
                    '" data-second="' + E(max) + '"';
                if (value == max) {
                    html += ' checked';
                }
                html += '/> ' + E(min) + ', ' + E(max);
                getter = 'sendCheckbox';
                setter = 'setCheckbox';
            } else {
                html += '<input type="range" min="' + E(min) + '" max="' +
                    E(max) + '" value="' + E(value) + '" />';
                html += '<span class="curr-val">' + E(value) + '</span>';
                html += '<span class="range-val"> (' + E(min) + '-' +
                    E(max) + ')</span>'
                getter = 'parseInt';
                setter = 'int';
            }
        } else {
            var value = applyPos(details.VALUE, pos) || 0;
            html += '<input type="range" value="' + E(value) + '" />';
            html += '<span class="curr-val">' + E(value) + '</span>';
            getter = 'parseInt';
            setter = 'int';
        }
    } else if (type == 'h') {
        // Longlong
        if (details.RANGE && applySelector(details.RANGE, selector, 'VALS')) {
            var options = applySelector(details.RANGE, selector, 'VALS');
            var value = applyPos(details.VALUE, pos) || 0;
            html += '<select>';
            for (let i = 0; i < options.length; i++) {
                let v = options[i];
                html += '<option value="' + E(v) + '" ';
                if (v == value) {
                    html += 'selected ';
                }
                html += '>' + E(v) + '</option>';
            }
            html += '</select>';
            getter = 'parseInt64';
        } else if (details.RANGE) {
            var min = applySelector(details.RANGE, selector, 'MIN') || 0;
            var max = applySelector(details.RANGE, selector, 'MAX') || 1;
            var value = applyPos(details.VALUE, pos) || 0;
            html += '<input type="range" min="' + E(min) + '" max="' +
                E(max) + '" value="' + E(value) + '"/>';
            html += '<span class="curr-val">' + E(value) + '</span>';
            html += '<span class="range-val"> (' + E(min) + '-' +
                E(max) + ')</span>'
            getter = 'parseInt64';
            setter = 'int';
        } else {
            var value = applyPos(details.VALUE, pos) || 0;
            html += '<input type="range" value="' + E(value) + '"/>';
            html += '<span class="curr-val">' + E(value) + '</span>';
            getter = 'parseInt64';
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
        if (details.RANGE && applySelector(details.RANGE, selector, 'VALS')) {
            var options = applySelector(details.RANGE, selector, 'VALS');
            var value = applyPos(details.VALUE, pos) || '';
            html += '<select>';
            for (let i = 0; i < options.length; i++) {
                let v = options[i];
                html += '<option value="' + E(v) + '" ';
                if (v == value) {
                    html += 'selected ';
                }
                html += '>' + E(v) + '</option>';
            }
            html += '</select>';
            getter = 'value';
        } else {
            var value = applyPos(details.VALUE, pos) || '';
            html += '<input type="text" value="' + E(value) + '"/>';
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
    return html;
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
    }
    if (obj.TYPE && obj.FULL_PATH) {
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
    let hex = Number(Math.floor(num)).toString(16);
    if (hex.length < 2) {
        hex = '0' + hex;
    }
    return hex;
}

function convertOSCColorToHex(c) {
    return '#' + num2Hex(c[0]*255) + num2Hex(c[1]*255) + num2Hex(c[2]*255);
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
                processCommandMessage(msg);
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
                    // If the html5 color control is being dragged around,
                    // and LISTEN is enabled, the messages sent from this
                    // control will be routed back to it, and subtly decrease
                    // the lightness due to rounding errors. So, while the
                    // control is being changed, wait a short amount of time
                    // before accepting new updates.
                    if (g_numMessagePending > 0) {
                        g_numMessagePending--;
                        return;
                    }
                    value = textToHexColor(value);
                } else if (setter.value == 'setCheckbox') {
                    // If the control is a checkbox, there should only be
                    // two possible values. Either check or uncheck the box,
                    // but only if it matches one of the two known values.
                    let first = targetElem.attributes['data-first'].value;
                    let second = targetElem.attributes['data-second'].value;
                    if (value == first) {
                        targetElem.checked = false;
                    } else if (value == second) {
                        targetElem.checked = true;
                    }
                    return;
                } else {
                    runSetter(controlElem, setter.value, value);
                }
            }
            targetElem.value = value;
        }
    });
}

function processCommandMessage(msg) {
    if (msg.COMMAND == 'PATH_CHANGED') {
        if (g_extensions.PATH_CHANGED) {
            let refreshElem = document.getElementById('refresh-butter');
            refreshElem.style.display = 'inline';
            window.location.reload(true);
        }
    } else if (msg.COMMAND == 'PATH_ADDED') {
        if (g_extensions.PATH_ADDED) {
            let nodePath = msg.DATA;
            let pathParts = nodePath.split('/');
            let numParts = pathParts.length - 1;
            let nodeName = pathParts[numParts];
            let nodeUrl = g_serverUrl + nodePath;
            retrieve.retrieveJson(nodeUrl, (err, contents) => {
                let targetPath = pathParts.slice(0, numParts).join('/');
                let targetElem = document.querySelector(
                    '[data-dir-path="' + targetPath + '"]');
                if (!targetElem) {
                    return;
                }
                let holderElem = document.createElement('div');
                holderElem.className = "node control";
                holderElem.setAttribute('data-dir-path', nodePath);
                buildControlElements(holderElem, nodeName, contents);
                targetElem.appendChild(holderElem);
            });
        }
    } else if (msg.COMMAND == 'PATH_RENAMED') {
        if (g_extensions.PATH_RENAMED) {
            let oldPath = msg.DATA.OLD;
            let newPath = msg.DATA.NEW;
            let targetElem = document.querySelector(
                '[data-dir-path="' + oldPath + '"]');
            if (!targetElem) {
                return;
            }
            targetElem.setAttribute('data-dir-path', newPath);
            let controlDetail = targetElem.querySelector('.control-name');
            if (controlDetail) {
                let newParts = newPath.split('/');
                let newName = newParts[newParts.length - 1];
                controlDetail.textContent = newName;
            }
            let fullPathDetail = targetElem.querySelector('.full-path');
            if (fullPathDetail) {
                fullPathDetail.textContent = newPath;
            }
            targetElem = document.querySelector(
                '[data-full-path="' + oldPath + '"]');
            if (!targetElem) {
                return;
            }
            targetElem.setAttribute('data-full-path', newPath);
        }
    } else if (msg.COMMAND == 'PATH_REMOVED') {
        if (g_extensions.PATH_REMOVED) {
            let nodePath = msg.DATA;
            let targetElem = document.querySelector(
                '[data-dir-path="' + nodePath + '"]');
            if (targetElem) {
                targetElem.parentNode.removeChild(targetElem);
            }
        }
    } else {
        console.log('??????????');
        console.log('Unknown message: ' + e.data);
    }
}

function controlEvent(e) {
    // Control that was modified.
    let controlElem = e.target.parentNode;
    let detailsElem = controlElem.querySelector('.details');
    let fullPath = detailsElem.attributes['data-full-path'].value;
    let setter = detailsElem.attributes['data-setter'];
    // Node that contains this control (in case the node has multiple types).
    let nodeElem = controlElem.parentNode;
    let args = [];
    for (let i = 0; i < nodeElem.children.length; i++) {
        let c = nodeElem.children[i];
        if (c.tagName.toLowerCase() == 'div' &&
              c.classList.contains('control')) {
            args.push(getControlArg(c));
        }
    }
    if (setter) {
        runSetter(controlElem, setter.value, e.target.value);
    }
    var message = {
        address: fullPath,
        args: args,
    };
    console.log('***** Sending value: ' + JSON.stringify(message));
    if (isOscReady) {
        oscPort.send(message);
    }
}

function getControlArg(controlElem) {
    let inputElem = controlElem.querySelector('input');
    if (!inputElem) {
        inputElem = controlElem.querySelector('select');
    }
    let detailsElem = controlElem.querySelector('.details');
    let fullPath = detailsElem.attributes['data-full-path'].value;
    let dataType = detailsElem.attributes['data-type'].value;
    let getter = detailsElem.attributes['data-getter'];
    let arg = null;
    if (!getter) {
        return {type: dataType};
    } else if (getter.value == 'value') {
        return {type: dataType, value: inputElem.value };
    } else if (getter.value == 'parseInt') {
        return {type: dataType, value: parseInt(inputElem.value, 10) };
    } else if (getter.value == 'parseInt64') {
        let num = parseInt(inputElem.value);
        let radix = 0x100000000;
        return {type: dataType, value: {high: num / radix, low: num % radix}};
    } else if (getter.value == 'parseFloat') {
        return {type: dataType, value: parseFloat(inputElem.value) };
    } else if (getter.value == 'sendSingle') {
        let first = inputElem.attributes['data-first'].value;
        return {type: dataType, value: parseInt(first, 10) };
    } else if (getter.value == 'sendCheckbox') {
        let value;
        if (inputElem.checked) {
            value = parseInt(inputElem.attributes['data-second'].value, 10);
        } else {
            value = parseInt(inputElem.attributes['data-first'].value, 10);
        }
        return {type: dataType, value: value};
    } else if (getter.value == 'color') {
        if (!inputElem) {
            // Only for color elements in browsers that don't support the
            // html5 color input.
            inputElem = controlElem.querySelector('.color-control');
        }
        var color = inputElem.value;
        var r = parseInt(color.substr(1, 2), 16);
        var g = parseInt(color.substr(3, 2), 16);
        var b = parseInt(color.substr(5, 2), 16);
        return {type: dataType, value: {r:r, g:g, b:b, a:1} };
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

var g_numMessagePending = 0;
var g_lastMessageSent = null;

function colorModifyEvent(e) {
    if (g_isListenEnabled) {
        g_numMessagePending++;
        g_lastMessageSent = new Date();
    }
    controlEvent(e);
}

setInterval(function() {
    if (!g_lastMessageSent) {
        return;
    }
    let now = new Date();
    if (now - g_lastMessageSent > 2000) {
        g_numMessagePending = 0;
        g_lastMessageSent = null;
    }
}, 1000);

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
        g_isListenEnabled = true;
        imgElem.src = pressedBase64;
        spanElem.className = 'listen-button pressed';
        command = 'LISTEN';
    } else {
        g_isListenEnabled = false;
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
    let elem = e.target;
    for (let i = 0; i < 3; i++) {
        if (elem.id) {
            break;
        }
        elem = elem.parentNode;
    }
    let text = elem.id;
    let id = text.substr(12);
    $('#control_body_' + id).style.display = 'none';
    $('#toggle_show_'  + id).style.display = 'block';
    $('#toggle_hide_'  + id).style.display = 'none';
    if (e.altKey) {
        let controlBody = $('#control_body_' + id);
        if (!controlBody) {
            return;
        }
        let dirContainerElems = controlBody.querySelectorAll('.dir-container');
        for (let i = 0; i < dirContainerElems.length; i++) {
            let toggleElem = dirContainerElems[i].querySelector('.toggle-hide');
            toggleHide({target: toggleElem, altKey: true});
        }
    }
}

function toggleShow(e) {
    let elem = e.target;
    for (let i = 0; i < 3; i++) {
        if (elem.id) {
            break;
        }
        elem = elem.parentNode;
    }
    let text = elem.id;
    let id = text.substr(12);
    $('#control_body_' + id).style.display = 'block';
    $('#toggle_show_'  + id).style.display = 'none';
    $('#toggle_hide_'  + id).style.display = 'block';
    if (e.altKey) {
        let controlBody = $('#control_body_' + id);
        if (!controlBody) {
            return;
        }
        let dirContainerElems = controlBody.querySelectorAll('.dir-container');
        for (let i = 0; i < dirContainerElems.length; i++) {
            let toggleElem = dirContainerElems[i].querySelector('.toggle-show');
            toggleShow({target: toggleElem, altKey: true});
        }
    }
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
        } else if (input.type == "color") {
            input.addEventListener('change', colorModifyEvent, false);
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
    g_serverUrl = serverUrl;
    initWebSocket(serverUrl.replace("http", "ws"));
    retrieve.retrieveHostInfo(serverUrl, (err, hostInfo) => {
        if (hostInfo) {
            storeHostInfo(hostInfo);
        }
        retrieve.retrieveJson(serverUrl, (err, result) => {
            if (err) {
                let mainContentsElem = $('#mainContents');
                let errorElem = document.createElement('div');
                errorElem.innerHTML = '<span class="error">' + err + '</span>';
                mainContentsElem.appendChild(errorElem);
                return;
            }
            buildColorPicker();
            buildFromQueryResult(result);
            storeControlStructure(result);
            addInputEventHandlers();
        });
    });
}

module.exports = {
    createApp: createApp,
    getDataEvent: getDataEvent,
    buildSingleControl: buildSingleControl,
    extractControlPaths: extractControlPaths,
};
