/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Setting basePath to the repository name for GitHub Pages
  basePath: '/liquid-glass-weather',
  assetPrefix: '/liquid-glass-weather',
};

module.exports = nextConfig;
