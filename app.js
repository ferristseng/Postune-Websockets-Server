var settings = require('./config').Config,
		app = require('http').createServer(),
		redis = require("redis"),
		pubsub = redis.createClient(settings.redis.port, settings.redis.host, { no_ready_check : true }),
		client = redis.createClient(settings.redis.port, settings.redis.host, { no_ready_check: true }),  
		io = require('socket.io').listen(app, { log: false }),
		Message = require('./models/message'),
		Song = require('./models/song');

// Error Handling for redis
client.on("error", function(error) {
	console.log("Error: [" + error + "]");
});

// Authorize both redis clients
if(settings.redis.auth != "") {
	pubsub.auth(settings.redis.auth);
	client.auth(settings.redis.auth);
}

// ==================================
// [Socket.io]
// - New connections
// - Disconnects
// - New chat messages
// ==================================

// Have socket io listen for new connections
io.sockets.on('connection', function(socket) {
	// On New User
	socket.on('new user', function(data) {
		// Set room and user
		socket.room = data.station;
		socket.user = data.user;

		// Join
		socket.join(socket.room);

		// ===
		// TODO: Figure out how to handle station ONLINE attribute
		// ---
		client.sadd(socket.room + ' users', data.user);
		client.sadd('online stations', data.station);

		// Emit
		io.sockets.in(socket.room).emit('update user count', io.sockets.clients(socket.room).length);
		if(data.user != "") {
			io.sockets.in(socket.room).emit('chat message', new Message("notification", socket.user + " has entered chat.", "Admin"));
		}

		// Get the most recently played song for the user that joined
		client.get(data.station + ' now playing', function(error, data) {
			if(data != null && !error) {
				socket.emit('play song', JSON.parse(data));
			}
		});
	});

	// On Disconnect
	socket.on('disconnect', function() {
		// Leave
		socket.leave(socket.room);
		var count = io.sockets.clients(socket.room).length;

		// Emit
		io.sockets.in(socket.room).emit('update user count', count);
		if(socket.user != "") {
			io.sockets.in(socket.room).emit('chat message', new Message("notification", socket.user + " has disconnect from chat.", "Admin"));
		}

		// ====
		// TODO: Figure out how to handle station ONLINE attribute
		// ----
		client.srem(socket.room + ' users', socket.user);

		if(count === 0) {
			client.srem('online stations', socket.room);
		}
	});

	socket.on('new message', function(data) {
		io.sockets.emit(socket.room).emit('chat message', new Message("user", data, socket.user));
	});
});

// ==================================
// [REDIS] Pub / Sub
// ==================================
// On error handler for redis pub/sub
pubsub.on("error", function(error) {
	console.log("Error: [" + error + "]");
});

// Have client listen for new messages
pubsub.on("message", function(channel, message) {
	var json = JSON.parse(message),
			song = new Song(json.song);

	printSeparator();
	console.log("Received on " + channel);
	printSeparator();
	console.log(json);
	printSeparator();
	console.log("Emitting to station " + json.station)
	printSeparator();

	setPlaying(json.station, song);

	// Emit Received Song Data
	io.sockets.in(json.station).emit("play song", song);
	io.sockets.in(json.station).emit("chat message", new Message("notification", json.user + " started playing a song."));
});

// Subscribe redis client to channel 'new posts'
pubsub.subscribe("new song");

// Start the server
app.listen(settings.port, settings.host);

// Functions
function printSeparator() {
	console.log("======================================");
}

function setPlaying(channel, song) {
	client.set(channel + " now playing", song.stringify());
	client.expire(channel + " now playing", 3600);
}

