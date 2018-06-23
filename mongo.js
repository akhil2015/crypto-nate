const mongodb = require('mongodb').MongoClient;
const db_url = 'mongodb://arvind:arvind123@ds163650.mlab.com:63650/crypto-nate';
const dbName = 'crypto-nate';
const assert = require('assert');

module.exports = {
    connect : function (callback) {
        let self = this;
        mongodb.connect(db_url, function (err, database) {
            if(err) throw err;
            self.obj = database.db(dbName);
            if(callback) callback();
        });
    },

    registerWithNameAndAddress : function (name, address, id, callback) {
        let self = this;
        self.obj.collection('user_data').findOneAndUpdate({
            address : address
        }, {
            address : address,
            first_name : name,
            id : id
        }, function (err, result) {
            if(err) throw err;
            if(result.value !== null){
                console.log("Updated to Database");
                if(callback) callback();
            }else{
                self.obj.collection('user_data').insertOne({
                    address : address,
                    first_name : name,
                    id : id
                }, function (err1) {
                    if(err1) throw err1;
                    console.log("Added to Database");
                    if(callback) callback();
                });
            }
        });
    },

    storeMessageinDb : function (address,from, msg, callback) {
        let self = this;
        self.obj.collection('messages').insertOne({address:address,from:from,message:msg}, function(err, r) {
            assert.equal(null, err);
            assert.equal(1, r.insertedCount);
            if(callback) callback();
        });
    },

    checkAddressInDb : function (address, callback) {
        let self = this;
        self.obj.collection('user_data').findOne({
            address : address
        }, function (err, result) {
            if(err) throw err;
            if(result){
                if(callback) callback(true);
            }else{
                if(callback) callback(false);
            }
        })
    },

    getIdFromAddress : function (address, callback) {
        let self = this;
        self.obj.collection('user_data').findOne({
            address : address
        }, function (err, result) {
            if(err) throw err;
            if(result){
                if(callback) callback(result.id);
            }else{
                if(callback) callback(false);
            }
        })
    }
};