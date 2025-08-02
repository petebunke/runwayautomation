// /pages/api/runway-generate-video.js (New endpoint for video-to-video generation)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, payload } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    if (!payload || !payload.promptText) {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    if (!payload.videoUri) {
      return res.status(400).json({ 
        error: 'Video required for video-to-video generation',
        message: 'Gen-4 Aleph requires a video input for video-to-video generation.'
      });
    }

    // Validate video URL/data URI format
    if (payload.videoUri.startsWith('data:video/')) {
      // Validate data URI format
      const mimeMatch = payload.videoUri.match(/^data:video\/(mp4|webm|quicktime|mov|ogg|h264);base64,/);
      if (!mimeMatch) {
        return res.status(400).json({
          error: 'Invalid video data URI format',
          message: 'Video data URI must be MP4, WebM, MOV, OGG, or H264 format with base64 encoding'
        });
      }

      // Check 5MB data URI size limit
      if (payload.videoUri.length > 5 * 1024 * 1024) {
        return res.status(400).json({
          error: 'Video data URI too large',
          message: 'Data URI must be under 5MB. Please upload to a server and use URL instead.'
        });
      }
    } else {
      // Validate URL format
      try {
        const urlObj = new URL(payload.videoUri);
        
        // Must be HTTPS
        if (urlObj.protocol !== 'https:') {
          return res.status(400).json({
            error: 'Invalid video URL protocol',
            message: 'Video URL must use HTTPS protocol'
          });
        }

        // Must use domain name, not IP address
        const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(urlObj.hostname);
        if (isIP) {
          return res.status(400).json({
            error: 'Invalid video URL format',
            message: 'Video URL must use a domain name, not an IP address'
          });
        }

        // URL length limit
        if (payload.videoUri.length > 2048) {
          return res.status(400).json({
            error: 'Video URL too long',
            message: 'Video URL must be under 2048 characters'
          });
        }
      } catch (urlError) {
        return res.status(400).json({
          error: 'Invalid video URL',
          message: 'Please provide a valid HTTPS URL or data URI'
        });
      }
    }

    // Validate model is Gen-4 Aleph
    if (payload.model !== 'gen4_aleph') {
      return res.status(400).json({
        error: 'Invalid model for video-to-video',
        message: 'Video-to-video generation requires Gen-4 Aleph model'
      });
    }

    console.log('Making video-to-video request to RunwayML API...');
    console.log('Payload:', JSON.stringify({
      ...payload,
      videoUri: payload.videoUri.substring(0, 100) + '...' // Truncate for logging
    }, null, 2));

    // Create abort controller for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    try {
      const response = await fetch('https://api.dev.runwayml.com/v1/video_to_video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response content-type:', response.headers.get('content-type'));

      // Get response as text first to debug potential issues
      const responseText = await response.text();
      console.log('Response length:', responseText.length);
      console.log('Response first 200 chars:', responseText.substring(0, 200));

      // Handle HTML error responses (like 404 pages)
      if (response.headers.get('content-type')?.includes('text/html')) {
        console.log('Received HTML response instead of JSON');
        return res.status(response.status).json({
          error: 'RunwayML API returned HTML error page',
          message: `HTTP ${response.status}: Server returned HTML instead of JSON`,
          status: response.status
        });
      }

      // Handle empty responses
      if (!responseText.trim()) {
        return res.status(502).json({
          error: 'Empty response from RunwayML API',
          message: 'No data received from video-to-video endpoint'
        });
      }

      // Handle obvious binary data
      if (responseText.charCodeAt(0) === 0 || responseText.includes('\ufffd')) {
        return res.status(502).json({
          error: 'RunwayML API returned binary data',
          message: 'Unexpected binary response from video-to-video endpoint'
        });
      }

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError.message);
        console.log('Failed to parse response:', responseText.substring(0, 500));
        
        return res.status(502).json({
          error: 'Invalid JSON response from RunwayML API',
          message: 'Could not parse response as JSON',
          parseError: parseError.message,
          contentType: response.headers.get('content-type'),
          status: response.status,
          preview: responseText.substring(0, 200)
        });
      }

      if (!response.ok) {
        console.error('RunwayML API error:', response.status, data);
        
        // Handle specific error types
        if (response.status === 401) {
          return res.status(401).json({
            error: 'Invalid API key',
            message: 'Please check your RunwayML API key and try again'
          });
        }

        if (response.status === 400) {
          let errorMessage = data.error || data.message || 'Bad request';
          
          // Handle specific validation errors
          if (errorMessage.includes('credits') || errorMessage.includes('insufficient')) {
            return res.status(400).json({
              error: 'Insufficient credits',
              message: 'You do not have enough credits for video-to-video generation (~15 credits per second)',
              details: data
            });
          }

          if (errorMessage.includes('safety') || errorMessage.includes('SAFETY')) {
            return res.status(400).json({
              error: 'Content safety violation',
              message: 'Your content was rejected by safety filters',
              details: data
            });
          }

          if (errorMessage.includes('video') && errorMessage.includes('format')) {
            return res.status(400).json({
              error: 'Invalid video format',
              message: 'Video must be MP4, WebM, MOV, OGG, or H264 format',
              details: data
            });
          }

          if (errorMessage.includes('duration') || errorMessage.includes('length')) {
            return res.status(400).json({
              error: 'Invalid video duration',
              message: 'Video duration may be outside acceptable limits',
              details: data
            });
          }

          return res.status(400).json({
            error: 'Generation request invalid',
            message: errorMessage,
            details: data
          });
        }

        if (response.status === 404) {
          return res.status(404).json({
            error: 'Video-to-video endpoint not found',
            message: 'The video-to-video endpoint may not be available for your account tier'
          });
        }

        if (response.status === 429) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many video-to-video requests. Please wait before trying again.',
            retryAfter: response.headers.get('Retry-After') || '60'
          });
        }

        if (response.status >= 500) {
          return res.status(response.status).json({
            error: 'RunwayML server error',
            message: 'RunwayML video-to-video API is experiencing issues. This is usually temporary.',
            status: response.status,
            retryable: true
          });
        }

        return res.status(response.status).json({
          error: `RunwayML Video-to-Video API Error (${response.status})`,
          message: data.error || data.message || 'Unknown error',
          details: data
        });
      }

      console.log('Success! Video-to-video task created:', data.id);
      res.status(200).json(data);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle specific error types
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ 
          error: 'Request timeout',
          message: 'RunwayML video-to-video API took too long to respond (2 minutes)',
          retryable: true
        });
      }
      
      // Handle network errors gracefully
      if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          error: 'Unable to connect to RunwayML video-to-video API',
          message: 'Network error while creating video-to-video generation',
          retryable: true
        });
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Video-to-video handler error:', error);
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Unable to connect to RunwayML video-to-video API',
        message: 'Please check your internet connection and try again',
        retryable: true
      });
    }

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        error: 'Request timeout',
        message: 'RunwayML video-to-video API took too long to respond'
      });
    }

    // Handle other errors
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred while processing the video-to-video request',
      retryable: true
    });
  }
}