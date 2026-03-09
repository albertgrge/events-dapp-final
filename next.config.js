/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
    };
    config.externals = [...(config.externals || []), "pino-pretty", "encoding"];
    return config;
  },
};

module.exports = nextConfig;
