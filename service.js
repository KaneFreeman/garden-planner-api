var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name: 'Garden Planner API',
  description: 'NestJS API for Garden Planner application',
  script: require('path').join(__dirname, 'dist-prod', 'main.js'),
  env: {
    name: 'NODE_ENV',
    value: 'production'
  },
  nodeOptions: ['--harmony', '--max_old_space_size=4096']
  //, workingDirectory: '...'
  //, allowServiceLogon: true
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function () {
  svc.start();
});

svc.install();
