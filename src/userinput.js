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
    return controlEvent(e);
}

// Handle an event on a control, return whether an OSC message was sent.
function controlEvent(e) {
    // Control that was modified.
    let controlElem = e.target.parentNode;
    let detailsElem = controlElem.querySelector('.details');
    let fullPath = detailsElem.attributes['data-full-path'].value;
    let setter = detailsElem.attributes['data-setter'];
    // Group that contains this control (in case the node has multiple types).
    let groupElem = controlElem.parentNode;
    let args = [];
    for (let i = 0; i < groupElem.children.length; i++) {
        let c = groupElem.children[i];
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
        return true;
    }
    return false;
}

function charKeyPressEvent(e) {
    e.target.value = String.fromCharCode(e.keyCode);
    return controlEvent(e);
}

global.g_numRangeMessagePending = 0;
global.g_lastRangeMessageSent = null;

function rangeModifyEvent(e) {
    let value = e.target.value;
    // Cache value so that it won't send twice in a row.
    if (e.target.cacheValue === value) {
        return;
    }
    e.target.cacheValue = value
    if (controlEvent(e)) {
        if (global.g_isListenEnabled) {
            global.g_numRangeMessagePending++;
            global.g_lastRangeMessageSent = new Date();
        }
    }
}

global.g_numColorMessagePending = 0;
global.g_lastColorMessageSent = null;

function colorModifyEvent(e) {
    if (controlEvent(e)) {
        if (global.g_isListenEnabled) {
            global.g_numColorMessagePending++;
            global.g_lastColorMessageSent = new Date();
        }
    }
}

setInterval(function() {
    let now = new Date();
    if (global.g_lastRangeMessageSent) {
        if (now - global.g_lastRangeMessageSent > 1000) {
            global.g_numRangeMessagePending = 0;
            global.g_lastRangeMessageSent = null;
        }
    }
    if (global.g_lastColorMessageSent) {
        if (now - global.g_lastColorMessageSent > 1000) {
            global.g_numColorMessagePending = 0;
            global.g_lastColorMessageSent = null;
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
