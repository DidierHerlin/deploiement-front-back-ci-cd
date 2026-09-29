/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  async headers() {
    return [
      {
        // Applique ces règles de sécurité sur toutes les routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' *; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: *; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' *; img-src 'self' data: blob: *; connect-src 'self' *;"
          }
        ]
      }
    ]
  }
}

export default nextConfig
