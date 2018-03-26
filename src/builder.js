const util = require('./util');

function buildFromQueryResult(result) {
    let contents = result.CONTENTS;
    // TODO: Iterate all directories?
    let dir = util.objectGetValue(contents, 0);
    let innerContents = dir.CONTENTS;
    let innerKeys = Object.keys(innerContents);
    let html = '';
    for (let k = 0; k < innerKeys.length; k++) {
        html += '<div class="control">' + innerKeys[k] + '</div>';
    }
    return html;
}

module.exports.buildFromQueryResult = buildFromQueryResult;
