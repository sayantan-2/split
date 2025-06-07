/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        port: '',
        pathname: '/api/portraits/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
      },
    ],
  },
  // Disable static export as we're using API routes
  output: 'standalone',
};

export default nextConfig;
