// /pages/api/runway-credits.js (Fixed deployment version)

export default async function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests (we need to send API key in body)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey } = req.body;

    // Validate required parameters
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    console.log('Checking credit balance...');

    // Create abort controller for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      // Use the account/me endpoint to get user info including credits
      const response = await fetch('https://api.dev.runwayml.com/v1/account/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      console.log('Credits API response (first 300 chars):', responseText.substring(0, 300));

      // Check if response is HTML (error page)
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        console.error('Received HTML response instead of JSON');
        return res.status(502).json({
          error: 'RunwayML API returned HTML instead of JSON',
          message: 'This usually indicates a server error or maintenance on RunwayML\'s side.'
        });
      }

      // Check if response is empty
      if (!responseText || responseText.trim() === '') {
        console.error('Received empty response from RunwayML credits API');
        return res.status(502).json({
          error: 'Empty response from RunwayML API',
          message: 'The credits API returned an empty response'
        });
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse credits response as JSON:', parseError);
        console.log('Raw response causing parse error:', responseText.substring(0, 500));
        
        // Check if it's a binary response
        if (responseText.charCodeAt(0) === 0 || responseText.includes('\u0000')) {
          return res.status(502).json({
            error: 'Binary response received instead of JSON',
            message: 'RunwayML credits API returned binary data instead of expected JSON response'
          });
        }

        return res.status(502).json({
          error: 'Invalid response from RunwayML API',
          message: 'Could not parse credit balance response as JSON',
          rawResponse: responseText.substring(0, 300),
          parseError: parseError.message
        });
      }

      // Handle API errors
      if (!response.ok) {
        console.error('RunwayML credits API error:', response.status, data);
        
        if (response.status === 401) {
          return res.status(401).json({
            error: 'Invalid API key',
            message: 'Please check your RunwayML API key'
          });
        }
        
        if (response.status === 429) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please wait before checking credits again.'
          });
        }

        if (response.status >= 500) {
          return res.status(response.status).json({
            error: 'RunwayML server error',
            message: 'RunwayML API is experiencing issues. Credit check unavailable.',
            retryable: true
          });
        }

        return res.status(response.status).json({
          error: data.error || 'RunwayML API error',
          details: data
        });
      }

      // Extract credit information
      const credits = data.credits || data.credit_balance || data.account?.credits || 0;
      
      console.log('Credit balance retrieved:', credits);

      // Return successful response
      res.status(200).json({ 
        credits: credits,
        account: data.account || {},
        tier: data.tier || 'unknown'
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ 
          error: 'Request timeout',
          message: 'RunwayML API took too long to respond',
          retryable: true
        });
      }
      
      // Handle network errors gracefully
      if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          error: 'Unable to connect to RunwayML API',
          message: 'Network error while checking credits',
          retryable: true
        });
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Credits check error:', error);
    
    // Handle network errors gracefully
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Unable to connect to RunwayML API',
        message: 'Network error while checking credits',
        retryable: true
      });
    }

    // Handle other errors
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      retryable: true
    });
  }
}