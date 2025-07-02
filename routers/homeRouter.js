module.exports = function (app) {
    // Route for home page
    app.get('/', (req, res) => {
        res.render('index', { page: 'home' });
    });

    // Route for dashboard page
    app.get('/dashboard', (req, res) => {
        res.render('dashboard', { page: 'dashboard' });
    });

    // Route for about page
    app.get('/about', (req, res) => {
        res.render('about', { page: 'about' });
    });

    // Route for help page
    app.get('/help', (req, res) => {
        res.render('help', { page: 'help' });
    });

    // Route for login page
    app.get('/login', (req, res) => {
        res.render('login', { page: 'login' });
    });

    // Route for register page
    app.get('/register', (req, res) => {
        res.render('register', { page: 'register' });
    });

    // Route for signup page
    app.get('/signup', (req, res) => {
        res.render('signup', { page: 'signup' });
    });

    // Route for service page
    app.get('/service', (req, res) => {
        res.render('services', { page: 'services' });
    });

    // Route for product page
    app.get('/product', (req, res) => {
        res.render('product', { page: 'product' });
    });

    // Route for cart page
    app.get('/cart', (req, res) => {
        res.render('cart', { page: 'cart' });
    });

    // Route for checkout page
    app.get('/checkout', (req, res) => {
        const ref = req.query.ref;
        const data = global.checkoutData?.[ref];

        if (!data) {
            return res.status(404).send('Invalid or expired checkout session.');
        }

        res.render('checkout', {
            cart: data.cart,
            user: data.user
        });
    });


    app.post('/checkout-initiate', (req, res) => {
        const { cart, user } = req.body;

        if (!cart || !user) {
            return res.status(400).json({ error: 'Missing cart or user data' });
        }

        // Create a session-like reference
        const checkoutId = `${user.id}_${Date.now()}`;
        global.checkoutData = global.checkoutData || {};
        global.checkoutData[checkoutId] = { cart, user };

        res.json({ redirectUrl: `/checkout?ref=${checkoutId}` });
    });

};
