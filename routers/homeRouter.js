module.exports = function (app) {
    app.get('/', async (request, response) => {
        const queryStr = request.query;
        const config = process.env;

        return response.render('index');

    });
};

