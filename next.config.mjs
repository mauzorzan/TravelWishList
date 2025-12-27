/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mark native modules as external for server-side bundling
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

export default nextConfig;
