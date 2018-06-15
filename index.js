const express = require('express');
const MetaAuth = require('meta-auth');
var pug = require('pug');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const db_url = 'mongodb://localhost:27017';
const dbName = 'crypto_users';

 
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
    MongoClient.connect(db_url, function(err, client) {
        assert.equal(null, err);
        console.log("REGISTER: Connected correctly to server");

        const db = client.db(dbName);
        var condn= {_id:-1};
        var element;
        db.collection('user_data').find().sort(condn).toArray(function(err, result) {  
            if (err) throw err;

            //console.log(result[0]);
            //update record where result[0]
            element = result[0];
            db.collection('user_data').updateOne(element, {$set: {name: name,email:email}});
          });
    });
    console.log(name,email) //save this in db alog with last entry
});
app.get('/msg',(req,res) => {
      var address = req.param('address');
      var msg = req.param('msg');
      //console.log(req);
      console.log(address,msg);
      MongoClient.connect(db_url, function(err, client) {
            assert.equal(null, err);
            console.log("Connected correctly to server");

            const db = client.db(dbName);
          db.collection('messages').insertOne({address:address,message:msg}, function(err, r) {
              assert.equal(null, err);
              assert.equal(1, r.insertedCount);
                client.close();
      });
        });
});
app.get('/auth/:MetaMessage/:MetaSignature', metaAuth, (req, res) => {
  if (req.metaAuth && req.metaAuth.recovered) {
    // Signature matches the cache address/challenge
    // Authentication is valid, assign JWT, etc.
    console.log(req.metaAuth.recovered);//store this in db
    var val = req.metaAuth.recovered;
    MongoClient.connect(db_url, function(err, client) {
        assert.equal(null, err);
        console.log("Connected correctly to server");

        const db = client.db(dbName);
      db.collection('user_data').insertOne({address:val}, function(err, r) {
          assert.equal(null, err);
          assert.equal(1, r.insertedCount);
            client.close();
      });
});
    res.send(req.metaAuth.recovered);
  } else {
    // Sig did not match, invalid authentication
    res.status(400).send();
  };
});

app.listen(3001, () => {
  console.log('Listening on port 3001')
})