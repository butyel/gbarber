/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['firebase', '@firebase'],
  },
};

module.exports = nextConfig;