const { Client, MessageMedia } = require('whatsapp-web.js')
const qrcode = require('qrcode');;
const client = new Client();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const socketIO = require("socket.io");
var io = socketIO(server, {
    cors: {
        origin: "http://localhost",
        methods: ["GET", "POST"]
    }
})
const cors = require('cors');

// Allow all origins
app.use(cors());

const port = 3000;

//Socket IO
let i = 0;
let qrCodeSent = false; // Flag to track whether QR code has been sent
let qrReady = false


io.on('connection', (socket) => {
    if (!qrCodeSent && !qrReady) {
        console.log('Sending QR code...');
        socket.emit('message', 'Generating QR Code');

        // Define QR event listener
        const qrListener = (qr) => {
            console.log('QR RECEIVED', qr);
            qrcode.toDataURL(qr, (err, url) => {
                socket.emit('qr', url);
                socket.emit('message', 'generated');
            });
        };

        client.on('qr', qrListener);

        // Define ready event listener
        const readyListener = () => {
            qrReady = true;
            //console.log('Client is ready!');
            socket.emit('qr', '');
            socket.emit('message', 'WhatsApp is ready !');
        };

        client.on('ready', readyListener);

        qrCodeSent = true; // Update the flag to indicate that QR code has been sent

        // Remove event listeners when user disconnects
        socket.on('disconnect', () => {
            // console.log('user disconnected');
            client.removeListener('qr', qrListener);
            client.removeListener('ready', readyListener);
            qrCodeSent = false; // Reset the flag
        });
    } else if (qrReady) {
        //console.log('Client is ready!');
        socket.emit('message', 'WhatsApp is ready !');
        socket.emit('qr', '');
    }

    client.on('message', async msg => {
        if (msg.body === '!ping') {
            client.sendMessage(msg.from, 'pong');
            console.log(msg.from);
        }
        if (msg.body === '!media') {
            const media = await MessageMedia.fromUrl('https://via.placeholder.com/350x150.png');
            await client.sendMessage(msg.from, media);
        }
    });
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/testapi', (req, res) => {
    if (qrReady == 1) {
        res.json({ api_ready: true });
    } else {
        res.json({ api_ready: false });
    }

});

app.get('/jquery', (req, res) => {
    res.sendFile(__dirname + '/public/jquery.min.js');
});

app.get('/sendMessage', (req, res) => {
    var phone = req.query.phone;
    var msg = req.query.msg;
    var msg_id = String(phone) + '@c.us';

    console.log(/^\d+$/.test(phone));
    if (qrReady == 1 && /^\d+$/.test(phone)) {
        try {
            console.log("Message '", msg, "' send to ", msg_id);
            client.sendMessage(String(phone) + '@c.us', String(msg));
            //client.sendMessage('60195969014@c.us', 'test');
            res.json({ api_ready: qrReady, phone: msg_id, msg: msg });
        } catch (error) {
            console.log("err");
            res.json({ api_status: 'error' });
        }
    } else {
        res.json({ api_ready: qrReady, phone: msg_id, msg: msg });
    }
});

app.get('/sendMedia', async (req, res) => {
    var phone = req.query.phone;
    var url = req.query.url;
    try {
        msg_id = String(phone) + '@c.us';
        console.log(msg_id);
        const media = await MessageMedia.fromUrl(url);
        await client.sendMessage(msg_id, media);
        res.send("media sent");

    } catch (error) {
        console.log("err");
        res.send("error");
    }
});

client.initialize();

//Listen to server port
server.listen(port, () => {
    console.log("listening port " + port + "\nurl: http://localhost:" + port);
});