// Load Testing Script (k6)

// Save as scripts/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 50,
  duration: '1m',
};

export default function () {
  const res = http.get('https://beauty-crafter.com/api/health');
  check(res, { 'status was 200': (r) => r.status === 200 });
  sleep(1);
}
