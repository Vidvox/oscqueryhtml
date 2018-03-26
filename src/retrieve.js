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

function main() {
    const url = process.env['SERVER_URL'];
    retrieveJson(url, (result) => {
        console.log(JSON.stringify(result, null, 2));
    });
}
main();

