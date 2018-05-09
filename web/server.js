const express = require('express');
const app = express();

const PORT = 5050;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static('../assets/'));
app.use(express.static('../dist'));

app.get('/', (req, res) => {
    const url = process.env['SERVER_URL'];
    if (!url) {
        throw 'SERVER_URL not set, cannot connect to OSC Server'
    }
    let context = {hostUrl: url};
    res.render('pages/index', context);
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
