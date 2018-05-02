# OSCQueryApp

An HTML, Javascript, css application for retrieving OSCQuery responses (in json) and rendering an appropriate webapp.

### Usage

1. Copy web/views/pages/index.ejs to index.html
2. In index.html, replace `<%= host_url %>` with the OSCQuery server, which serves the json feed. (TODO: How to improve this?)
3. Serve this modified `index.html`
4. Serve dist/bundle.js at the path `/bundle.js`
5. Serve assets/css/style.css at the path `/css/style.css`
6. (No need to serve assets/img, the images get built into the bundle.js)

### CORS Security

Javascript running in-browser cannot make cross-origin requests unless the server being contacted sets the HTTP header "Access-Control-Allow-Origin: *".

If the server does not set this header, as a temporary workaround, you can install this [Chrome extension](https://chrome.google.com/webstore/detail/nlfbmbojpeacfghkpbjhddihlkkiljbi).

Otherwise, the json request will be blocked by Chrome's security policy.

### Building

1. Install npm
2. `npm install` - use npm to install dependencies
3. `npm run build` - execute webpack to build dist/bundle.js

### TODO

Missing features:

1. LISTEN, IGNORE
2. HOST_INFO and EXTENSIONS
3. ACCESS checking, handle 40x's
4. longlong type
5. searching for tags