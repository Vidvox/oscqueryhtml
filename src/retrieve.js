const http = require('http');

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

function objectGetValue(obj, i) {
    return obj[Object.keys(obj)[i]];
}

function main() {
    const url = process.env['SERVER_URL'];
    retrieveJson(url, (result) => {
        let keys = Object.keys(result);
        console.log(keys);
        let contents = result.CONTENTS;
        // TODO: Iterate all directories?
        let dir = objectGetValue(contents, 0);
        let innerContents = dir.CONTENTS;
        console.log(Object.keys(innerContents));
        for (let nodeKey in innerContents) {
            let node = innerContents[nodeKey];
            let nodeType = node.TYPE;
            console.log(node['FULL_PATH'] + ' ' + nodeType);
        }
    });
}
main();
