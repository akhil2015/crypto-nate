const axios = require('axios');

module.exports = {

    token_id : '561087037:AAGTUauJFOCSDj8zninHVdI4S8yJ52qtHeE',

    sendMessage : function sendMessage(id, message, callback) {
    let url = 'https://api.telegram.org/bot' + this.token_id + '/sendMessage';
    axios.get(url, {
        params : {
            chat_id : id,
            text : message
        }
    }).then(function (response) {
        callback(true);
    }).catch(function (error) {
        throw error
    });
},

    checkForFirstMessage : function checkForFirstMessage(msjObj){
        return msjObj.text === "/start";
    },



};