const axios = require('axios');

module.exports = {

    token_id : '584810302:AAE0gKoCb4lcGqsndDbAem1dBUR_E_syRy8',

    sendMessage : function sendMessage(id, message, callback) {
    let url = 'https://api.telegram.org/bot' + this.token_id + '/sendMessage';
    axios.get(url, {
        params : {
            chat_id : id,
            text : message,
            reply_markup : {
                keyboard : [
                    ["/start", "/help"],
                ],
                one_time_keyboard :false,
                resize_keyboard : true
            }
        }
    }).then(function (response) {
        if(callback) callback(true);
    }).catch(function (error) {
        throw error
    });
},

    checkForFirstMessage : function checkForFirstMessage(msjObj){
        return msjObj.text === "/start";
    },

    checkForHelpMessage : function (msjObj) {
        return msjObj.text === '/help';
    }



};