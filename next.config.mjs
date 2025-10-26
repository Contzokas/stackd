import withPWA from '@ducanh2912/next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Disable PWA in dev for better performance
  register: true,
  skipWaiting: true,
  workboxOptions: {
    disableDevLogs: true,
  }
})(nextConfig);
