// Health Check Script Example
const http = require('http');

const endpoints = [
  'http://localhost:3000/api/health',
  'http://localhost:3000/api/metrics',
];

endpoints.forEach(url => {
  http.get(url, res => {
    console.log(`${url}: ${res.statusCode}`);
  }).on('error', err => {
    console.error(`${url}: ERROR`, err.message);
  });
});
