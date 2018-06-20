const axios = require('axios');

module.exports = {

    token_id : '595973903:AAGNXvJ9k8dxgGz3KGT9sUs5jymAOSRz0LQ',

    sendMessage : function sendMessage(id, message, callback) {
    let url = 'https://api.telegram.org/bot' + this.token_id + '/sendMessage';
    axios.get(url, {
        params : {
            chat_id : id,
            text : message
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



};