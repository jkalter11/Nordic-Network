var values = [];
var host = "N/A";
var port = -1;

$(document).ready(function() {
    $.get("../properities.txt", function(data) {
        values = data.split("\n");
		
		host = values[0].trim();
		port = Number(values[1]);
	}).fail(function() {
		swal("Failed to get server IP", "Please contact our admins about this error so we can fix it as soon as possible!", "error");
	}).done(function() {
		var socket = io('http://' + host + ":" + port);
		if(typeof socket === 'undefined') {
			swal("Unable to connect to server.", "It seems our game servers are down, please wait until we've fixed the problem :)", "error");
		}
		
		socket.on('reg-complete', function(data){
			if(data.success){
				location.reload();
			} else {
				swal("Failed to register", "Reason: " + data.reason + "\nID: " + data.id, "error");
			}
		});
		
		$('form').submit(function(){
			socket.emit('register', {email: $('#email').val(), pass: $('#passwrd'.val())});
			return false;
		});
    }, 'text');
});