
const express = require('express');
const MetaAuth = require('meta-auth');
var pug = require('pug');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const db_url = 'mongodb://localhost:27017';
const dbName = 'crypto_users';

const mongo = require('./mongo.js');
const telegram = require('./telegram.js');

const app = express();
const metaAuth = new MetaAuth();
const url = require('url');

const bodyParser = require("body-parser");

let otpArray = [0];
let id_who_have_otp_requested = [{}];
let otpsSent = [0];

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
    let otp = req.body.otp;
    otpArray.push({otp : otp, email : email});
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
            res.send({
                auth : req.metaAuth.recovered,
                otp : generateOTP()
            });
        });
    } else {
        // Sig did not match, invalid authentication
        res.status(400).send();
    }
});

function generateOTP(){
    let number;
    while(true){
        number = Math.floor(100000 + Math.random() * 900000);
        console.log(number);
        if(otpsSent.findIndex(function (ele) {
            return ele === number;
        }) <= 0){
            return number;
        }
    }
}

// This will act as a webhook on which the telegram api will make HTTP Request
app.post('/message-received', (req, res) => {
    console.log("message = ", req.body.message.text);
    let id = req.body.message.from.id;
    if(telegram.checkForFirstMessage(req.body.message)){
        let id = req.body.message.from.id;
        let name = req.body.message.from.first_name;
        console.log("Sending First Message");
        let message = "Hi! " + name + ". Please Enter the OTP Given To You";
        telegram.sendMessage(id, message, function () {
            id_who_have_otp_requested.push(id);
            console.log("Sent")
        })
    }else{
        let chat_id_idx = otpSentOrNot(id);
        if(chat_id_idx >= 0){
            let msg = req.body.message;

            let idx = otpArray.findIndex(function (ele) {
                return ele.otp == msg;
            });

            if(idx === -1){
                telegram.sendMessage(id, "OTP! Incorrect...");
            }else{
                let email = otpArray.splice(idx, 1).email;
                chat_id_idx.splice(chat_id_idx, 1);
                console.log(email);
            }

        }else{
            console.log("Good Old Message", req.body.message);
            let msg = req.body.message;
            let id = req.body.message.from.id;
            mongo.storeMessageinDb(id, msg, function () {
                res.send();
            })
        }
    }
});

function otpSentOrNot(id){
    return id_who_have_otp_requested.findIndex(function (ele) {
        return ele === id;
    });
}

app.listen(3002, () => {
    mongo.connect(function () {
        console.log('Listening on port 3002');
    });
});