const controls = require('./controls.js');

function toggleEvent(e) {
    // Control that was modified.
    let controlElem = e.target.parentNode;
    let detailsElem = controlElem.querySelector('.details');
    let setter = detailsElem.attributes['data-setter'];
    // Special hook for toggles because we need to modify the value before
    // calling `getControlArg` in the main `controlEvent` handler.
    if (setter) {
        controls.runSetter(controlElem, 'setToggleBeforeGetControlArg',
                           e.target.value);
    }
    controlEvent(e);
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
            args.push(controls.getControlArg(c));
        }
    }
    if (setter) {
        controls.runSetter(controlElem, setter.value, e.target.value);
    }
    var message = {
        address: fullPath,
        args: args,
    };
    console.log('***** Sending value: ' + JSON.stringify(message));
    if (window.isOscReady) {
        oscPort.send(message);
    }
}

function charKeyPressEvent(e) {
    e.target.value = String.fromCharCode(e.keyCode);
    controlEvent(e);
}

global.g_numRangeMessagePending = 0;
global.g_lastRangeMessageSent = null;

function rangeModifyEvent(e) {
    if (g_isListenEnabled) {
        g_numRangeMessagePending++;
        g_lastRangeMessageSent = new Date();
    }
    let value = e.target.value;
    // Cache value so that it won't send twice in a row.
    if (e.target.cacheValue === value) {
        return;
    }
    e.target.cacheValue = value
    controlEvent(e);
}

var g_numColorMessagePending = 0;
var g_lastColorMessageSent = null;

function colorModifyEvent(e) {
    if (g_isListenEnabled) {
        g_numColorMessagePending++;
        g_lastColorMessageSent = new Date();
    }
    controlEvent(e);
}

setInterval(function() {
    let now = new Date();
    if (g_lastRangeMessageSent) {
        if (now - g_lastRangeMessageSent > 1000) {
            g_numRangeMessagePending = 0;
            g_lastRangeMessageSent = null;
        }
    }
    if (g_lastColorMessageSent) {
        if (now - g_lastColorMessageSent > 1000) {
            g_numColorMessagePending = 0;
            g_lastColorMessageSent = null;
        }
    }
}, 400);

module.exports = {
    toggleEvent: toggleEvent,
    controlEvent: controlEvent,
    charKeyPressEvent: charKeyPressEvent,
    rangeModifyEvent: rangeModifyEvent,
    colorModifyEvent: colorModifyEvent,
}
