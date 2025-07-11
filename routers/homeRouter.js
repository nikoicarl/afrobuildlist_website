const md5 = require('md5');
const fetch = require('node-fetch');
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');

module.exports = function (app) {
    // Static page routes with simple rendering
    const pages = [
        { path: '/', view: 'index', page: 'home' },
        { path: '/dashboard', view: 'dashboard', page: 'dashboard' },
        { path: '/about', view: 'about', page: 'about' },
        { path: '/help', view: 'help', page: 'help' },
        { path: '/login', view: 'login', page: 'login' },
        { path: '/register', view: 'register', page: 'register' },
        { path: '/signup', view: 'signup', page: 'signup' },
        { path: '/service', view: 'services', page: 'services' },
        { path: '/product', view: 'product', page: 'product' },
        { path: '/cart', view: 'cart', page: 'cart' }
    ];

    pages.forEach(({ path, view, page }) => {
        app.get(path, (req, res) => {
            res.render(view, {
                page,
                user: req.user || null,
                cart: req.session?.cart || {}
            });
        });
    });

    // === Checkout: GET route to display checkout page ===
    app.get('/checkout', (req, res) => {
        const ref = req.query.ref;
        const data = global.checkoutData?.[ref];

        if (!data) {
            return res.status(404).send('Invalid or expired checkout session.');
        }

        res.render('checkout', {
            cart: data.cart,
            user: data.user,
            page: 'checkout'
        });
    });

    // === Checkout: POST route to initiate checkout session ===
    app.post('/checkout-initiate', (req, res) => {
        const { cart, user } = req.body;

        if (!cart || !user) {
            return res.status(400).json({ error: 'Missing cart or user data' });
        }

        const rawId = `${user.id}-${Date.now()}-${Math.random()}`;
        const checkoutId = md5(rawId);

        global.checkoutData = global.checkoutData || {};
        global.checkoutData[checkoutId] = { cart, user };

        res.json({ redirectUrl: `/checkout?ref=${checkoutId}` });
    });

    // Render Reset Password Page
    app.get('/reset-password', (req, res) => {
        const { token, email } = req.query;

        if (!token || !email) {
            return res.status(400).send('Invalid reset link.');
        }

        res.render('reset-password', {
            token,
            email,
            page: 'reset-password',
            user: null,
            cart: req.session?.cart || {}
        });
    });

    app.post('/auth/google', async (req, res) => {
        const accessToken = req.body?.access_token;
        console.log("Access token received:", accessToken);

        if (!accessToken) {
            return res.status(400).json({ message: 'No access token provided' });
        }

        try {
            const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (!googleRes.ok) {
                const errText = await googleRes.text();
                console.error("Google response error:", errText);
                return res.status(401).json({ message: 'Invalid access token' });
            }

            const profile = await googleRes.json();
            console.log("Google user profile:", profile);

            // TODO: lookup or create user in DB here using profile.sub (Google ID) or profile.email

            return res.status(200).json({
                message: 'Login successful',
                user: profile
            });

        } catch (err) {
            console.error('Failed to fetch user info from Google:', err);
            return res.status(500).json({ message: 'Server error verifying token' });
        }
    });

};
