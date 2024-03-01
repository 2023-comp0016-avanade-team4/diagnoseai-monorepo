/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "ucl2324team4fnsa.blob.core.windows.net",
      "img.clerk.com"
    ],
  },
};

module.exports = nextConfig;
