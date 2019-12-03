// config/passport.js

var LocalStrategy   = require('passport-local').Strategy;
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('./database');
var validator = require("email-validator");
var fs = require('fs');
var passwordValidator = require('password-validator');
var connection = mysql.createConnection(dbconfig.connection);
connection.query('USE ' + dbconfig.database);

var passwords_array = fs.readFileSync('passwords.txt').toString().split('\n');
var schema = new passwordValidator();
schema
.is().min(8)
.is().max(100)
.has().uppercase()
.has().lowercase()
.has().digits()
.has().symbols();

var schema_dict = new passwordValidator();
schema_dict
.is().not().oneOf(passwords_array);

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        connection.query("SELECT * FROM users WHERE id = ? ",[id], function(err, rows){
            done(err, rows[0]);
        });
    });

    passport.use(
        'local-signup',
        new LocalStrategy({
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true
        },
        function(req, username , password, done) {
                if(!username || !req.body.fname || !req.body.lname || !req.body.dob || !password) {
                  return done(null, false, req.flash('signupMessage', 'Make sure any field is not empty!'));
                }
                if(!validator.validate(username)) {
                  return done(null, false, req.flash('signupMessage', 'Make sure you have entered a valid email-address'));
                }
                if(!schema.validate(password)) {
                  return done(null, false, req.flash('signupMessage', 'Your password is weak! Make sure you enter a stronger password!'));
                }
                if(!schema_dict.validate(password.toLowerCase().replace(/[^a-zA-Z]/g,''))) {
                  return done(null, false, req.flash('signupMessage', 'Your password can form a dictionary word! Please choose a stronger password!'));
                }
                connection.query("SELECT * FROM users WHERE username = ?",[username], function(err, rows) {
                if (err)
                    return done(err);
                if (rows.length) {
                    return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                }
                if (req.body.fname.length >= 50 || req.body.lname.length >=50 || username.length >=50) {
                    return done(null, false, req.flash('signupMessage', 'Maximum Allowable length : 50'));
                } else {
                    var newUserMysql = {
                        username: username,
                        password: bcrypt.hashSync(password, null, null),
                        firstname : req.body.fname ,
                        lastname : req.body.lname ,
                        dateOfBirth : req.body.dob
                    };

                    var insertQuery = "INSERT INTO users ( username, firstname , lastname , DOB , password ) values (?,?,?,?,?)";
                    connection.query(insertQuery,[newUserMysql.username, newUserMysql.firstname , newUserMysql.lastname , newUserMysql.dateOfBirth , newUserMysql.password],function(err, rows) {
                        newUserMysql.id = rows.insertId;

                        return done(null, newUserMysql);
                    });
                }
            });
        })
    );

    passport.use(
        'local-login',
        new LocalStrategy({
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true
        },
        function(req, username, password, done) {

            connection.query("SELECT * FROM users WHERE username = ?",[username], function(err, rows){
                if (err)
                    return done(err);
                if (!rows.length) {
                    return done(null, false, req.flash('loginMessage', 'No user found.'));
                }
                if (!bcrypt.compareSync(password, rows[0].password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
                return done(null, rows[0]);
            });
        })
    );
};
