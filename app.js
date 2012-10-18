var settings = require('./config').Config,
		app = require('http').createServer(),
		redis = require("redis"),
		pubsub = redis.createClient(settings.redis.port, settings.redis.host),
		client = redis.createClient(settings.redis.port, settings.redis.host) 
		io = require('socket.io').listen(app, { log: false });

// Authorize both redis clients
if(settings.env == "production") {
	pubsub.auth('50647d7d0e670c3f887abc7a14f216bc');
	client.auth('50647d7d0e670c3f887abc7a14f216bc');
}

// Socket.io
// Have socket io listen for new connections
io.sockets.on('connection', function(socket) {
	// On New User
	socket.on('new user', function(data) {
		// Set room
		socket.room = 'station ' + data.station_id
		// Join
		socket.join(socket.room);
		// Log
		console.log("Now [" + io.sockets.clients(socket.room).length + "] users connected to " + socket.room);
		// Emit
		io.sockets.in(socket.room).emit('update user count', io.sockets.clients(socket.room).length);
	});

	// On Disconnect
	socket.on('disconnect', function() {
		// Leave
		socket.leave(socket.room);
		// Log
		console.log("Now [" + io.sockets.clients(socket.room).length + "] users connected to " + socket.room);
		// Emit
		io.sockets.in(socket.room).emit('update user count', io.sockets.clients(socket.room).length);
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
	console.log("Emitting to station " + json.song.station_id)
	printSeparator();

	// Emit Received Song Data
	io.sockets.in('station ' + json.song.station_id).emit("new song", json.song);
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