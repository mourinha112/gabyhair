/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permitir servir arquivos estáticos da pasta public
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig

