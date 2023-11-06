const { Client } = require('whatsapp-web.js')
const qrcode = require('qrcode');;
const client = new Client();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 3000;

//Socket IO
io.on('connection', (socket) => {
    socket.emit('message', 'Generating Qr Code');
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr);
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url);
            //console.log(url)
            socket.emit('message', 'Qr Generated... ready to scan');
        })
    });

    client.on('ready', () => {
        console.log('Client is ready!');
        socket.emit('message', 'WhatsApp is ready !');
        socket.emit('qr', '');
    });

    client.on('message', message => {
        if (message.body === '!ping') {
            client.sendMessage(message.from, 'pong');
            console.log(message.from);
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/jquery', (req, res) => {
    res.sendFile(__dirname + '/public/jquery.min.js');
});

app.get('/sendMessage', (req, res) => {
    var phone = req.query.phone;
    var msg = req.query.msg;
    try {
        msg_id = String(phone) + '@c.us';
        console.log(msg_id);
        client.sendMessage(String(phone) + '@c.us', String(msg));
        //client.sendMessage('60195969014@c.us', 'test');
        res.send("msg sent");

    } catch (error) {
        console.log("err");
    }

});

client.initialize();

//Listen to server port
server.listen(port, () => {
    console.log("listening port " + port + "\nurl: http://localhost:" + port);
});