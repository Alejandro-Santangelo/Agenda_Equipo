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
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
