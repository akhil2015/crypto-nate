const express = require('express');
const MetaAuth = require('meta-auth');
const randomURL = 'https://msgcrypto.herokuapp.com';
const path = require('path');

const mongo = require('./mongo.js');
const telegram = require('./telegram.js');

const app = express();
const metaAuth = new MetaAuth();

const bodyParser = require("body-parser");
const Web3 = require('web3');

let otpArray = [];
// let id_who_have_otp_requested = [];
let current_time = 0;

app.use(bodyParser.json()); // for parsing application/json
app.use(
    bodyParser.urlencoded({
        extended: true
    })
); // for parsing application/x-www-form-urlencoded

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'public_static/views'));

app.use('/', express.static('public_static'));

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
                let url = randomURL + "/" + address;
                telegram.sendMessage(id, "Congrats! Registered with Ethereum Address = " +
                    address + "\nYou may give this url \n" + url + "\n to your followers" +
                    " to get Cryptos and a Message of Love.");
                res.render('success.pug', {url : url});
            });
        }
    }else{
        res.send(false);
    }
});

app.post('/msg', (req,res) => {
    var address = req.body.addr; // This is the key which points to receivers address
    var msg = req.body.messa; // This is the key which points to the message to be sent
    var from = req.body.fr;// This is the key which points to the Name of the sender
    var ether = req.body.ether;
    let hash = req.body.hash;
    let network = req.body.network;
    let sent = false;
    res.sendStatus(200);
    checkWeatherMined(hash, network, function () {
        if(!sent){
            sent = true;
            mongo.getIdFromAddress(address, function (id) {
                if(id){
                    telegram.sendMessage(id, "From : " + from + "\nMessage : " + msg + "\nEthers Received : " + ether, function () {
                        mongo.storeMessageinDb(address,from, msg)
                    })
                }
            });
        }

    });
});

function checkWeatherMined(hash, network, callack){
    function getNetworkLink(network) {
        let link = null;
        switch (network) {
            case "1":
                link = 'https://mainnet.infura.io/';
                break;
            case "2":
                link = 'https://morden.infura.io/';
                break;
            case "3":
                link = 'https://ropsten.infura.io/';
                break;
            case "4":
                link = 'https://rinkeby.infura.io/';
                break;
            case "42":
                link = 'https://kovan.infura.io/';
                break;
            default:
                link = null;
        }
        return link;
    }
    let link = getNetworkLink(network);
    let web3 = new Web3(new Web3.providers.HttpProvider(link));
    let x = setInterval(function () {
        web3.eth.getTransactionReceipt(hash, function (err, fresult) {
            if(fresult){
                console.log(fresult);
                onceDone();
            }
        });
    }, 3000);

    function onceDone() {
        clearInterval(x);
        if (callack) callack();
    }
}

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

// app.get('/auth/:MetaMessage/:MetaSignature', metaAuth, (req, res) => {
//     if (req.metaAuth && req.metaAuth.recovered) {
//         // Signature matches the cache address/challenge
//         // Authentication is valid, assign JWT, etc.
//         console.log(req.metaAuth.recovered);//store this in db
//
//         res.send({
//             auth : req.metaAuth.recovered
//         });
//     } else {
//         // Sig did not match, invalid authentication
//         res.status(400).send();
//     }
// });

app.post('/checkotp', (req, res) => {
    let otp = req.body.otp;
    let idx = otpArray.findIndex(function (ele) {
        return ele.otp == otp;
    });
    if(idx >= 0){
        res.send(true);
    }else{
        res.send(false);
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
        }else if(telegram.checkForHelpMessage(req.body.message)){
            let helpMessage = "/help Message is Yet to Be Decided";
            telegram.sendMessage(id, helpMessage);
        } else{
            console.log("Good Old Message", req.body.message);
            let id = req.body.message.from.id;
            let msg = req.body.message.text;
            mongo.storeMessageinDb(id, msg, function () {
                res.sendStatus(200);
            })
        }
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    mongo.connect(function () {
        console.log('Listening on port = ', PORT);
    });
});