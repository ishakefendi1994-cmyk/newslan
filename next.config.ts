import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.mixkit.co',
      },
      {
        protocol: 'https',
        hostname: 'newslan.id',
      },
      {
        protocol: 'https',
        hostname: 'dxflzgwpibnoiktvftwp.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      // RSS Feed Image Domains
      {
        protocol: 'https',
        hostname: 'akcdn.detik.net.id',
      },
      {
        protocol: 'https',
        hostname: 'cdn.cnnindonesia.com',
      },
      {
        protocol: 'https',
        hostname: 'statik.tempo.co',
      },
      {
        protocol: 'https',
        hostname: 'asset.kompas.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.liputan6.com',
      },
      {
        protocol: 'https',
        hostname: 'img.antaranews.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn-2.tstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'asset.tribunnews.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.antaranews.com',
      }
    ],
  },
}

export default nextConfig;
