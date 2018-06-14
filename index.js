const express = require('express');
const MetaAuth = require('meta-auth');
var pug = require('pug');
var MongoClient = require('mongodb').MongoClient;
var db_url = 'mongodb://localhost/crypto_users';

 
const app = express();
const metaAuth = new MetaAuth();
const url = require('url');  
app.use('/', express.static('.'));

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
app.get('/register',metaAuth,function (req,res){
    var name = req.param('name');
    var email = req.param('email');
    console.log(name,email) //save this in db alog with last entry

});
app.get('/auth/:MetaMessage/:MetaSignature', metaAuth, (req, res) => {
  if (req.metaAuth && req.metaAuth.recovered) {
    // Signature matches the cache address/challenge
    // Authentication is valid, assign JWT, etc.
    console.log(req.metaAuth.recovered)
    MongoClient.connect(db_url, function(err, db) {
    console.log(db.getName())

});//store this in db
    res.send(req.metaAuth.recovered);
  } else {
    // Sig did not match, invalid authentication
    res.status(400).send();
  };
});

app.listen(3001, () => {
  console.log('Listening on port 3001')
})