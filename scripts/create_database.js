var mysql = require('mysql');
var dbconfig = require('../config/database');

var connection = mysql.createConnection(dbconfig.connection);

connection.query('CREATE DATABASE ' + dbconfig.database);
connection.query('USE csci430');

connection.query('\
CREATE TABLE `users` ( \
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    `username` VARCHAR(50) NOT NULL, \
    `firstname` VARCHAR(50) NOT NULL, \
    `lastname` VARCHAR(50) NOT NULL, \
    `DOB` DATE NOT NULL, \
    `password` CHAR(60) NOT NULL, \
    PRIMARY KEY (`id`), \
    UNIQUE INDEX `id_UNIQUE` (`id` ASC), \
    UNIQUE INDEX `username_UNIQUE` (`username` ASC) \
)');

console.log('Success: Database Created!')

connection.end();
