import 'whatwg-fetch';

function retrieveHostInfo(url, cb) {
    var hostInfoUrl = url + '/?HOST_INFO';
    fetch(hostInfoUrl)
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            cb(null, json);
        }).catch(function(err) {
            cb('No HOST_INFO "' + err + '"', null);
        });
}

function retrieveJson(url, cb) {
    fetch(url)
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            cb(null, json);
        }).catch(function(err) {
            cb('Failed to retrieve JSON from "' + url + '"', null);
        });
}

export {retrieveJson, retrieveHostInfo};
