var Song = function(song) {
	this.time = (new Date()).getTime();
	this.song = song;

	this.stringify = function() {
		return JSON.stringify(this);
	};
};

module.exports = Song;