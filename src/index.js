//const osc = require('osc');
//const oscWebsocketClient = require('osc-websocket-client');

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
    if (details.TYPE == 'c') {
        // Char
        html += '<input type="text" maxlength="1" size="3"/>';
        getter = 'value';
    } else if (details.TYPE == 'r') {
        // Color
        html += '<input type="color" />';
        // TODO: getter
    } else if (details.TYPE == 'd') {
        // Double
        var min = details.RANGE[0].MIN;
        var max = details.RANGE[0].MAX;
        html += '<input type="range" min="' + min + '" max="' + max + '"/>';
        getter = 'value';
    } else if (details.TYPE == 'F') {
        // False
        html += '<input type="button" value="Send false"/>';
    } else if (details.TYPE == 'f') {
        // Float
        var min = details.RANGE[0].MIN;
        var max = details.RANGE[0].MAX;
        html += '<input type="range" min="' + min + '" max="' + max + '"/>';
        getter = 'value';
    } else if (details.TYPE == 'I') {
        // Infinity
        html += '<input type="button" value="Send infinity"/>';
    } else if (details.TYPE == 'i') {
        // Integer
        var min = details.RANGE[0].MIN;
        var max = details.RANGE[0].MAX;
        html += '<input type="range" min="' + min + '" max="' + max + '"/>';
        getter = 'value';
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
    if (getter == 'value') {
        html += 'data-getter="' + getter + '" ';
    }
    // TODO: Add value hook here.
    html += '/></span>';
    var div = document.createElement('div');
    div.setAttribute('class', 'control');
    div.innerHTML = html;
    return div;
}

var oscPort;

function initWebSocket() {
    oscPort = new osc.WebSocketPort({
        // TODO: Don't hardcode path.
        url: 'ws://localhost:2345',
        metadata: true
    });
    oscPort.open();
    // TODO: Handle port being ready.
    // oscPort.on('ready', function()
}

function controlEvent(e) {
    var controlElem = e.target.parentNode;
    var detailsElem = controlElem.querySelector('.details');
    var fullPath = detailsElem.attributes['data-full-path'].value;
    var dataType = detailsElem.attributes['data-type'].value;
    var getter = detailsElem.attributes['data-getter'];
    if (!getter) {
        var firstArg = {type: dataType};
    } else if (getter.value == 'value') {
        var firstArg = {type: dataType, value: e.target.value };
    }
    var message = {
        address: fullPath,
        args: [firstArg],
    };
    console.log('***** Sending value: ' + JSON.stringify(message));
    oscPort.send(message);
}

function addInputEventHandlers() {
    var inputs = document.getElementsByTagName("input");
    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        if (input.type == "button") {
            input.addEventListener('click', controlEvent, false);
        } else {
            input.addEventListener('change', controlEvent, false);
        }
    }
}

/*
module.exports = {
    buildFromQueryResult: buildFromQueryResult,
    addInputEventHandlers: addInputEventHandlers,
    testSendOSC: testSendOSC,
};
*/
