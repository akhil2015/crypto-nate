const express = require('express');
const MetaAuth = require('meta-auth');
const pug = require('pug');
const randomURL = 'https://4d42317e.ngrok.io';

const mongo = require('./mongo.js');
const telegram = require('./telegram.js');

const app = express();
const metaAuth = new MetaAuth();
const url = require('url');

const bodyParser = require("body-parser");

let otpArray = [];
// let id_who_have_otp_requested = [];
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

app.post('/register',metaAuth,function (req,res){
    let otp = req.body.otp;
    let address = req.body.address;
    console.log(otp, " From Frontend");
    let idx = otpArray.findIndex(function (ele) {
        return ele.otp == otp;
    });
    if(idx >= 0){
        let element = otpArray.splice(idx, 1)[0];
        if(!element.verified){
            let name = element.name;
            let id = element.id;
            mongo.registerWithNameAndAddress(name, address, id, function () {
                telegram.sendMessage(id, "Congrats! Registered with Ethereum Address = " + address);
                let url = randomURL + "/" + address;
                res.render('success.pug', {url : url});
            });
        }
    }else{
        res.sendStatus(404);
    }
});

app.get('/msg', (req,res) => {
     var address = req.param('address');
     var msg = req.param('msg');
     mongo.getIdFromAddress(address, function (id) {
        if(id){
            telegram.sendMessage(id, msg, function () {
                mongo.storeMessageinDb(address, msg, function () {
                    res.sendStatus(200);
                })
            })
        }else{
            res.sendStatus(404);
        }
     });
});

app.get('/:address',function(req,res){
    var address = req.params.address;
    mongo.checkAddressInDb(address, function (bool) {
        if(bool){
            res.render('donate.pug', { address: address });
        }else{
            res.sendStatus(404);
        }
    });

});

app.get('/auth/:MetaMessage/:MetaSignature', metaAuth, (req, res) => {
    if (req.metaAuth && req.metaAuth.recovered) {
        // Signature matches the cache address/challenge
        // Authentication is valid, assign JWT, etc.
        console.log(req.metaAuth.recovered);//store this in db

        res.send({
            auth : req.metaAuth.recovered
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
        if(telegram.checkForFirstMessage(req.body.message)){
            let id = req.body.message.from.id;
            let name = req.body.message.from.first_name;
            console.log("Sending First Message");
            let otp = generateOTP();
            let message = "Hi! " + name + ". Use " + otp + " as the OTP to register on the website";
            telegram.sendMessage(id, message, function () {
                otpArray.push({
                    otp : otp,
                    name : name,
                    id : id,
                    verified : false
                });
                console.log("Sent");
                res.sendStatus(200);
            })
        }else{
            console.log("Good Old Message", req.body.message);
            let id = req.body.message.from.id;
            let msg = req.body.message.text;
            mongo.storeMessageinDb(id, msg, function () {
                res.sendStatus(200);
            })
        }
    }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    mongo.connect(function () {
        current_time = new Date().getTime();
        console.log('Listening on port = ', PORT);
    });
});