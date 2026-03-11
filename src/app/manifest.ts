import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Optimizador de Labores Agrícolas',
    short_name: 'AgriTask',
    description: 'Un ERP agrícola para optimizar la gestión de fincas.',
    start_url: '/',
    display: 'standalone',
    background_color: '#edf7ed',
    theme_color: '#388E3C',
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      },
      {
        src: "/google-play-icon",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  }
}
