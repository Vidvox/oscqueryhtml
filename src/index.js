const osc = require('osc');
const oscTransports = require('osc-transports');
const oscWebsocketClient = require('osc-websocket-client');

const builder = require('./builder.js');
const types = require('./types.js');
const retrieve = require('./retrieve.js');
const vanillaColorPicker = require('vanilla-picker');
const rangeSlider = require('rangeslider-pure');

const logoBase64 = require("base64-image-loader!../assets/img/icon.png");
const listenButtonSvg = require("svg-inline-loader?classPrefix=_listen!../assets/img/listen.svg");
const ignoreButtonSvg = require("svg-inline-loader?classPrefix=_ignore!../assets/img/pressed.svg");

var g_allControlStruct = null;
var g_hostInfo = {};
var g_extensions = null;
var g_isListenEnabled = false;
var g_serverUrl = null;

function $(selector) {
    return document.querySelector(selector);
}

function objectGetValue(obj, i) {
    return obj[Object.keys(obj)[i]];
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
    // Currently, always use third-party control.
    g_supportHtml5Color = false;
}

// Build all controls from json object, from the top-level.
function buildFromQueryResult(result) {
    let mainContentsElem = $('#mainContents');
    {
        let logoHolderElem = document.createElement('div');
        let logoElem = document.createElement('img');
        logoElem.className = 'logo';
        logoElem.src = logoBase64;
        logoHolderElem.appendChild(logoElem);
        mainContents.appendChild(logoHolderElem);
    }
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
        // Listen and ignore buttons.
        let listenSpanElem = document.createElement('span');
        listenSpanElem.className = 'svg-listen';
        listenSpanElem.style.display = 'inline-block';
        listenSpanElem.innerHTML = listenButtonSvg;
        let ignoreSpanElem = document.createElement('span');
        ignoreSpanElem.className = 'svg-ignore';
        ignoreSpanElem.style.display = 'none';
        ignoreSpanElem.innerHTML = ignoreButtonSvg;
        mainContentsElem.appendChild(listenSpanElem);
        mainContentsElem.appendChild(ignoreSpanElem);
    }
    {
        let styleDarkElem = document.createElement('div');
        styleDarkElem.id = 'choice-dark-mode';
        styleDarkElem.innerHTML = '<span class="curr_mode">dark</span> <span id="set_light">light</span>';
        let styleLightElem = document.createElement('div');
        styleLightElem.id = 'choice-light-mode';
        styleLightElem.innerHTML = '<span id="set_dark">dark</span> <span class="curr_mode">light</span>';
        styleLightElem.style.display = 'none';
        mainContentsElem.appendChild(styleDarkElem);
        mainContentsElem.appendChild(styleLightElem);
        let styleElem = document.createElement('style');
        styleElem.textContent = '.curr_mode { font-weight: bold; } #set_light {text-decoration: underline; cursor: pointer;} #set_dark {text-decoration: underline; cursor: pointer;}'
        mainContentsElem.appendChild(styleElem);
        let setLightLink = $('#set_light');
        setLightLink.addEventListener('click',function(){setStyleMode('light')},
                                      false);
        let setDarkLink = $('#set_dark');
        setDarkLink.addEventListener('click', function(){setStyleMode('dark')},
                                     false);
    }
    // Configuration for building.
    let cfg = {supportHtml5Color: g_supportHtml5Color};
    // Build contents for the main container.
    builder.buildContentsAddToContainer(contents, mainContentsElem, cfg)
}

function setStyleMode(mode) {
    if (mode == 'light') {
        $('#choice-dark-mode').style.display = 'none';
        $('#choice-light-mode').style.display = 'block';
        $('body').classList.add('light');
    } else if (mode == 'dark') {
        $('#choice-light-mode').style.display = 'none';
        $('#choice-dark-mode').style.display = 'block';
        $('body').classList.remove('light');
    }
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

function nullFunction() {}

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
            // TODO: Iterate over values to affect each element.
            var value = packet.args[0];
            // TODO: Validate address contains allowed characters.
            var query = '[data-full-path="' + address + '"]';
            var detailsElem = document.querySelector(query);
            // Apply OSC packet by setting control value, update UI.
            var controlElem = detailsElem.parentNode;
            // Get input or select tag, which needs to have value changed.
            var targetElem = controlElem.querySelector('input');
            if (!targetElem) {
                targetElem = controlElem.querySelector('select');
            }
            if (!targetElem) {
                return;
            }
            // Update position of slider polyfill. NOTE: Kind of a hack to
            // put this code here, it's a one-off.
            if (targetElem.attributes.type &&
                targetElem.attributes.type.value == 'range') {
                targetElem.rangeSlider.update({value: value}, false);
            }
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
                    if (!g_supportHtml5Color) {
                        // Polyfill control, update the color.
                        value = builder.textToHexColor(value);
                        let colorClass = '.color-control';
                        targetElem = controlElem.querySelector(colorClass);
                        // Change the picker's color, but don't send events.
                        let picker = targetElem.picker;
                        let preserveHandler = picker.onChange;
                        picker.onChange = nullFunction;
                        picker.setColor(value);
                        picker.onChange = preserveHandler;
                    }
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
                } else if (setter.value == 'setToggle') {
                    runSetter(controlElem, setter.value, value);
                    return;
                } else if (setter.value == 'button') {
                    // do nothing
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
                targetElem.appendChild(holderElem);
                builder.buildControlElements(holderElem, nodeName, contents);
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
        let high = Math.floor(num / radix);
        let low = num % radix;
        return {type: dataType, value: {high: high, low: low}};
    } else if (getter.value == 'parseFloat') {
        return {type: dataType, value: parseFloat(inputElem.value) };
    } else if (getter.value == 'parseSingle') {
        let first = inputElem.attributes['data-first'].value;
        return {type: dataType, value: parseInt(first, 10) };
    } else if (getter.value == 'boolToggle') {
        return {type: inputElem.value == 'true' ? 'F' : 'T'};
    } else if (getter.value == 'parseIntToggle') {
        let value = null;
        let dataFirst = inputElem.attributes['data-first']
        let dataSecond = inputElem.attributes['data-second']
        if (dataFirst.value == inputElem.value) {
            value = dataSecond.value;
        } else {
            value = dataFirst.value;
        }
        return {type: dataType, value: parseInt(value, 10) };
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
        let currValElem = controlElem.querySelector('.curr-val');
        currValElem.textContent = value;
    } else if (type == 'int64') {
        let currValElem = controlElem.querySelector('.curr-val');
        if (value.hasOwnProperty('high') && value.hasOwnProperty('low')) {
            let radix = 0x100000000;
            value = value.high * radix + value.low;
        }
        currValElem.textContent = value;
    } else if (type == 'float') {
        let currValElem = controlElem.querySelector('.curr-val');
        currValElem.textContent = Math.round(value * 1000) / 1000;
    } else if (type == 'setToggle') {
        let buttonElem = controlElem.querySelector('input');
        let dataFirst = buttonElem.attributes['data-first']
        let dataSecond = buttonElem.attributes['data-second']
        let isEnabled;
        if (dataFirst && dataSecond) {
            if (dataFirst.value == value) {
                value = dataSecond.value;
                isEnabled = true;
            } else {
                value = dataFirst.value;
                isEnabled = false;
            }
        } else {
            if (value === false || value == 'false') {
                value = 'true';
                isEnabled = true;
            } else {
                value = 'false';
                isEnabled = false;
            }
        }
        buttonElem.value = value;
        if (isEnabled) {
            buttonElem.classList.add('enabled');
        } else {
            buttonElem.classList.remove('enabled');
        }
    } else if (type == 'button') {
        // do nothing
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
    listenIgnoreChange(true);
}

function ignoreClick(e) {
    listenIgnoreChange(false);
}

function listenIgnoreChange(state) {
    g_isListenEnabled = state;
    let command = null;
    if (state) {
        $('.svg-listen').style.display = 'none';
        $('.svg-ignore').style.display = 'inline-block';
        command = 'LISTEN';
    } else {
        $('.svg-listen').style.display = 'inline-block';
        $('.svg-ignore').style.display = 'none';
        command = 'IGNORE';
    }
    if (isOscReady) {
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


const TOGGLE_SHOW_DISPLAY = 'grid';

function toggleHide(e) {
    let elem = e.target;
    for (let i = 0; i < 6; i++) {
        if (elem.tagName.toLowerCase() == 'div' && elem.id) {
            break;
        }
        elem = elem.parentNode;
    }
    let text = elem.id;
    let id = text.substr(12);
    $('#control_body_' + id).style.display = 'none';
    $('#toggle_show_'  + id).style.display = TOGGLE_SHOW_DISPLAY;
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
    for (let i = 0; i < 6; i++) {
        if (elem.tagName.toLowerCase() == 'div' && elem.id) {
            break;
        }
        elem = elem.parentNode;
    }
    let text = elem.id;
    let id = text.substr(12);
    $('#control_body_' + id).style.display = TOGGLE_SHOW_DISPLAY;
    $('#toggle_show_'  + id).style.display = 'none';
    $('#toggle_hide_'  + id).style.display = TOGGLE_SHOW_DISPLAY;
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
    let listenButtons = document.getElementsByClassName('svg-listen');
    for (let i = 0; i < listenButtons.length; i++) {
        let listenBtn = listenButtons[i];
        listenBtn.addEventListener('click', listenClick, false);
    }
    let ignoreButtons = document.getElementsByClassName('svg-ignore');
    for (let i = 0; i < ignoreButtons.length; i++) {
        let ignoreBtn = ignoreButtons[i];
        ignoreBtn.addEventListener('click', ignoreClick, false);
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
}

function addColorPickerPolyfills() {
    // If this browser does not support the built-in html5 color picker
    // element, create polyfill controls for each element.
    if (g_supportHtml5Color) {
        return;
    }
    let elemList = document.getElementsByClassName('color-control');
    for (let i = 0; i < elemList.length; i++) {
        let colorControlElem = elemList[i];
        let initValue = colorControlElem.attributes['data-value'].value;
        colorControlElem.picker = new vanillaColorPicker({
            parent: colorControlElem,
            popup: false,
            alpha: false,
            onChange: function(color) {
                colorControlElem.value = color;
                controlEvent({target: colorControlElem});
            },
        });
        colorControlElem.picker.setColor(initValue);
    }
}

function addRangeSliderPolyfills() {
    let sliders = document.querySelectorAll('input[type="range"]');
    for (let i = 0; i < sliders.length; i++) {
        let elem = sliders[i];
        let options = {polyfill: true};
        if (elem.attributes.min) {
            options.min = elem.attributes.min;
        }
        if (elem.attributes.max) {
            options.max = elem.attributes.max;
        }
        if (elem.attributes.step && elem.attributes.step.value == 'any') {
            options.step = 0.001;
        } else if (elem.attributes.step) {
            options.step = elem.attributes.step;
        }
        rangeSlider.create(elem, options);
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
            detectColorPicker();
            buildFromQueryResult(result);
            storeControlStructure(result);
            addInputEventHandlers();
            addColorPickerPolyfills();
            addRangeSliderPolyfills();
        });
    });
}

module.exports = {
    createApp: createApp,
    getDataEvent: getDataEvent,
    extractControlPaths: extractControlPaths,
};
