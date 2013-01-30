var settings = require('./config').Config,
		app = require('http').createServer(),
		pubsub = require('./initializers/pubsub'),
		client = require('./initializers/redis'),  
		io = require('socket.io').listen(app, { log: false }),
		Message = require('./models/message'),
		Song = require('./models/song'),
		Station = require('./models/station'),
		User = require('./models/user');

// ==================================
// [Socket.io]
// - New connections
// - Disconnects
// - New chat messages
// ==================================

// Have socket io listen for new connections
io.sockets.on('connection', function(socket) {
	// =============================
	// [Socket.io] - [ON CONNECTION]
	// SET user
	// SET station
	// ADD user to station's active members
	// ADD station to list of online stations
	// UPDATE the count of users in the stations
	// BROADCAST the new user count and a message notifying other users about the connection
	// EMIT the now playing data to the new user
	// =============================
	socket.on('new user', function(data) {
		var station = new Station(data.station),
				user = new User(data.user);

		// Set room and user
		socket.room = station.room();
		socket.user = user;

		// Join
		socket.join(station.room());
		station.addUser(user);

		// ===
		// TODO: Figure out how to handle station ONLINE attribute
		// ---
		client.sadd('online stations', station.room());

		// Update User Count
		station.updateUserCount(io.sockets.clients(station.room()).length);

		// Emit
		io.sockets.in(station.room()).emit('update user count', station.users);
		if(user.permalink != "") {
			io.sockets.in(station.room()).emit('chat message', new Message("notification", user.link() + " has entered chat.", "Admin"));
		}

		// Get the most recently played song for the user that joined
		station.getPlaying(function(data) { socket.emit('play song', data) });
	});

	socket.on('disconnect', function() {
		var station = new Station(socket.room);
		
		// Leave
		socket.leave(socket.room);
		
		station.updateUserCount(io.sockets.clients(socket.room).length);

		// Emit
		io.sockets.in(socket.room).emit('update user count', station.users);
		if(socket.user != "") {
			io.sockets.in(socket.room).emit('chat message', new Message("notification", socket.user.link() + " has disconnect from chat.", "Admin"));
		}

		// ====
		// TODO: Figure out how to handle station ONLINE attribute
		// ----
		client.srem(socket.room + ' users', socket.user);

		if(station.users === 0) {
			client.srem('online stations', socket.room);
		}
	});

	socket.on('new message', function(data) {
		io.sockets.emit(socket.room).emit('chat message', new Message("user", data, socket.user.link()));
	});
});

// ==================================
// [REDIS] Pub / Sub
// ==================================do
// Have client listen for new messages
pubsub.on("message", function(channel, message) {
	var json = JSON.parse(message),
			station = new Station(json.station),
			user = new User(json.user);

	station.setPlaying(json.song);

	// Emit Received Song Data
	io.sockets.in(station.room()).emit("play song", station.playing);
	io.sockets.in(station.room()).emit("chat message", new Message("notification", user.link() + " started playing a song."));
});

// Subscribe redis client to channel 'new posts'
pubsub.subscribe("new song");

// Start the server
app.listen(settings.port, settings.host);