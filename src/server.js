const express = require('express');
const app = express();

const retrieve = require('./retrieve');
const util = require('./util');

const PORT = 5050;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static('public'));

app.get('/', (req, res) => {
    const url = process.env['SERVER_URL'];
    retrieve.retrieveJson(url, (result) => {
        let contents = result.CONTENTS;
        // TODO: Iterate all directories?
        let dir = util.objectGetValue(contents, 0);
        let innerContents = dir.CONTENTS;
        let innerKeys = Object.keys(innerContents);
        let context = {controlNames: innerKeys};
        res.render('pages/index', context);
    });
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
