const uuidV4 = require('uuid/v4');

var Router = require('restify-router').Router;
var router = new Router();
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/teste';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = mongoose.model('users');
var Post = mongoose.model('posts');
var Comment = mongoose.model('comments', new Schema({
	body: {
		type: String,
		required: true
	},
	user_id: {
		type: String,
		required: true
	},
	post_id: {
		type: String,
		required: true
	},
	data: {
		type: Date,
		default: Date.now()
	}
}));

mongoose.Promise = global.Promise;

// view all comments for x post
router.get('/comment/.*/', function (req, res, next) {
	MongoClient.connect(url, function(err, db) {
		if (!err)
		{
			var path = req.route.path;
			var wildcard = req.url.split(path.substring(0, path.lastIndexOf('.')))[1];
			mongoose.connect(url);

			Post.find({
			 	"$or": [{
					friendly_url: wildcard
				}, {
					id: wildcard
				}]
			}, {
				id: 1
			}).then(function(post){
				db.collection('comments').find({
					post_id: post[0].id
				}).toArray().then(function (comments){
					Promise.all(
						comments.map(function(comment){
							return new Promise((resolve, reject) => {
								db.collection('users').find({
									id: comment.user_id
								},{
									name: 1
								}).toArray().then(function(user){
									comment.user = user[0].name;
									resolve("woohoo");
								})
							})
						})
					).then(values => {
						res.json({
							success: true,
							data: comments
						});

						mongoose.connection.close();
					}).catch(reason => { 
					  console.log(reason)
					});
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

// create comment
router.post('/comment/create', function (req, res, next) {
	if (req.body.body)
	{
		req.body.id = uuidV4();
		req.body.user_id = "44748580-19ca-44e2-88e4-c089d662f036";
		req.body.post_id = "9f7d0a57-8d5e-4104-8c39-4e0c4219442d";
		
		var model = new Comment(req.body);
		
		mongoose.connect(url);

		model.save(function(err, comment){
			if (err) {
				res.status(500);
				res.json({
					success: false,
					error: "Error occured while inserting comment: " + err
				})
			} else {
				res.json({
					success: true,
					data: comment
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

// update comment
router.post('/comment/update', function (req, res, next) {
	if (req.body.id)
	{
		if (req.body.body)
		{	
			mongoose.connect(url);

			Comment.update({id: req.body.id}, {
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
			error: "Invalid comment"
		});
	}
});

// delete comment
router.post('/comment/delete', function (req, res, next) {
	if (req.params.id)
	{
		mongoose.connect(url);

		Comment.findOneAndRemove({
			id: req.params.id
		}, function(err, comment){
			if (err) {
				res.status(500);
				res.json({
					success: false,
					error: "Error occured trying to remove comment: " + err
				})
			} else {
				res.json({
					success: true,
					data: comment
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