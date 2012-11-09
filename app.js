var settings = require('./config').Config,
		app = require('http').createServer(),
		redis = require("redis"),
		pubsub = redis.createClient(settings.redis.port, settings.redis.host, { no_ready_check : true }),
		client = redis.createClient(settings.redis.port, settings.redis.host, { no_ready_check: true }),  
		io = require('socket.io').listen(app, { log: false }),
		Message = require('./models/message');

// Error Handling for redis
client.on("error", function(error) {
	console.log("Error: [" + error + "]");
});

pubsub.on("error", function(error) {
	console.log("Error: [" + error + "]");
});

// Authorize both redis clients
if(settings.redis.auth != "") {
	pubsub.auth(settings.redis.auth);
	client.auth(settings.redis.auth);
}

// Socket.io
// Have socket io listen for new connections
io.sockets.on('connection', function(socket) {
	// On New User
	socket.on('new user', function(data) {
		// Set room and user
		socket.room = 'station ' + data.station;
		socket.user = data.user;
		// Join
		socket.join(socket.room);
		// Emit
		io.sockets.in(socket.room).emit('update user count', io.sockets.clients(socket.room).length);
		if(data.user != "") {
			io.sockets.in(socket.room).emit('chat message', new Message("notification", socket.user + " has entered chat.", "Admin"));
		}
		client.get(data.station + ' now playing', function(error, data) {
			if(data != null && !error) {
				socket.emit('song play', JSON.parse(data));
			}
		});
	});

	// On Disconnect
	socket.on('disconnect', function() {
		// Leave
		socket.leave(socket.room);
		// Emit
		io.sockets.in(socket.room).emit('update user count', io.sockets.clients(socket.room).length);
		if(socket.user != "") {
			io.sockets.in(socket.room).emit('chat message', new Message("notification", socket.user + " has disconnect from chat.", "Admin"));
		}
	});

	socket.on('new message', function(data) {
		io.sockets.emit(socket.room).emit('chat message', new Message("user", data, socket.user));
	});
});

// Redis
// Have client listen for new messages
pubsub.on("message", function(channel, message) {
	var json = JSON.parse(message);

	printSeparator();
	console.log("Received on " + channel);
	printSeparator();
	console.log(json);
	printSeparator();
	console.log("Emitting to station " + json.station)
	printSeparator();

	setPlaying(json.station, json.song);

	// Emit Received Song Data
	io.sockets.in('station ' + json.station).emit("new song", json.song);
	io.sockets.in('station ' + json.station).emit("chat message", new Message("notification", json.user + " started playing a song."));
});

// Subscribe redis client to channel 'new posts'
pubsub.subscribe("new song");

// Start the server
app.listen(settings.port, settings.port);

console.log('Server running at http://' + settings.host + ':' + settings.port + '/');
console.log('Running in ' + settings.env + ' mode');

// Functions
function printSeparator() {
	console.log("======================================");
}

function setPlaying(channel, song) {
	client.set(channel + " now playing", JSON.stringify({ time: ((new Date()).getTime()), song: song }), redis.print);
}

