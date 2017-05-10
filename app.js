const restify = require('restify');
const fs = require('fs');
const port = process.env.PORT || 8081;
const routes = process.cwd() + "/app/routes";
const server = restify.createServer();
const mongoose = require("mongoose");

server.use(restify.fullResponse());
server.use(restify.bodyParser());
server.use(restify.queryParser());

// routes
require(routes + '/user').applyRoutes(server);
require(routes + '/post').applyRoutes(server);
require(routes + '/comment').applyRoutes(server);

/**
 * Error Handling
 */
server.on('uncaughtException', (req, res, route, err) => {
    res.send(err);
    console.log(err);
});

server.listen(port, function (err) {
	if (err)
		console.error(err)
	else
		console.log('App is ready at : ' + port)
});

if (process.env.environment == 'production')
{
	process.on('uncaughtException', function (err) {
		console.error(JSON.parse(JSON.stringify(err, ['stack', 'message', 'inner'], 2)))
	})
}