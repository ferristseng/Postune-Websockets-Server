var settings = require('../config').Config,
		redis = require('redis');

pubsubClient = redis.createClient(settings.redis.port, settings.redis.host, { no_ready_check: true });

// On error handler for redis pub/sub
pubsubClient.on("error", function(error) {
	console.log("PubSub | Error: [" + error + "]");
});

// Authorize Pubsub Client
if(settings.redis.auth != "") {
	pubsubClient.auth(settings.redis.auth);
}

module.exports = pubsubClient;