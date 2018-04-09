// used for testing
let chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const should = require('should');
const assert = chai.assert;
const expect = chai.expect;

// used for connecting client socket
const net = require('net');

// used as fake api for mpa   
const express = require('express');
var bodyParser = require('body-parser');
const mobile_app = express();
mobile_app.use(bodyParser.json());
mobile_app.use(bodyParser.urlencoded({ extended: true })); 

mobile_app.get("/", (req, res ) => {
	res.send({status:"running"});
});

mobile_server = mobile_app.listen(4321);

const app = require('../index').server_api;
const request = require("supertest");

var baseUrl = "localhost:8999";

let server;
var agent;

describe('testinging multi socket communication', function(){

    beforeEach((done) => {
        server = app.listen(8999);
        agent = chai.request('http://'+baseUrl);
        agent_mobile = chai.request('http://'+ "localhost:4321");
        done();
    });


    it('verify test api routes are up and running', function(done) { 
            agent_mobile.get("/")
                .set('content-type', 'application/json')
                .end(function (err, res) {
                    expect(res.status).to.equal(200);
                    var response = JSON.parse(res.text);
                    expect(response.status).to.equal("running");
                    done();
                });
    });
    
    
    it('verify socket api routes are up and running', function(done) { 
        agent.get('/')
            .end(function(err, res) { 
                expect(res.status).to.equal(200);
                var response = JSON.parse(res.text); 
                expect(res.body.status).to.equal("socket server running");
                done();
            })
    });

    it('should be able to connect one store with one pos', (done) => { 

        var client = new net.Socket();

        client.connect(3000, '127.0.0.1', function() {
            client.write('{"store_id": 1, "msg": "heartbeat"}');
        });

        client.on('error', (err) => {
            expect(true).to.equal(false);
            done();
        });

        client.on('data', function(data) { 
            data = JSON.parse(data.toString('utf8'));
            expect(data.store_id).to.equal(1);
            expect(data.status).to.equal("connected");
            client.destroy();
            done();
        });
    });

    it('should be able to send message one message to connection', (done) => { 

        var client = new net.Socket();

        client.connect(3000, '127.0.0.1', function() {
            client.write('{"store_id": 1, "msg": "heartbeat"}');
        });

        client.on('error', (err) => {
            expect(true).to.equal(false);
            done();
        });

        client.on('data', function(data) {
            
            data = JSON.parse(data.toString('utf8'))
            if (data.message == "connected to store_id: 1") { 
                expect(data.status).to.equal("connected");
                client.write('{"store_id": 1, "msg": "whats up"}');
            } else {
                expect(data.message).to.equal("I got your msg: whats up");
                client.destroy();
                done();
            }
        });
    });

   it('send message multiple message to connection and view convo via api call', (done) => { 

        var client = new net.Socket();

        client.connect(3000, '127.0.0.1', function() {
            client.write('{"store_id": 1, "msg": "heartbeat"}');
        });

        client.on('error', (err) => {
            expect(true).to.equal(false);
            done();
        });

        client.on('data', function(data) {
            
            data = JSON.parse(data.toString('utf8'))
            if (data.message == "connected to store_id: 1") { 
                expect(data.status).to.equal("connected");
                client.write('{"store_id": 1, "msg": "whats up"}');
            } else if (data.message == "I got your msg: whats up") {
                client.write('{"store_id": 1, "msg": "you didnt really asnswer me"}'); 
            } else {
                expect(data.message).to.equal("I got your msg: you didnt really asnswer me");
                
                agent.post('/history')                    
 					.set('content-type', 'application/json')
                	.send({
                    	store_id: 1, 
                	})
                    .end(function(err, res) {
                        var response = JSON.parse(res.text);
                        expect(res.body).to.eql({"0":"heartbeat","1":"heartbeat","2":"whats up","3":"whats up","4":"you didnt really asnswer me","5":"you didnt really asnswer me"});
                    	client.destroy();
                    	done();
                })
            }
        });
    });

	
	it('should be able to send message via api and still see history ', (done) => { 

        var client = new net.Socket();

        client.connect(3000, '127.0.0.1', function() {
            client.write('{"store_id": 1, "msg": "heartbeat"}');
        });

        client.on('error', (err) => {
            expect(true).to.equal(false);
            done();
        });

        client.on('data', function(data) {
            
            data = JSON.parse(data.toString('utf8'))
            if (data.message == "connected to store_id: 1") { 
                expect(data.status).to.equal("connected");
                client.write('{"store_id": 1, "msg": "whats up"}');
			} else if ( data.message == "I got your msg: whats up") {
				
				agent.post('/send')
					.set('content-type', 'application/json')
                	.send({
                    	store_id: 1,
						msg: "random message" 
                	})
					.end(function(err, res) {
						var res = JSON.parse(res.text);
						expect(res.status).to.equal("sent message: random message");
					});	

			} else if  (data.message == "random message") {
			  	expect(data.store_id).to.equal(1);
			
				agent.post('/history')                    
 					.set('content-type', 'application/json')
                	.send({
                    	store_id: 1, 
                	})
                    .end(function(err, res) {
                        var response = JSON.parse(res.text);
							
					    expect(response).to.be.eql({"0":"heartbeat","1":"heartbeat","2":"whats up","3":"whats up","4":"random message"}) 
						client.destroy();
                    	done();
                })

			} else {
				expect(true).to.equal(false);
			}	
		
        });
    });

	
 	it('should be able to handle multiople connections', (done) => { 

        var client = new net.Socket();

        client.connect(3000, '127.0.0.1', function() {
            client.write('{"store_id": 1, "msg": "heartbeat"}');
        });

        client.on('error', (err) => {
            expect(true).to.equal(false);
            done();
        });

        client.on('data', function(data) {
            
            var data = JSON.parse(data.toString('utf8'))
            if (data.message == "connected to store_id: 1") { 
                expect(data.status).to.equal("connected");
                client.write('{"store_id": 1, "msg": "never"}');
            } else if (data.message == "I got your msg: never"){
               	
				 var client2 = new net.Socket();

        		client2.connect(3000, '127.0.0.1', function() {
					client2.write('{"store_id": 2, "msg": "heartbeat"}');
        		});

        		client2.on('error', (err) => {
           	 		expect(true).to.equal(false);
            		done();
        		});

        		client2.on('data', function(inside_data) {
            		var inside_data = JSON.parse(inside_data.toString('utf8'))
            		if (inside_data.message == "connected to store_id: 2") { 
                		expect(inside_data.status).to.equal("connected");
                		client2.write('{"store_id": 2, "msg": "whats up"}');
            		} else {
                		expect(inside_data.message).to.equal("I got your msg: whats up");
						agent.post('/history')                    
 							.set('content-type', 'application/json')
                			.send({
                    			store_id: 2, 
                			})
                    		.end(function(err, res) {
                        		var response = JSON.parse(res.text);
					    		expect(response).to.be.eql({"0":"heartbeat","1":"heartbeat","2":"whats up","3":"whats up"}) 
								client2.destroy();
								client.write('{"store_id": 1, "msg": "last msg sent"}'); 
							})
					 }
				});
			} else  if (data.message == "I got your msg: last msg sent"){
				
				agent.post('/history')                    
 					.set('content-type', 'application/json')
                	.send({
                    	store_id: 1, 
                	})
                    .end(function(err, res) {
                        var response = JSON.parse(res.text);
					    expect(response).to.be.eql({"0":"heartbeat","1":"heartbeat","2":"never","3":"never", "4": "last msg sent", "5": "last msg sent"}) 
					
						agent.post('/send')
							.set('content-type', 'application/json')
                			.send({
                    			store_id: 1,
								msg: "random message" 
                			})
							.end(function(err, res) {
								var res = JSON.parse(res.text);
								expect(res.status).to.equal("sent message: random message");
						})
					});
			} else {
				expect(data.message).to.equal("random message");
				client.destroy();
				done();
			}
        });
    });

     after(done => {
        server.close(done);
    }); 

});
