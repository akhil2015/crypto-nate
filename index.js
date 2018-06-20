
const express = require('express');
const MetaAuth = require('meta-auth');
const pug = require('pug');

const mongo = require('./mongo.js');
const telegram = require('./telegram.js');

const app = express();
const metaAuth = new MetaAuth();
const url = require('url');

const bodyParser = require("body-parser");

let otpArray = [];
let id_who_have_otp_requested = [];
let otpsSent = [];
let current_time = 0;

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
    console.log(otp, " From Frontend");
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
<<<<<<< HEAD
        var otp = generateOTP();
        mongo.storeAddressinDB(val,otp, function () {
=======
        let otp = generateOTP();
        otpArray.push({
            address: val,
            otp : otp
        });
        mongo.storeAddressinDB(val, function () {
>>>>>>> 90c6b80337c2c3a696f43af0eafdf9931906a8f4
            res.send({
                auth : req.metaAuth.recovered,
                otp : otp
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
        if(otpArray.findIndex(function (ele) {
            return ele.otp === number;
        }) <= 0){
            return number;
        }
    }
}

// This will act as a webhook on which the telegram api will make HTTP Request
app.post('/message-received', (req, res) => {
    if(!req.body.message){
        res.sendStatus(200);
    }else{
        console.log("message = ", req.body.message.text);
        let id = req.body.message.from.id;
        // if(req.body.message.)
        if(telegram.checkForFirstMessage(req.body.message)){
            let id = req.body.message.from.id;
            let name = req.body.message.from.first_name;
            console.log("Sending First Message");
            let message = "Hi! " + name + ". Please Enter the OTP Given To You";
            telegram.sendMessage(id, message, function () {
                id_who_have_otp_requested.push(id);
                console.log("Sent");
                res.sendStatus(200);
            })
        }else{
            let chat_id_idx = otpSentOrNot(id);
            if(chat_id_idx >= 0){
                console.log("OTP Already Sent");
                let msg = req.body.message.text;

                let idx = otpArray.findIndex(function (ele) {
                    return ele.otp == msg;
                });

                if(idx === -1){
                    telegram.sendMessage(id, "OTP! Incorrect...");
                    res.sendStatus(200);
                }else{
                    console.log("OTP Correct");
                    let element = otpArray.splice(idx, 1)[0].address;
                    id_who_have_otp_requested.splice(chat_id_idx, 1);
                    console.log(element);
                    telegram.sendMessage(id, "OTP Matched. Your Ethereum Address = " + element);
                    res.sendStatus(200);
                }

            }else{
                console.log("Good Old Message", req.body.message);
                let id = req.body.message.from.id;
                let msg = req.body.message.text;
                mongo.storeMessageinDb(id, msg, function () {
                    res.sendStatus(200);
                })
            }
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
        current_time = new Date().getTime();
        console.log('Listening on port 3002', current_time);
    });
});