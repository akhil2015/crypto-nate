const mongodb = require('mongodb').MongoClient;
const db_url = 'mongodb://localhost:27017';
const dbName = 'crypto_users';
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

    registerWithNameAndEmail : function (name, email, callback) {
        let self = this;
        let condn= {_id:-1};
        let element;
        self.obj.collection('user_data').find().sort(condn).toArray(function(err, result) {
            if (err) throw err;
            //console.log(result[0]);
            //update record where result[0]
            element = result[0];
            self.obj.collection('user_data').updateOne(element, {$set: {name: name,email:email}}, function (err) {
                assert.equal(null, err);
                if(callback) callback();
            });
        });
    },

    storeMessageinDb : function (address, msg, callback) {
        let self = this;
        self.obj.collection('messages').insertOne({address:address,message:msg}, function(err, r) {
            assert.equal(null, err);
            assert.equal(1, r.insertedCount);
            if(callback) callback();
        });
    },

    storeAddressandOTPinDB : function (val,otp, callback) {
        let self = this;
        self.obj.collection('user_data').insertOne({address:val,otp:otp}, function(err, r) {
            assert.equal(null, err);
            assert.equal(1, r.insertedCount);
            if(callback) callback();
        });
    }
};