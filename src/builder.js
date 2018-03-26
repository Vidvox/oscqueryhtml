const util = require('./util');

function buildSingleControl(name, details) {
    let html = '';
    html += '<span class="control-name">' + name + '</span>';
    html += '<span class="description">' + details.DESCRIPTION + '</span>';
    if (details.TYPE == 'c') {
        // Char
        html += '<input type="text" maxlength="1" size="3"/>';
    } else if (details.TYPE == 'r') {
        // Color
        // TODO: Third-party color picker.
        html += '<span class="type">TODO: color node</span>';
        console.log('========================================');
        console.log(details);
    } else if (details.TYPE == 'd') {
        // Double
        let min = details.RANGE[0].MIN;
        let max = details.RANGE[0].MAX;
        html += '<input type="range" min="' + min + '" max="' + max + '"/>';
    } else if (details.TYPE == 'F') {
        // False
        html += '<input type="button" value="Send false"/>';
    } else if (details.TYPE == 'f') {
        // Float
        let min = details.RANGE[0].MIN;
        let max = details.RANGE[0].MAX;
        html += '<input type="range" min="' + min + '" max="' + max + '"/>';
    } else if (details.TYPE == 'I') {
        // Infinity
        html += '<input type="button" value="Send infinity"/>';
    } else if (details.TYPE == 'i') {
        // Integer
        let min = details.RANGE[0].MIN;
        let max = details.RANGE[0].MAX;
        html += '<input type="range" min="' + min + '" max="' + max + '"/>';
    } else if (details.TYPE == 'h') {
        // Longlong
        let min = details.RANGE[0].MIN;
        let max = details.RANGE[0].MAX;
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
