import 'whatwg-fetch';

function retrieveJson(url, cb) {
    fetch(url)
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            cb(json);
        }).catch(function(ex) {
            throw ex;
        });
}

export {retrieveJson};
