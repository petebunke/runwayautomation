import '../styles/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Runway Automation - Batch Video Generation</title>
        <meta name="description" content="A free web app for the Runway API and Image-to-Video. Batch generate up to 20 videos at once and upscale your favorite ones. Download videos in 4K as MP4 and JSON." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://runway-automation.vercel.app/" />
        <meta property="og:title" content="Runway Automation - Batch Video Generation" />
        <meta property="og:description" content="A free web app for the Runway API and Image-to-Video. Batch generate up to 20 videos at once and upscale your favorite ones. Download videos in 4K as MP4 and JSON." />
        <meta property="og:image" content="/og-image.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://runway-automation.vercel.app/" />
        <meta property="twitter:title" content="Runway Automation - Batch Video Generation" />
        <meta property="twitter:description" content="A free web app for the Runway API and Image-to-Video. Batch generate up to 20 videos at once and upscale your favorite ones. Download videos in 4K as MP4 and JSON." />
        <meta property="twitter:image" content="/og-image.png" />

        {/* Additional SEO tags */}
        <meta name="keywords" content="Runway, batch video generation, automation, video creation, artificial intelligence, machine learning" />
        <meta name="author" content="Runway Automation" />
        <meta name="robots" content="index, follow" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#667eea" />
        <meta name="msapplication-navbutton-color" content="#667eea" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}