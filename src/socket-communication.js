// socket communication
const request = require("request");

function socket_play(socket) {

    var self = this;
    this.socket = socket;
    this.history = {};
    this.history_count = 0;
    this.port = socket.remotePort
    this.store_id;

    this.socket.on('data', function(data) {
        data = data.toString("utf8");
        var msg = JSON.parse(data);
       
        var store_id = msg['store_id'];
        var pos_id = msg['pos_id'];
        var message = msg['msg']
        self.id = store_id;

        self.history[self.history_count] = message;
        self.history_count += 1

        if (message == "heartbeat") {
            self.store_id = store_id
            var response = {
                "store_id": store_id,
                "status": "connected",
                "port": self.port,
                "message": "connected to store_id: " + self.store_id
            }

            request.post("http://localhost:8999/store_and_port", 
                { 
                    "form": response 
                }, function(e, r, body) {
                    response = JSON.stringify(response);
                    socket.write(response);
                    self.history[self.history_count] = message;
                    self.history_count += 1
                }
            )

        }  else {
            self.history[self.history_count] = message
            var response = {
                "store_id": store_id,
                "status": "connected",
                "port": self.port,
                "message": "I got your msg: " + message
            }            
            response = JSON.stringify(response); 
            socket.write(response);
            self.history[self.history_count] = message;
            self.history_count += 1 
        }
    });

    this.socket.on('close', function(e) {
    });

    this.socket.on('error', function(e) {
    });

    this.get_history = function() {
        return self.history
    }

    this.send = function(msg) {

        var response = {
            "store_id": self.store_id,
            "port": self.ip,
            "message": msg
        }
        response = JSON.stringify(response); 
        self.socket.write( response);
        self.history[self.history_count] = msg;
        self.history_count += 1 
    }
}
module.exports = socket_play; 

