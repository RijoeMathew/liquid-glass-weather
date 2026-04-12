/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/liquid-glass-weather',
  // No assetPrefix needed with GitHub Actions + basePath
  trailingSlash: true,
};

module.exports = nextConfig;
