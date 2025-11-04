import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración básica
  reactCompiler: true,
  
  // Configurar dominios externos para imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
