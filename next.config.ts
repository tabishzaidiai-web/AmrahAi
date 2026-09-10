import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Model poses are read from disk at request time. Nothing imports these
  // files, so tracing cannot discover them and they must be named explicitly or
  // a deployed shoot finds no models to dress.
  outputFileTracingIncludes: {
    '/api/shoot': ['./assets/models/**'],
  },
  // Sharp is a native module; bundling it breaks the binary it loads.
  serverExternalPackages: ['sharp'],
};

export default nextConfig;
