var path = require('path');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var bcrypt = require('bcryptjs');
var toobusy = require('toobusy-js');

var values = [];
var props = [];
var valid = false;

fs.readFile('../public/properities.txt', 'utf8', function (err, data) {
	if (err) {
		return console.log(err);
	}
	values = data.split("\n");
	var port = values[1];
	http.listen(port, function(){
		console.log('listening on *:' + port);
	});

});

app.use(function(req, res, next) {
	if (toobusy()) {
		res.send(503, "Sorry, either we're too popular or someone is DDoS:ing (Server is overloaded)");
	} else {
		next();
	}
});

app.configure(function () {
    app.use(express.cookieParser());
    app.use(express.session({secret: 'CHANGE_THIS', key: 'express.sid'}));
});

io.use(function (socket, next) {
	var handshakeData = socket.request;
	if(handshakeData.headers.cookie) {
		handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
		handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['express.sid'], 'CHANGE_THIS');
		
		if (handshakeData.cookie['express.sid'] == handshakeData.sessionID) {
			return next(new Error("Cookie is invalid."));
		}
	} else {
		return next(new Error("No cookie transmitted"));
	} 
	next();
});

// REMOVE THIS WHEN PUTTING THE CODE ONLINE                            |
app.get('/', function(req, res) { //                                   |
    res.sendFile(path.join(__dirname + '/test-client-login.html')); // |
}); //                                                                 v

function printError(reason, id) {
	io.emit('login-complete', {"success": false, "reason": reason, "id": id});
}

io.on('connection', function(socket){
	socket.on('login', function(data){
		if(typeof data.email != 'string' || typeof data.pass != 'string') {
			return printError("Invalid email and/or password.", 0);
		}
		
		if(((data.email).indexOf("@") != -1) && ((data.email).indexOf(".") != -1)) {
			fs.readdir("users", function(err, li) {
				if(err) {
					return printError(err, 1);
				}
				
				var files = 0;
				var currentFile = 0;
				li.forEach(function(file) {
					files += 1;
				});
				
				if(files > 0) {
					li.forEach(function(file) {
						var dat = fs.readFileSync("users/" + file, 'utf8');
						var esc = false;
						values = dat.split("\n");
						if(values[0].toString() == data.email) {
							data = bcrypt.compareSync(data.pass, values[1].toString());
							if(data) {
								io.emit('login-complete', {"success": true});
								valid = true;
							} else {
								valid = false;
							}
							return esc = true;
						}
								
						if(esc) {
							return;
						}
					});
				}
				
				if(!valid) {
					return printError("Incorrect email and/or password", 2);
				}
			});
		} else {
			printError("Invalid email.", 3);
		}
	});
});
