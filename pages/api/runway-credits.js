// /pages/api/runway-credits.js
// Updated to use the official organization endpoint for accurate credit checking

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
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    console.log('Checking organization credit balance...');

    // Create abort controller for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch('https://api.dev.runwayml.com/v1/organization', {
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
      console.log('Organization API response status:', response.status);
      console.log('Organization API response:', responseText.substring(0, 500));

      // Check if response is HTML (indicates server error or non-JSON response)
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        console.error('Received HTML response instead of JSON:', responseText.substring(0, 300));
        return res.status(502).json({
          error: 'Runway organization API returned an HTML page instead of JSON',
          message: 'This usually indicates a server error or maintenance on RunwayML\'s side.'
        });
      }

      // Check if response is empty
      if (!responseText || responseText.trim() === '') {
        console.error('Received empty response from Runway organization API');
        return res.status(502).json({
          error: 'Empty response from Runway organization API',
          message: 'The organization API returned an empty response'
        });
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse organization response as JSON:', parseError);
        console.log('Raw response causing parse error:', responseText.substring(0, 500));
        
        return res.status(502).json({
          error: 'Invalid response from Runway organization API',
          message: 'The API returned an unexpected response format',
          rawResponse: responseText.substring(0, 200),
          parseError: parseError.message
        });
      }

      // Handle API errors
      if (!response.ok) {
        console.error('Runway organization API error:', response.status, data);
        
        // Provide more specific error messages
        if (response.status === 401) {
          return res.status(401).json({
            error: 'Invalid API key',
            message: 'Please check your RunwayML API key and try again'
          });
        }
        
        if (response.status === 404) {
          return res.status(404).json({
            error: 'Organization endpoint not found',
            message: 'The organization endpoint may not be available for your account'
          });
        }

        if (response.status === 429) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please wait before trying again.',
            retryAfter: response.headers.get('Retry-After') || '60'
          });
        }

        if (response.status >= 500) {
          return res.status(response.status).json({
            error: 'Runway server error',
            message: 'Runway organization API is experiencing issues. This is usually temporary.',
            status: response.status,
            retryable: true
          });
        }

        return res.status(response.status).json({
          error: `Runway Organization API Error (${response.status})`,
          message: data.error || data.message || 'Unknown error',
          details: data
        });
      }

      console.log('Organization info retrieved successfully');
      
      // Return the organization data with enhanced information
      const enhancedData = {
        creditBalance: data.creditBalance || 0,
        tier: data.tier || {},
        usage: data.usage || {},
        // Add some helper fields for easier consumption
        hasCredits: (data.creditBalance || 0) > 0,
        tierInfo: {
          maxConcurrentGen4Turbo: data.tier?.models?.gen4_turbo?.maxConcurrentGenerations || 0,
          maxConcurrentGen3aTurbo: data.tier?.models?.gen3a_turbo?.maxConcurrentGenerations || 0,
          maxConcurrentUpscale: data.tier?.models?.upscale_v1?.maxConcurrentGenerations || 0,
          maxDailyGen4Turbo: data.tier?.models?.gen4_turbo?.maxDailyGenerations || 0,
          maxDailyGen3aTurbo: data.tier?.models?.gen3a_turbo?.maxDailyGenerations || 0,
          maxDailyUpscale: data.tier?.models?.upscale_v1?.maxDailyGenerations || 0,
          maxMonthlyCreditSpend: data.tier?.maxMonthlyCreditSpend || 0
        },
        usageInfo: {
          dailyGen4Turbo: data.usage?.models?.gen4_turbo?.dailyGenerations || 0,
          dailyGen3aTurbo: data.usage?.models?.gen3a_turbo?.dailyGenerations || 0,
          dailyUpscale: data.usage?.models?.upscale_v1?.dailyGenerations || 0
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(enhancedData);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle specific error types
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ 
          error: 'Request timeout',
          message: 'Runway organization API took too long to respond (30s)',
          retryable: true
        });
      }
      
      // Handle network errors gracefully
      if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          error: 'Unable to connect to Runway organization API',
          message: 'Network error while checking organization info',
          retryable: true
        });
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Organization API proxy error:', error);
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Unable to connect to Runway organization API',
        message: 'Please check your internet connection and try again',
        retryable: true
      });
    }

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        error: 'Request timeout',
        message: 'Runway organization API took too long to respond'
      });
    }

    // Handle other errors
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred while checking organization info',
      retryable: true
    });
  }
}