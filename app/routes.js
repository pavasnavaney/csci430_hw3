// app/routes.js

var multer = require('multer');
var crypto = require('crypto');
var fs = require('fs');
var mime = require('mime');
var path = require('path');
var Promise = require('promise');

var storage = multer.diskStorage({
		destination: function (req, file, cb) {
			var hash = crypto.createHash('sha256').update(JSON.stringify(req.user)).digest('base64');
			hash = hash.replace('/','');
			var newDestination = 'public/uploads/' + hash;
			var stat = null;
			try {
            stat = fs.statSync(newDestination);
        } catch (err) {
            throw new Error('Directory not found!');
        }
        if (stat && !stat.isDirectory()) {
            throw new Error('Directory cannot be created because an inode of a different type exists at "' + dest + '"');
        }
	    cb(null, newDestination);
	  },
		filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      cb(null, raw.toString('hex') + Date.now() + '.' + mime.getExtension(file.mimetype));
    });
  }
});

var upload = multer({
	storage: storage,
	fileFilter: function (req, file, callback) {
		var ext = path.extname(file.originalname);
		if(ext.toLowerCase() !== '.png' && ext.toLowerCase() !== '.jpg' && ext.toLowerCase() !== '.gif' && ext.toLowerCase() !== '.jpeg' && ext.toLowerCase() !== '.svg') {
				req.fileValidationError = "Forbidden extension";
				return callback(null, false, req.fileValidationError);
		}
        callback(null, true)
    }
 })

module.exports = function(app, passport) {

	app.get('/', function(req, res) {
		res.render('index.ejs');
	});

	app.get('/login', function(req, res) {
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	app.post('/upload', isLoggedIn , upload.single('pic'), (req, res, next) => {
  const file = req.file
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
		console.log('Even Im called!');
		res.redirect('/profile');
		next();
  } else {
		console.log(file);
	  res.redirect('/profile');
		next();
	}
})

	app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile',
            failureRedirect : '/login',
            failureFlash : true
		}),
        function(req, res) {
            console.log("hello");

            if (req.body.remember) {
              req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
              req.session.cookie.expires = false;
            }
        res.redirect('/');
    });
	app.get('/signup', function(req, res) {
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile',
		failureRedirect : '/signup',
		failureFlash : true
	}));



	app.get('/profile', isLoggedIn, function(req, res , next) {
		console.log('Getting URLs');
		function getURLS() {
				return new Promise(function(resolve , reject) {
					var hash = crypto.createHash('sha256').update(JSON.stringify(req.user)).digest('base64');
					hash = hash.replace('/','');
					var file_arr = []
					var newDestination = 'public/uploads/' + hash;
					const fs = require('fs');
					var stat = null;
					try {
								stat = fs.statSync(newDestination);
								fs.readdir(newDestination, (err, files) => {
									if(!files.length)
										resolve(null);
									files.forEach(file => {
										file_arr.push('/uploads' + '/' + hash + '/' + file);
										console.log(newDestination + '/' + hash + '/' + file);
										resolve(file_arr);
								});
						});
						} catch (err) {
								fs.mkdirSync(newDestination);
								resolve(file_arr);
						}
						if (stat && !stat.isDirectory()) {
								throw new Error('Directory cannot be created because an inode of a different type exists at "' + dest + '"');
								reject('Error');
						}
				});
		}
		getURLS().then(function(data) {
			console.log('Got urls');
			if(data == null) {
				data = [];
			}
			console.log('Promise data ' + data);
			res.render('profile.ejs', {
				user : req.user,
				allphotos : data
			});
			next();
		});
	});

	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
};

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();
	res.redirect('/');
}
