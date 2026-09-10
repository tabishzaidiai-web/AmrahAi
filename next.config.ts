import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The pose library is read from disk at request time. Nothing imports these
  // files, so tracing cannot discover them and they must be named explicitly or
  // the shoot route finds no poses once deployed.
  outputFileTracingIncludes: {
    '/api/shoot': ['./assets/poses/**'],
  },
  // Sharp is a native module; bundling it breaks the binary it loads.
  serverExternalPackages: ['sharp'],
};

export default nextConfig;
