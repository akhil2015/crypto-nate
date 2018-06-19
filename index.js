
const express = require('express');
const MetaAuth = require('meta-auth');
var pug = require('pug');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const db_url = 'mongodb://localhost:27017';
const dbName = 'crypto_users';

const mongo = require('./mongo.js');

const app = express();
const metaAuth = new MetaAuth();
const url = require('url');

const bodyParser = require("body-parser");

app.use(bodyParser.json()); // for parsing application/json
app.use(
    bodyParser.urlencoded({
        extended: true
    })
); // for parsing application/x-www-form-urlencoded

app.use('/', express.static('.'));

app.use(function (req, res, next) {
   console.log(req.url);
   next();
});

app.get('/auth/:MetaAddress', metaAuth, (req, res) => {
  // Request a message from the server
  if (req.metaAuth && req.metaAuth.challenge) {
    res.send(req.metaAuth.challenge)
  }
});

app.get('/send',function(req,res){
    var user_id = req.param('id');
    res.render('donate.pug', { address: user_id });
});

app.post('/register',metaAuth,function (req,res){
    var name = req.body.name;
    var email = req.body.email;
    mongo.registerWithNameAndEmail(name, email, function () {
        console.log(name, email); //save this in db alog with last entry
        res.render('success.pug')
    });
});

app.get('/msg',(req,res) => {
     var address = req.param('address');
     var msg = req.param('msg');
     //console.log(req);
     console.log(address,msg);
     mongo.storeMessageinDb(address, msg, function () {
         // TODO send message to bot
         res.send();
     })
});

app.get('/auth/:MetaMessage/:MetaSignature', metaAuth, (req, res) => {
    if (req.metaAuth && req.metaAuth.recovered) {
        // Signature matches the cache address/challenge
        // Authentication is valid, assign JWT, etc.
        console.log(req.metaAuth.recovered);//store this in db
        var val = req.metaAuth.recovered;
        mongo.storeAddressinDB(val, function () {
            res.send(req.metaAuth.recovered);
        });
    } else {
        // Sig did not match, invalid authentication
        res.status(400).send();
    };
});

// This will act as a webhook on which the telegram api will make HTTP Request
app.post('/message-received', (req, res) => {

});

app.listen(3002, () => {
    mongo.connect(function () {
        console.log('Listening on port 3001');
    });
});