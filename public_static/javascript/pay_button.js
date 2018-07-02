if (typeof  web3 === "undefined") {
    alert("Metamask Not Found. \nInstall Metamask Extension From https://metamask.io/");
}
var MY_ADDRESS = document.getElementById('address').innerHTML;
// alert(MY_ADDRESS) //update this to influencer's address
var tipButton = document.querySelector('.tip-button');
tipButton.addEventListener('click', function() {
    if (typeof  web3 === "undefined") {
        alert("Metamask Not Found. \nInstall Metamask Extension From https://metamask.io/");
        return;
    }
    if(web3.eth.accounts.length === 0){
        alert("Metamask Not Logged In. \nPlease Log In to your Metamask Account");
        return;
    }
  var user_address = web3.eth.accounts[0];
  var amount = document.getElementById('amount').value;
  web3.eth.sendTransaction({
    to: MY_ADDRESS,
    from: user_address,
    value: web3.toWei(amount, 'ether'),
  }, function (err, transactionHash) {
    if (err) return renderMessage('There was a problem!: ' + err.message);
    // If you get a transactionHash, you can assume it was sent,
    // or if you want to guarantee it was received, you can poll
    // for that transaction to be mined first.
    renderMessage('Thanks for the generosity!! We will forward your message');
    var msg = document.getElementById('comment').value;
    var from = document.getElementById('donor').value;
    if(from.length === 0){
        from = "Anonymous";
    }
    if(msg.length === 0){
        msg = "Sorry! No Message was Sent!!"
    }
    web3.version.getNetwork(function (err, Id) {
        if(err) throw err;
        // Creating Post Request for sending message
        $.post('/msg', {
            addr : MY_ADDRESS,
            fr : from,
            messa : msg,
            ether : amount,
            hash : transactionHash,
            network : Id
        }, function (response, status) {
            if(status === 'success'){
                alert("Your Message Would be Sent Once the Transaction is Mined");
                window.location.href = '/';
            }else{
                alert("An Error Occured Could Not Send the Message");
            }
        });

        // url =('/msg?address='+MY_ADDRESS+'&from='+from+'&msg='+msg);
        // window.location.href = url;
    });

  });
});
function renderMessage (message) {
  var messageEl = document.querySelector('.message')
  messageEl.innerHTML = message
}
