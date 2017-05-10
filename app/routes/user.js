const uuidV4 = require('uuid/v4');

var Router = require('restify-router').Router;
var router = new Router();
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/teste';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = mongoose.model('users', new Schema({
	id: {
		type: String,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	}
}));

mongoose.Promise = global.Promise;

// view users.
// if no params are recieved we fetch all of them, 
// otherwise we query according to the recieved params
router.get('/user', function (req, res, next) {
	MongoClient.connect(url, function(err, db) {
		if (!err)
		{
			var opts  = {};
			Object.keys(req.params).map(function(key, index){
				opts[key] = req.params[key];
			});

			db.collection('users').find(opts).toArray().then(function (data){
				res.json({
					success: true,
					data: data
				});

				db.close();
			});
		}
		else
		{
			res.status(500);
			res.json({
				success: false,
				error: "Failed to establish connection with database: " + err
			});
		}
	});
});

// register user
router.post('/user/create', function (req, res, next) {
	if (req.body.name && req.body.name && req.body.password)
	{
		req.body.id = uuidV4();
		var model = new User(req.body);
		mongoose.connect(url);
		model.save(function(err, user){
			if (err) {
				res.status(500);
				res.json({
					success: false,
					error: "Error occured while inserting user: " + err
				})
			} else {
				res.json({
					success: true,
					data: user
				})
			}

			mongoose.connection.close();
		});
	}
	else
	{
		res.json({
			success: false,
			error: "Please fill in all mandatory fields"
		});
	}
});

// update user
router.post('/user/update', function (req, res, next) {
	if (req.body.id)
	{
		if (req.body.name && req.body.email && req.body.password)
		{	
			mongoose.connect(url);

			User.update({id: req.body.id}, {
				name: req.body.name,
				email: req.body.email,
				password: req.body.password
			}, function(err, raw){
				if (err)
				{
					raw.type = false;
					raw.error = "Failed to update user";
					res.json(raw);
				}
				else
				{
					res.json({ type: true });
				}

				mongoose.connection.close();
			});
		}
		else
		{
			res.json({
				success: false,
				error: "Please fill in all mandatory fields"
			});
		}
	}
	else
	{
		res.json({
			success: true,
			error: "Invalid user"
		});
	}
});

// delete user
router.post('/user/delete', function (req, res, next) {
	if (req.params.id)
	{
		mongoose.connect(url);

		User.findOneAndRemove({
			id: req.params.id
		}, function(err, user){
			if (err) {
				res.status(500);
				res.json({
					success: false,
					error: "Error occured trying to remove user: " + err
				})
			} else {
				res.json({
					success: true,
					data: user
				})
			}

			mongoose.connection.close();			
		});
	}
	else
	{
		res.json({
			success: true,
			error: "Please fill in all mandatory fields"
		});
	}
});

// find user with email and password
router.post('/user/auth', function (req, res, next) {
	if (req.body.email && req.body.password)
	{
		mongoose.connect(url);

		User.findOne({
			"email" : req.body.email,
			"password" : req.body.password
		}, function(err, data){
			if (!err)
			{
				res.json({
					success: true,
					found: (data === null) ? false : true,
					data: data
				});
			}
			else
			{
				res.status(500);
				res.json({
					success: false,
					error: "Failed to establish connection with database: " + err
				})
			}

			mongoose.connection.close();			
		});
	}
	else
	{
		res.json({
			success: true,
			error: "Please fill in all mandatory fields"
		});
	}
});

module.exports = router;