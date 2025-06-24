module.exports = function (app) {
    app.get('/', (req, res) => {
        res.render('index', { page: 'home' });
    });

    app.get('/about', (req, res) => {
        res.render('about', { page: 'about' });
    });

    app.get('/help', (req, res) => {
        res.render('help', { page: 'help' });
    });

};

