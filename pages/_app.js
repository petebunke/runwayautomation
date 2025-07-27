import '../styles/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Runway Automation Pro - AI Video Generation</title>
        <meta name="description" content="Professional-grade video generation automation for RunwayML. Generate multiple AI videos with advanced batch processing." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Runway ML Official Favicons */}
        <link rel="icon" href="https://runwayml.com/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="https://runwayml.com/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="https://runwayml.com/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="https://runwayml.com/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="https://runwayml.com/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="https://runwayml.com/android-chrome-512x512.png" />
        
        {/* Fallback SVG Favicon */}
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none'%3E%3Crect width='32' height='32' rx='6' fill='%23000000'/%3E%3Cpath d='M8 24V8h8.5c2.485 0 4.5 2.015 4.5 4.5 0 1.381-.622 2.617-1.6 3.45L22 24h-3.2l-2.4-7.5H11V24H8zm3-10h5.5c.828 0 1.5-.672 1.5-1.5S16.828 11 16 11H11v3z' fill='%23FFFFFF'/%3E%3C/svg%3E" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://runway-automation.vercel.app/" />
        <meta property="og:title" content="Runway Automation Pro - AI Video Generation" />
        <meta property="og:description" content="Professional-grade video generation automation for RunwayML. Generate multiple AI videos with advanced batch processing." />
        <meta property="og:image" content="/og-image.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://runway-automation.vercel.app/" />
        <meta property="twitter:title" content="Runway Automation Pro - AI Video Generation" />
        <meta property="twitter:description" content="Professional-grade video generation automation for RunwayML. Generate multiple AI videos with advanced batch processing." />
        <meta property="twitter:image" content="/og-image.png" />

        {/* Additional SEO tags */}
        <meta name="keywords" content="RunwayML, AI video generation, automation, video creation, artificial intelligence, machine learning" />
        <meta name="author" content="Runway Automation Pro" />
        <meta name="robots" content="index, follow" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-navbutton-color" content="#000000" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}