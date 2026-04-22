/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  turbopack: {} as any,
  webpack: (config: any, { isServer }: any) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'agora-rtc-sdk-ng': false,
      };
    }
    return config;
  },
};

export default nextConfig;
