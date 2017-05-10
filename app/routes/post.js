const uuidV4 = require('uuid/v4');

var Router = require('restify-router').Router;
var router = new Router();
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/teste';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = mongoose.model('users');
var Post = mongoose.model('posts', new Schema({
	id: {
		type: String,
		required: true
	},
	title: {
		type: String,
		required: true
	},
	body: {
		type: String,
		required: true
	},
	user_id: {
		type: String,
		required: true
	},
	date: {
		type: Date,
		default: Date.now()
	},
	friendly_url: {
		type: String,
		required: true
	}
}));

mongoose.Promise = global.Promise;

// view all posts
router.get('/post', function (req, res, next) {
	MongoClient.connect(url, function(err, db) {
		if (!err)
		{
			db.collection('posts').find().toArray().then(function (posts){
				Promise.all(
					posts.map(function(post){
						return new Promise((resolve, reject) => {
							db.collection('users').find({
								id: post.user_id
							},{
								name: 1
							}).toArray().then(function(user){
								post.user = user[0].name;
								resolve("woohoo");
							})
						})
					})
				).then(values => {
					res.json({
						success: true,
						data: posts
					});

					db.close();
				}).catch(reason => { 
				  console.log(reason)
				});
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

// view specific posts recieved friendly url
router.get('/post/.*/', function (req, res, next) {
	MongoClient.connect(url, function(err, db) {
		if (!err)
		{
			var path = req.route.path;

			db.collection('posts').find({
				friendly_url: req.url.split(path.substring(0, path.lastIndexOf('.')))[1] // gets wildcard
			}).toArray().then(function (data){
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

// create post
router.post('/post/create', function (req, res, next) {
	if (req.body.body && req.body.title)
	{
		req.body.id = uuidV4();
		req.body.friendly_url = getFriendlyUrl(req.body.title);
		req.body.user_id = "d0f5fb2a-8a96-486a-9f85-2c8d538c05e8";
		
		var model = new Post(req.body);
		
		mongoose.connect(url);

		model.save(function(err, post){
			if (err) {
				res.status(500);
				res.json({
					success: false,
					error: "Error occured while inserting post: " + err
				})
			} else {
				res.json({
					success: true,
					data: post
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

// update post
router.post('/post/update', function (req, res, next) {
	if (req.body.id)
	{
		if (req.body.body)
		{	
			mongoose.connect(url);

			Post.update({id: req.body.id}, {
				body: req.body.body
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
			error: "Invalid post"
		});
	}
});

// delete post
router.post('/post/delete', function (req, res, next) {
	if (req.params.id)
	{
		mongoose.connect(url);

		Post.findOneAndRemove({
			id: req.params.id
		}, function(err, post){
			if (err) {
				res.status(500);
				res.json({
					success: false,
					error: "Error occured trying to remove post: " + err
				})
			} else {
				res.json({
					success: true,
					data: post
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

function getFriendlyUrl(url)
{
	return url.replace(new RegExp(" ", 'g'), "-");
}

module.exports = router;