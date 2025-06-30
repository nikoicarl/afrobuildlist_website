module.exports = function (app) {
    app.get('/', (req, res) => {
        res.render('index', { user: req.user, page: 'home' });
    });

    app.get('/about', (req, res) => {
        res.render('about', { page: 'about' });
    });

    app.get('/help', (req, res) => {
        res.render('help', { page: 'help' });
    });

    app.get('/login', (req, res) => {
        res.render('login', { page: 'login' });
    });

    app.get('/register', (req, res) => {
        res.render('register', { page: 'register' });
    });

    app.get('/signup', (req, res) => {
        res.render('signup', { page: 'signup' });
    });

    app.get('/service', (req, res) => {
        res.render('services', { page: 'services' });
    });

    app.get('/product', (req, res) => {
        res.render('product', { page: 'product' });
    });

};

