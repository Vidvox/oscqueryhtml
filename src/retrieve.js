import 'whatwg-fetch';

function retrieveHostInfo(url, cb) {
    var hostInfoUrl = url + '/?HOST_INFO';
    fetch(hostInfoUrl)
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            cb(json);
        }).catch(function(ex) {
            console.log('No HOST_INFO "' + ex + '"');
        });
}

function retrieveJson(url, cb) {
    fetch(url)
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            cb(json);
        }).catch(function(ex) {
            document.write('Failed to retrieve JSON, check console for ' +
                           'error details');
            throw ex;
        });
}

export {retrieveJson, retrieveHostInfo};
