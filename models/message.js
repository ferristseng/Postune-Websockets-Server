var Message = function(type, text, user) {
	this.type = type;

	this.content = {
		user: user,
		text: text,
		timestamp: new Date().getTime()
	};
};

module.exports = Message;