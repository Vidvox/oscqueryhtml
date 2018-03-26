const util = require('./util');

function buildSingleControl(name, details) {
    let html = '';
    html += '<span class="control-name">' + name + '</span>';
    html += '<span class="description">' + details.DESCRIPTION + '</span>';
    if (details.TYPE == 'c') {
        html += '<span class="type">TODO: char node</span>';
    } else if (details.TYPE == 'r') {
        // TODO: Third-party color picker.
        html += '<span class="type">TODO: color node</span>';
    } else if (details.TYPE == 'd') {
        let min = details.RANGE[0].MIN;
        let max = details.RANGE[0].MAX;
        html += '<input type="range" min="' + min + '" max="' + max + '"/>';
    } else if (details.TYPE == 'F') {
        html += '<input type="button" value="Send false"/>';
    } else if (details.TYPE == 'f') {
        let min = details.RANGE[0].MIN;
        let max = details.RANGE[0].MAX;
        html += '<input type="range" min="' + min + '" max="' + max + '"/>';
    } else if (details.TYPE == 'I') {
        html += '<input type="button" value="Send infinity"/>';
    } else if (details.TYPE == 'i') {
        // TODO: Text box.
        html += '<span class="type">TODO: int node</span>';
    } else if (details.TYPE == 'h') {
        html += '<span class="type">TODO: longlong node</span>';
    } else if (details.TYPE == 'm') {
        html += '<span class="type">TODO: midi node</span>';
    } else if (details.TYPE == 'N') {
        html += '<input type="button" value="Send null"/>';
    } else if (details.TYPE == 's') {
        // TODO: Text box.
        html += '<span class="type">TODO: string node</span>';
    } else if (details.TYPE == 'T') {
        html += '<input type="button" value="Send true"/>';
    } else if (details.TYPE == 't') {
        // TODO: ?????.
        html += '<span class="type">TODO: timetag node</span>';
    } else {
        html += '<span class="type">UNKNOWN (' + details.TYPE + ')</span>';
    }
    return '<div class="control">' + html + '</div>\n';
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
