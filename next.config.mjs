import withPWA from '@ducanh2912/next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

export default withPWA({
  dest: 'public',
  disable: false, // Enable PWA in development too
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  }
})(nextConfig);
