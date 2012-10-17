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
  port: 3001,
  redis: {
  	host: 'tetra.redistogo.com',
  	port: 10062,
  	auth: '50647d7d0e670c3f887abc7a14f216bc'
  },
  env: global.process.env.NODE_ENV || 'development'
};

exports.Config = global.process.env.NODE_ENV === 'production' ? production : development;