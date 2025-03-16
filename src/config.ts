import dotenv from 'dotenv';

dotenv.config();

export const config = {
  api: {
    baseUrl: 'https://client-api.8slp.net/v1',
    authUrl: 'https://auth-api.8slp.net/v1/tokens',
  },
  auth: {
    email: process.env.EIGHT_SLEEP_EMAIL || '',
    password: process.env.EIGHT_SLEEP_PASSWORD || '',
    clientId: process.env.EIGHT_SLEEP_CLIENT_ID || '',
    clientSecret: process.env.EIGHT_SLEEP_CLIENT_SECRET || '',
    userId: process.env.EIGHT_SLEEP_USER_ID || ''
  },
  server: {
    port: process.env.PORT || 8001,
  },
}; 