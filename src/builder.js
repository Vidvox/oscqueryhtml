const util = require('./util');

function buildSingleControl(name, details) {
    let html = '';
    html += '<span class="control-name">' + name + '</span>';
    html += '<span class="description">' + details.DESCRIPTION + '</span>';
    if (details.TYPE == 'c') {
        html += '<span class="type">char node</span>';
    } else if (details.TYPE == 'r') {
        // TODO: Third-party color picker.
        html += '<span class="type">color node</span>';
    } else if (details.TYPE == 'd') {
        // TODO: Slider.
        html += '<span class="type">double node</span>';
    } else if (details.TYPE == 'F') {
        // TODO: Button.
        html += '<span class="type">false node</span>';
    } else if (details.TYPE == 'f') {
        // TODO: Slider.
        html += '<span class="type">float node</span>';
    } else if (details.TYPE == 'I') {
        html += '<span class="type">infinity node</span>';
    } else if (details.TYPE == 'i') {
        // TODO: Text box.
        html += '<span class="type">int node</span>';
    } else if (details.TYPE == 'h') {
        html += '<span class="type">longlong node</span>';
    } else if (details.TYPE == 'm') {
        html += '<span class="type">midi node</span>';
    } else if (details.TYPE == 'N') {
        // TODO: Button.
        html += '<span class="type">null node</span>';
    } else if (details.TYPE == 's') {
        // TODO: Text box.
        html += '<span class="type">string node</span>';
    } else if (details.TYPE == 'T') {
        // TODO: Button.
        html += '<span class="type">true node</span>';
    } else if (details.TYPE == 't') {
        // TODO: ?????.
        html += '<span class="type">timetag node</span>';
    } else {
        html += '<span class="type">UNKNOWN (' + details.TYPE + ')</span>';
    }
    return '<div class="control">' + html + '</div>';
}

function buildFromQueryResult(result) {
    let contents = result.CONTENTS;
    // TODO: Iterate all directories?
    let dir = util.objectGetValue(contents, 0);
    let innerContents = dir.CONTENTS;
    let innerKeys = Object.keys(innerContents);
    let html = '';
    for (let k = 0; k < innerKeys.length; k++) {
        let key = innerKeys[k];
        html += buildSingleControl(key, innerContents[key]);
    }
    return html;
}

module.exports.buildFromQueryResult = buildFromQueryResult;
