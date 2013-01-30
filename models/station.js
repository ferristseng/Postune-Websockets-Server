var client = require('../initializers/redis'),
		Song = require('../models/song');

var Station = function(permalink) {
	this.permalink = permalink;

	this.playing;

	this.users = 0;

	this.room = function() {
		return this.permalink;
	}

	this.setPlaying = function(json) {
		var song = new Song(json);
		this.playing = song;
		client.hset(this.room(), "playing", song.stringify());
	}

	this.getPlaying = function(callback) {
		client.hget(this.room(), "playing", function(error, data) {
			if(data != null && !error) {
				callback(JSON.parse(data));
			}
		});
	}

	this.updateUserCount = function(count) {
		client.hset(this.room(), "users", count);
		this.users = count;
	}

	this.addUser = function(user) {
		client.sadd(this.room() + ' users', user.permalink);
	}

	this.print = function() {

	}
};

module.exports = Station;