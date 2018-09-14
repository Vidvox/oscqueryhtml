const osc = require('osc');
const oscTransports = require('osc-transports');
const oscWebsocketClient = require('osc-websocket-client');

const builder = require('./builder.js');
const controls = require('./controls.js');
const settings = require('./settings.js');
const userinput = require('./userinput.js');
const types = require('./types.js');
const retrieve = require('./retrieve.js');

// Polyfilled controls.
const vanillaColorPicker = require('vanilla-picker');
const rangeSlider = require('rangeslider-pure');

// Image assets.
const logoBase64 = require("base64-image-loader!../assets/img/icon.png");
const listenButtonSvg = require("svg-inline-loader?classPrefix=_listen!../assets/img/listen.svg");
const ignoreButtonSvg = require("svg-inline-loader?classPrefix=_ignore!../assets/img/pressed.svg");

global.g_allControlStruct = null;
global.g_hostInfo = {};
global.g_extensions = null;
global.g_isListenEnabled = false;
global.g_serverUrl = null;

function $(selector) {
    return document.querySelector(selector);
}

function objectGetValue(obj, i) {
    return obj[Object.keys(obj)[i]];
}

function storeHostInfo(hostInfo) {
    global.g_hostInfo = hostInfo;
    global.g_extensions = hostInfo.EXTENSIONS;
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
    if (global.g_extensions.LISTEN) {
        // Label for listen button.
        let labelDivElem = document.createElement('div');
        labelDivElem.className = 'listen-label';
        labelDivElem.textContent = 'Listen for OSC: ';
        mainContentsElem.appendChild(labelDivElem);
        // Listen and ignore buttons.
        let listenSpanElem = document.createElement('span');
        listenSpanElem.className = 'svg-listen';
        listenSpanElem.style.display = 'none';
        listenSpanElem.innerHTML = listenButtonSvg;
        let ignoreSpanElem = document.createElement('span');
        ignoreSpanElem.className = 'svg-ignore';
        ignoreSpanElem.style.display = 'inline-block';
        ignoreSpanElem.innerHTML = ignoreButtonSvg;
        mainContentsElem.appendChild(listenSpanElem);
        mainContentsElem.appendChild(ignoreSpanElem);
        // Set listening state.
        setTimeout(settings.enableInitialListenState, 0);
    }
    {
        // Create style links, dark and light.
        let styleDarkElem = document.createElement('div');
        styleDarkElem.id = 'choice-dark-mode';
        styleDarkElem.innerHTML = '<span class="curr_mode">dark</span> <span id="set_light">light</span>';
        let styleLightElem = document.createElement('div');
        styleLightElem.id = 'choice-light-mode';
        styleLightElem.innerHTML = '<span id="set_dark">dark</span> <span class="curr_mode">light</span>';
        styleLightElem.style.display = 'none';
        mainContentsElem.appendChild(styleDarkElem);
        mainContentsElem.appendChild(styleLightElem);
        // Create css to bold the in-use style, underline the unused style.
        let styleElem = document.createElement('style');
        styleElem.textContent = '.curr_mode { font-weight: bold; } #set_light {text-decoration: underline; cursor: pointer;} #set_dark {text-decoration: underline; cursor: pointer;}'
        mainContentsElem.appendChild(styleElem);
        let setLightLink = $('#set_light');
        setLightLink.addEventListener('click', function() {
            settings.setStyleMode('light');
        }, false);
        let setDarkLink = $('#set_dark');
        setDarkLink.addEventListener('click', function() {
            settings.setStyleMode('dark');
        }, false);
        // Set beginning style based upon the user's cookie.
        if (document.cookie.includes('style=light')) {
            settings.setStyleMode('light');
        }
    }
    // Configuration for building.
    let cfg = {supportHtml5Color: g_supportHtml5Color};
    // Build contents for the main container.
    builder.buildContentsAddToContainer(contents, mainContentsElem, cfg)
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

global.isOscReady = false;
global.oscPort = null;

function initWebSocket(url) {
    global.oscPort = new osc.WebSocketPort({
        url: url,
        metadata: true
    });
    global.oscPort.open();
    oscPort.on('ready', function() {
        global.isOscReady = true;
        global.oscPort.socket.onmessage = function(e) {
            // Check if message was a JSON command.
            let msg = null;
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
            let packet = osc.readPacket(new Uint8Array(e.data), {});
            console.log('***** Got packet <' + JSON.stringify(packet) + '>');
            let address = packet.address;
            // TODO: Validate address contains allowed characters.
            let query = '[data-full-path="' + address + '"]';
            let detailsElem = document.querySelector(query);
            let groupElem = detailsElem.parentNode.parentNode;
            for (let i = 0; i < packet.args.length; i++) {
                let value = packet.args[i];
                let controlElem = groupElem.children[i];
                applyOSCMessageValue(controlElem, value);
            }
        }
    });
}

// Apply OSC packet's single value by setting control state, update UI.
function applyOSCMessageValue(controlElem, value) {
    // Get input or select tag, which needs to have value changed.
    let targetElem = controlElem.querySelector('input');
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
        if (global.g_numRangeMessagePending > 0) {
            global.g_numRangeMessagePending--;
            return;
        }
        targetElem.rangeSlider.update({value: value}, false);
        return;
    }
    let detailsElem = controlElem.querySelector('[class="details"]');
    let setter = detailsElem.attributes['data-setter'];
    if (setter) {
        if (setter.value == 'color') {
            // If the html5 color control is being dragged around,
            // and LISTEN is enabled, the messages sent from this
            // control will be routed back to it, and subtly decrease
            // the lightness due to rounding errors. So, while the
            // control is being changed, wait a short amount of time
            // before accepting new updates.
            if (global.g_numColorMessagePending > 0) {
                global.g_numColorMessagePending--;
                return;
            }
            if (!global.g_supportHtml5Color) {
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
            controls.runSetter(controlElem, setter.value, value);
            return;
        } else if (setter.value == 'button') {
            // do nothing
            return;
        } else {
            controls.runSetter(controlElem, setter.value, value);
        }
    }
    targetElem.value = value;
}

function processCommandMessage(msg) {
    if (msg.COMMAND == 'PATH_CHANGED') {
        if (global.g_extensions.PATH_CHANGED) {
            let refreshElem = document.getElementById('refresh-butter');
            refreshElem.style.display = 'inline';
            global.location.reload(true);
        }
    } else if (msg.COMMAND == 'PATH_ADDED') {
        if (global.g_extensions.PATH_ADDED) {
            let nodePath = msg.DATA;
            let pathParts = nodePath.split('/');
            let numParts = pathParts.length - 1;
            let nodeName = pathParts[numParts];
            let nodeUrl = global.g_serverUrl + nodePath;
            retrieve.retrieveJson(nodeUrl, (err, contents) => {
                // Get the directory container for where the newly created
                // node should go, creating new elements as needed.
                let targetElem = getOrMakeDirNode(pathParts.slice(0, numParts));
                // Node container for the new element.
                let containerElem = document.createElement('div')
                containerElem.className = 'node';
                let headerElem = document.createElement('header');
                containerElem.appendChild(headerElem);
                targetElem.appendChild(containerElem);
                // Build the new node control, insert it into the container.
                let newElem = document.createElement('div');
                newElem.id = 'control_body_' + builder.generateId();
                newElem.setAttribute('data-dir-path', nodePath);
                containerElem.appendChild(newElem);
                builder.buildControlElements(newElem, nodeName, contents);
            });
        }
    } else if (msg.COMMAND == 'PATH_RENAMED') {
        if (global.g_extensions.PATH_RENAMED) {
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
        if (global.g_extensions.PATH_REMOVED) {
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

function getOrMakeDirNode(pathParts) {
    // TODO: Fix the case of the root node.
    let result = document;
    for (let i = 1; i < pathParts.length; i++) {
        let path = pathParts.slice(0, i + 1).join('/');
        let elem = result.querySelector(
            '[data-dir-path="' + path + '"]');
        if (!elem) {
            let id = 'control_body_' + builder.generateId();
            elem = document.createElement('div');
            elem.id = 'control_body_' + id;
            elem.setAttribute('data-dir-path', path);
            let containerElem = result.querySelector('[class="dir-container"]');
            if (!containerElem) {
                containerElem = document.createElement('div')
                containerElem.className = 'dir-container';
                result.appendChild(containerElem);
            }
            containerElem.appendChild(elem);
        }
        result = elem;
    }
    return result;
}

function getDataEvent(element) {
    if (element.attributes['data-event']) {
        return element.attributes['data-event'].value;
    }
    return null;
}

function addInputEventHandlers() {
    let inputs = document.getElementsByTagName("input");
    for (let i = 0; i < inputs.length; i++) {
        let input = inputs[i];
        if (getDataEvent(input) == 'keypress') {
            input.addEventListener('keypress',
                                   userinput.charKeyPressEvent, false);
        } else if (input.type == "button" && input.attributes['data-toggle']) {
            input.addEventListener('click', userinput.toggleEvent, false);
        } else if (input.type == "button") {
            input.addEventListener('click', userinput.controlEvent, false);
        } else if (input.type == "range") {
            input.addEventListener('input', userinput.rangeModifyEvent, false);
            input.addEventListener('change', userinput.rangeModifyEvent, false);
        } else if (input.type == "color") {
            input.addEventListener('change', userinput.colorModifyEvent, false);
        } else {
            input.addEventListener('change', userinput.controlEvent, false);
        }
    }
    let selects = document.getElementsByTagName("select");
    for (let i = 0; i < selects.length; i++) {
        let select = selects[i];
        select.addEventListener('change', userinput.controlEvent, false);
    }
    let listenButtons = document.getElementsByClassName('svg-listen');
    for (let i = 0; i < listenButtons.length; i++) {
        let listenBtn = listenButtons[i];
        listenBtn.addEventListener('click', settings.listenClick, false);
    }
    let ignoreButtons = document.getElementsByClassName('svg-ignore');
    for (let i = 0; i < ignoreButtons.length; i++) {
        let ignoreBtn = ignoreButtons[i];
        ignoreBtn.addEventListener('click', settings.ignoreClick, false);
    }
    let toggleHideElems = document.getElementsByClassName('toggle-hide');
    for (let i = 0; i < toggleHideElems.length; i++) {
        let elem = toggleHideElems[i];
        elem.addEventListener('click', settings.toggleHide, false);
    }
    let toggleShowElems = document.getElementsByClassName('toggle-show');
    for (let i = 0; i < toggleShowElems.length; i++) {
        let elem = toggleShowElems[i];
        elem.addEventListener('click', settings.toggleShow, false);
    }
}

function addColorPickerPolyfills() {
    // If this browser does not support the built-in html5 color picker
    // element, create polyfill controls for each element.
    if (global.g_supportHtml5Color) {
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
                userinput.controlEvent({target: colorControlElem});
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
    global.g_serverUrl = serverUrl;
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
