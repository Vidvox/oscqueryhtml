//const osc = require('osc');
//const oscWebsocketClient = require('osc-websocket-client');

//const osc = require('osc');


const osc = require('osc');
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
    if (details.TYPE == 'c') {
        // Char
        html += '<input type="text" maxlength="1" size="3"/>';
    } else if (details.TYPE == 'r') {
        // Color
        html += '<input type="color" />';
    } else if (details.TYPE == 'd') {
        // Double
        var min = details.RANGE[0].MIN;
        var max = details.RANGE[0].MAX;
        html += '<input type="range" min="' + min + '" max="' + max + '"/>';
    } else if (details.TYPE == 'F') {
        // False
        html += '<input type="button" value="Send false"/>';
    } else if (details.TYPE == 'f') {
        // Float
        var min = details.RANGE[0].MIN;
        var max = details.RANGE[0].MAX;
        html += '<input type="range" min="' + min + '" max="' + max + '"/>';
    } else if (details.TYPE == 'I') {
        // Infinity
        html += '<input type="button" value="Send infinity"/>';
    } else if (details.TYPE == 'i') {
        // Integer
        var min = details.RANGE[0].MIN;
        var max = details.RANGE[0].MAX;
        html += '<input type="range" min="' + min + '" max="' + max + '"/>';
    } else if (details.TYPE == 'h') {
        // Longlong
        var min = details.RANGE[0].MIN;
        var max = details.RANGE[0].MAX;
        html += '<input type="range" min="' + min + '" max="' + max + '"/>';
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
    var div = document.createElement('div');
    div.setAttribute('class', 'control');
    div.innerHTML = html;
    return div;
}

function controlEvent(e) {
    console.log('event');
    // TODO: Dispatch based upon e.target
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

function testSendOSC() {
    console.log('Try to work');
/*
    var oscPort = new osc.WebSocketPort({
        url: 'ws://localhost:2345'
    });
    console.log('Constructed');
    oscPort.open();
    console.log('Opening');
    oscPort.on('ready', function() {
        console.log('Ready');
    });
*/
/*
    var osc = new OSC();
    var plugin = new OSC.WebsocketBrowserPlugin({
        host: 'localhost',
        port: 2345,
    });
    osc.open({plugin, port: 2345});
    osc.on('open', function() {
        const message = new OSC.Message('/test/my_int', 50);
        osc.send(message);
    });
*/
}

module.exports = {
    buildFromQueryResult: buildFromQueryResult,
    addInputEventHandlers: addInputEventHandlers,
    testSendOSC: testSendOSC,
};

