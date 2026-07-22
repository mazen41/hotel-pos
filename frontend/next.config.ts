import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Clean URLs — no trailing slashes
  trailingSlash: false,

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // the project has ESLint errors or compatibility issues.
    ignoreDuringBuilds: true,
  },
};

export default withNextIntl(nextConfig);
