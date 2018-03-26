const express = require('express');
const app = express();

const PORT = 5050;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static('public'));

app.get('/', (req, res) => {
    let context = {message: 'Hello'};
    res.render('pages/index', context);
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
