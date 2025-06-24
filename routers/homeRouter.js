module.exports = function (app) {
    app.get('/', async (request, response) => {
        const queryStr = request.query;
        const config = process.env;

        return response.render('index');

    });


    app.get('/about', async (request, response) => {
        const queryStr = request.query;
        const config = process.env;

        return response.render('about');

    });
};

