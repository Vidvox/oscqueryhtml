# OSCQueryApp

An HTML, Javascript, css application for retrieving OSCQuery responses (in json) and rendering an appropriate webapp.

### Proposal

See [https://github.com/mrRay/OSCQueryProposal](https://github.com/mrRay/OSCQueryProposal)

### Static deployment

1. Copy web/views/pages/index.ejs to index.html
2. In index.html, replace `<%= host_url %>` with the OSCQuery server, which serves the json feed. (TODO: How to improve this?)
3. Serve this modified `index.html`
4. Serve dist/bundle.js at the path `/bundle.js`
5. Serve assets/css/style.css at the path `/css/style.css`
6. (No need to serve assets/img, the images get built into the bundle.js)

### Building for development

1. Install npm
2. `npm install` - use npm to install dependencies
3. `npm run build` - execute webpack to build output/bundle.js

When development is complete, copy output/bundle.js to dist/bundle.js.

### Running node.js development server

1. `export SERVER_URL=http://192.168.1.42:2345` (OSCQuery Server)
2. `cd web`
3. `node server.js`

Open your browser and go nativate to http://localhost:5050

### Tests

`npm run test`

### CORS Security

Javascript running in-browser cannot make cross-origin requests unless the server being contacted sets the HTTP header "Access-Control-Allow-Origin: *".

If the server does not set this header, as a temporary workaround, you can install this [Chrome extension](https://chrome.google.com/webstore/detail/nlfbmbojpeacfghkpbjhddihlkkiljbi).

Otherwise, the json request will be blocked by Chrome's security policy.

