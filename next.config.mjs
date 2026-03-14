/** @type {import('next').NextConfig} */
const nextConfig = {
  // In production (Vercel), /api/* is handled by the serverless function via vercel.json.
  // In local dev, proxy /api/* to the Express server on port 5005.
  async rewrites() {
    if (process.env.NODE_ENV === 'production') return [];
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5005/api/:path*',
      },
    ];
  },
};

export default nextConfig;
