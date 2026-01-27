import { ImageResponse } from 'next/og'
 
// Route segment config
export const runtime = 'edge'
 
// Image metadata
export const size = {
  width: 512,
  height: 512,
}
export const contentType = 'image/png'
 
// Image generation
export default function GooglePlayIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'hsl(122, 40%, 42%)', // --primary
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '96px',
        }}
      >
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="350" 
            height="350" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="hsl(120, 25%, 98%)" // --primary-foreground
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        >
            <path d="M10 18a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z"/>
            <path d="M22 18a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z"/>
            <path d="M20 15c0-2.2-1.8-4-4-4h-2.5l-3-4H5c-1.1 0-2 .9-2 2v6h1.3c.5 0 .9.4.8.9L5 18"/>
            <path d="M10 5h2"/>
            <path d="m14 5-3 4"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
