/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/",
        permanent: true,
      },
      {
        source: "/admin/roles",
        destination: "/admin/users",
        permanent: true,
      },
      {
        source: "/admin/logs",
        destination: "/admin/login-history",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

