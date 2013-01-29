var settings = require('../config').Config,
		redis = require('redis');

redisClient = redis.createClient(settings.redis.port, settings.redis.host, { no_ready_check: true });

// Event Handler for error
redisClient.on("error", function(error) {
	console.log("Redis | Error: [" + error + "]");
});

// Auth Redis
if(settings.redis.auth != "") {
	redisClient.auth(settings.redis.auth);
}

module.exports = redisClient;