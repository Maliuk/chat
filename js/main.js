var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

var pc; // PeerConnection


// Step 1. getUserMedia
/*navigator.getUserMedia(
    {audio: false, video: true},
    gotStream,
    function (error) {
        console.log(error)
    }
);*/

navigator.mediaDevices
    .getUserMedia({
        audio: true,
        video: true
    })
    .then(gotStream)
    .catch(e => alert(`getUserMedia() error: ${e.name}`));

function gotStream(stream) {
    document.getElementById("callButton").style.display = 'inline-block';
    //document.getElementById("localVideo").src = URL.createObjectURL(stream);
    const localVid = document.getElementById("localVideo");
    localVid.muted = true;
    localVid.srcObject = stream;

    const configuration = {
        iceServers: [
            { url: 'stun:stun1.l.google.com:19302' },
            {
                url: 'turn:numb.viagenie.ca',
                credential: 'muazkh',
                username: 'webrtc@live.com'
            }]
    }

    pc = new PeerConnection(configuration);
    pc.addStream(stream);
    pc.onicecandidate = gotIceCandidate;
    pc.onaddstream = gotRemoteStream;
}


// Step 2. createOffer
function createOffer() {
    pc.createOffer(
        gotLocalDescription,
        function (error) {
            console.log(error)
        },
        {'mandatory': {'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true}}
    );
}


// Step 3. createAnswer
function createAnswer() {
    pc.createAnswer(
        gotLocalDescription,
        function (error) {
            console.log(error)
        },
        {'mandatory': {'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true}}
    );
}


function gotLocalDescription(description) {
    pc.setLocalDescription(description);
    sendMessage(description);
	
	console.log("Local description: ");
	console.log(description);
}

function gotIceCandidate(event) {
    if (event.candidate) {
        sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        });
    }
}

function gotRemoteStream(event) {
    document.getElementById("remoteVideo").srcObject = event.stream;
}


////////////////////////////////////////////////
// Socket.io

var socket = io.connect('', {port: 1234});

function sendMessage(message) {
    socket.emit('message', message);
}

socket.on('message', function (message) {
    if (message.type === 'offer') {
        pc.setRemoteDescription(new SessionDescription(message));
        createAnswer();
    }
    else if (message.type === 'answer') {
        pc.setRemoteDescription(new SessionDescription(message));
    }
    else if (message.type === 'candidate') {
        var candidate = new IceCandidate({sdpMLineIndex: message.label, candidate: message.candidate});
        pc.addIceCandidate(candidate);
    }
	
	console.log("Remote description: ");
	console.log(message);
});

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

            try {
                socket.emit('chat message', message);

                $chat.append('<li class="text-right"><span><span class="name">Me: </span>' + message + '<span></li>');
                showMessage();
                $('#message').val('');
                audio.send_message.volume = 0.3;
                audio.send_message.play();

                /*if (flag) {
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
                 }*/

                var h = $chat[0].scrollHeight;
                $chat.scrollTop(h);
            } catch (err) {
                console.log(err);
            }

        }
        return false;
    });

    socket.on('chat message', function (msg) {
        setTimeout(function () {
            console.log(msg);
            $chat.append('<li><span><span class="name">Opponent: </span>' + msg + '<span></li>');
            showMessage();
            audio.recieve_message.volume = 0.3;
            audio.recieve_message.play();

            var h = $chat[0].scrollHeight;
            $chat.scrollTop(h);
        }, 50);
    });

    var showMessage = function () {
        setTimeout(function () {
            $('li', $chat).addClass('vis');
        }, 100);
    };

});