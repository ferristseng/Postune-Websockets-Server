var User = function(user) {
	this.permalink = user.permalink;
	this.name = user.name;
	this.color = user.color;

	this.link = function() {
		return "<a href='" + this.permalink + "'>" + this.name + "</a>";
	}

	this.stringify = function() {
		return JSON.stringify(this);
	};

	// === User ===
	// name
	// permalink
	// ============
	this.print = function() {
		console.log("=== User ===\n" + user.name + "\n" + user.permalink + "\n" + "============");
	}
}

module.exports = User;