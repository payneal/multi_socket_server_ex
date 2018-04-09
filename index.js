// used to create uuid (Universal Unique Identifier)
const uuidv4 = require('uuid/v4');
// used to Parse incoming request bodies in a middleware
const bodyParser = require('body-parser');
// used to build graphql server

// used for communicating mppa => <= site-system
var socket_talk = require('./src/socket-communication');

//used for tcp socket
const net = require('net');
var clients = {};
var store_connections = {};

const express = require('express'),
    app =  express(),
    port = process.env.Port || 8999

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

var server_api = app.listen(port, () => {
    console.log("MPPA server started on port "+ port + ":");
});

// Rest
app.get("/", function(req, res) {
    res.json({status: "socket server running"});
});

app.post("/send", function(req, res) {
    var store_id  = req.body.store_id;
    var msg = req.body.msg;
    var port_id = store_connections[store_id] 
    var umm = clients[port_id]
    umm.send(msg);
    res.json({status: "sent message: " + msg});
});

app.post("/history", function(req, res) {
    var store_id  = req.body.store_id;
    var port_id = store_connections[store_id] 
    var umm = clients[port_id]
    var history = umm.get_history();
    res.json(history);
});


app.post("/store_and_port", function(req, res) {
    var store_id  = req.body.store_id;
    var port_id = req.body.port;
    store_connections[store_id] = port_id;
    res.json({status: "added"})
})


// tcp socket connection
var server = net.createServer(function(socket) {
    var hold_socket = new socket_talk(socket);
    clients[socket.remotePort] = hold_socket;
});

server.listen(3000, function () {
  console.log('TCP socket listening on 3000!');
});

module.exports = {
    server_api: server_api,
    server: server
}
