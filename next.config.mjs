/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/fable-terminal',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
