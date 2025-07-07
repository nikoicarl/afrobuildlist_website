const md5 = require('md5');
const nodemailer = require('nodemailer');
require('dotenv').config();

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


    // === Contact Form POST ===
    app.post('/contact', async (req, res) => {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: parseInt(process.env.MAIL_PORT, 10),
            secure: process.env.MAIL_SECURE === 'true', // Converts string to boolean
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        const mailOptions = {
            from: `"AfroBuild Contact" <${process.env.MAIL_USER}>`,
            to: 'support@afrobuildlist.com', // Or whatever email should receive the messages
            subject: `New message from ${name}`,
            text: `From: ${name} <${email}>\n\n${message}`,
            replyTo: email
        };

        try {
            await transporter.sendMail(mailOptions);
            res.json({ success: true });
        } catch (err) {
            console.error('Email send failed:', err);
            res.status(500).json({ success: false, message: 'Something went wrong while sending email.' });
        }
    });

};
