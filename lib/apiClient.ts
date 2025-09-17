// ENTERPRISE-GRADE API CLIENT WITH ERROR HANDLING
import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: process.env.API_URL || 'https://your-api-url.com',
  timeout: 10000,
});

export async function apiRequest<T>(config: any): Promise<T> {
  try {
    const response = await api.request<T>(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Log error to Sentry or monitoring
      // Sentry.captureException(error);
      throw new Error(error.response?.data?.message || error.message);
    }
    throw error;
  }
}