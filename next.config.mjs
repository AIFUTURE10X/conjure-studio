/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // Strip the [v0]/debug console noise from production bundles; errors and
  // warnings stay for diagnosability.
  compiler: {
    removeConsole: { exclude: ['error', 'warn'] },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      },
    ],
  },
  // Required for native Node.js modules like ONNX Runtime used by @imgly/background-removal-node
  serverExternalPackages: [
    '@imgly/background-removal-node',
    'onnxruntime-node',
    'onnxruntime-common',
    'sharp',
    '@neplex/vectorizer',
  ],
}

export default nextConfig
