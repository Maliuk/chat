navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
navigator.getUserMedia({audio: false, video: true}, gotStream, streamError);

function gotStream(stream) {
    document.getElementById('mine').src = URL.createObjectURL(stream);
}

function streamError(error) {
    console.log(error);
}


jQuery(document).ready(function ($) {
    audio = {
        send_message: new Audio('audio/send-message.mp3'),
        recieve_message: new Audio('audio/recieve-message.mp3')
    };
    var $chat = $('#chat');
    var flag = true;
    var bm = 0;
    var botMessages = ['Hello! :)', 'Fuck you!!!', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.'];
    $('#message-form').on("submit", function () {

        var message = $('#message').val();

        if (message && message != '') {
            $chat.append('<li class="text-right"><span><span class="name">Me: </span>' + message + '<span></li>');
            showMessage();
            $('#message').val('');
            audio.send_message.volume = 0.3;
            audio.send_message.play();

            if (flag) {
                flag = false;
                setTimeout(function () {
                    $chat.append('<li><span><span class="name">Bot: </span>' + botMessages[bm] + '<span></li>');
                    showMessage();
                    audio.recieve_message.volume = 0.3;
                    audio.recieve_message.play();
                    flag = true;
                    bm++;

                    if (bm >= botMessages.length)
                        bm = 0;

                    var h = $chat[0].scrollHeight;
                    $chat.scrollTop(h);
                }, 1000);
            }

            var h = $chat[0].scrollHeight;
            $chat.scrollTop(h);
        }
        return false;
    });

    var showMessage = function () {
        setTimeout(function () {
            $('li', $chat).addClass('vis');
        }, 100);
    };

});