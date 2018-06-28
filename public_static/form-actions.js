let challenge = null;
let signature = null;
//jQuery time
var current_fs, next_fs; //fieldsets
var left, opacity, scale; //fieldset properties which we will animate
var animating; //flag to prevent quick multi-click glitches

// Check If Clicked For Getting Metamask ID
$('#get').on('click', function () {
    $('.challenge').empty();

    if(web3.eth.accounts.length !== 0){
        $.get('/auth/' + web3.eth.accounts[0], (res) => {
            challenge = res;

            console.log(res);

            res.forEach(line => {
                $('.challenge').append(line.name);
                $('.challenge').append('<br>');
                $('.challenge').append(line.value);
                $('.challenge').append('<br>');
                $('.challenge').append('Initiated Sign Up process.');
            });


            const from = web3.eth.accounts[0];

            const params = [challenge, from];
            const method = 'eth_signTypedData';

            web3.currentProvider.sendAsync({
                method,
                params,
                from
            }, async (err, result) => {
                signature = result.result;
                if (err) {
                    return console.error(err);
                }
                if (result.error) {
                    return console.error(result.error);
                }
                $('.signature').text(signature);

                // Animate Here
                animating = true;

                current_fs = $(this).parent();
                next_fs = $(this).parent().next();

                //activate next step on progressbar using the index of next_fs
                $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");

                //show the next fieldset
                next_fs.show();
                //hide the current field set with style
                current_fs.animate({opacity: 0}, {
                    step: function(now, mx) {
                        //as the opacity of current_fs reduces to 0 - stored in "now"
                        //1. scale current_fs down to 80%
                        scale = 1 - (1 - now) * 0.2;
                        //2. bring next_fs from the right(50%)
                        left = (now * 50)+"%";
                        //3. increase opacity of next_fs to 1 as it moves in
                        opacity = 1 - now;
                        current_fs.css({
                            'transform': 'scale('+scale+')',
                            'position': 'absolute'
                        });
                        next_fs.css({'left': left, 'opacity': opacity});
                    },
                    duration: 1000,
                    complete: function(){
                        current_fs.hide();
                        animating = false;
                    },
                    //this comes from the custom easing plugin
                    easing: 'easeInOutBack'
                });
            });
        });
    }else {
        alert("Metamask Not Logged In");
    }
});

$('#next').on('click', function() {
    $.get('/auth/' + challenge[1].value + '/' + signature, (res) => {
        if (res.auth === web3.eth.accounts[0]) {
            $('#address').val(res.auth);

            animating = true;

            current_fs = $(this).parent();
            next_fs = $(this).parent().next();

            //activate next step on progressbar using the index of next_fs
            $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");

            //show the next fieldset
            next_fs.show();
            //hide the current field set with style
            current_fs.animate({opacity: 0}, {
                step: function(now, mx) {
                    //as the opacity of current_fs reduces to 0 - stored in "now"
                    //1. scale current_fs down to 80%
                    scale = 1 - (1 - now) * 0.2;
                    //2. bring next_fs from the right(50%)
                    left = (now * 50)+"%";
                    //3. increase opacity of next_fs to 1 as it moves in
                    opacity = 1 - now;
                    current_fs.css({
                        'transform': 'scale('+scale+')',
                        'position': 'absolute'
                    });
                    next_fs.css({'left': left, 'opacity': opacity});
                },
                duration: 1000,
                complete: function(){
                    current_fs.hide();
                    animating = false;
                },
                //this comes from the custom easing plugin
                easing: 'easeInOutBack'
            });
        } else {
            $('.fail').show();
        }
    });
});


$(".submit").click(function() {
    let otp = $('#otp').val();
    let address = $('#address').val();
    console.log("Enter Button");
    if (otp.length !== 6) {
        alert("Please Enter a valid OTP");
        return;
    }else{
        $.post('/checkotp', {
            otp : otp
        }, function (data) {
            if(data){
                console.log("requesting");
                let $form=$(document.createElement('form')).css({display:'none'}).attr("method","POST").attr("action","/register");
                let $input1=$(document.createElement('input')).attr('name','address').val(address);
                let $input2=$(document.createElement('input')).attr('name','otp').val(otp);
                $form.append($input1);
                $form.append($input2);
                $("body").append($form);
                $form.submit();
            }else{
                alert("OTP Incorrect!! Please Enter a valid OTP");
            }
        });
    }
});