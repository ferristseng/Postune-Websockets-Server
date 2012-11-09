var development = {
  host: '127.0.0.1',
  port: 3001,
  redis: {
  	host: 'localhost',
  	port: 6379,
  	auth: ''
  },
  env: global.process.env.NODE_ENV || 'development'
};

var production = {
  host: '127.0.0.1',
  port: 3000,
  redis: {
  	host: 'herring.redistogo.com',
  	port: 9992,
  	auth: '4bac59599da554c57c02fd3f5236e390'
  },
  env: global.process.env.NODE_ENV || 'production'
};

exports.Config = global.process.env.NODE_ENV === 'production' ? production : development;