const http = require('http');
const util = require('./util');

function retrieveJson(url, cb) {
    http.get(url, (res) => {
        let buff = '';
        res.on('data', (chunk) => {
            buff += chunk;
        });
        res.on('end', () => {
            cb(JSON.parse(buff));
        });
    });
}

function main() {
    const url = process.env['SERVER_URL'];
    retrieveJson(url, (result) => {
        let keys = Object.keys(result);
        console.log(keys);
        let contents = result.CONTENTS;
        // TODO: Iterate all directories?
        let dir = util.objectGetValue(contents, 0);
        let innerContents = dir.CONTENTS;
        console.log(Object.keys(innerContents));
        for (let nodeKey in innerContents) {
            let node = innerContents[nodeKey];
            let nodeType = node.TYPE;
            console.log(node['FULL_PATH'] + ' ' + nodeType);
        }
    });
}

if (require.main == module) {
    main();
}

module.exports.retrieveJson = retrieveJson;
