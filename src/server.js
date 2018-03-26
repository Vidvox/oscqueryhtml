const express = require('express');
const app = express();

const builder = require('./builder');
const retrieve = require('./retrieve');
const util = require('./util');

const PORT = 5050;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static('public'));

app.get('/', (req, res) => {
    const url = process.env['SERVER_URL'];
    retrieve.retrieveJson(url, (result) => {
        let rawHtml = builder.buildFromQueryResult(result);
        let context = {rawHtml: rawHtml};
        res.render('pages/index', context);
    });
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
