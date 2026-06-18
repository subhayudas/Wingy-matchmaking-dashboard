/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "wingy.blob.core.windows.net" },
      { protocol: "https", hostname: "**.core.windows.net" },
    ],
  },
};

export default nextConfig;
