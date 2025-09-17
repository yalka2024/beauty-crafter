// Circuit Breaker/Retry/Timeout Example
import axios from 'axios';

export async function callWithCircuitBreaker(url: string, options = {}, retries = 3, timeout = 5000) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, { ...options, timeout });
      return response.data;
    } catch (err) {
      lastError = err;
      // Optionally: log error, increment failure count, open circuit, etc.
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
}
