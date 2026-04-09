export const env = {
  apiUrl:          process.env.NEXT_PUBLIC_API_URL          ?? 'http://localhost:3000/api',
  stripePublicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ?? '',
  agoraAppId:      process.env.NEXT_PUBLIC_AGORA_APP_ID      ?? '',
  nodeEnv:         process.env.NODE_ENV                      ?? 'development',
} as const;
