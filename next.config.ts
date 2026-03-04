/** @type {import('next').NextConfig} */
import type { Configuration } from 'webpack';

const nextConfig = {
  // Configuration ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  
//   // Exemple de config Webpack avec typage
//   experimental: {
//     missingSuspenseWithCSRBailout: false,
// }
};
export default nextConfig;