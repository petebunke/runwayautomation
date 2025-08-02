// /pages/api/runway-generate.js (Fixed based on debug results)

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

    if (!payload.promptImage) {
      return res.status(400).json({ 
        error: 'Image required for video generation',
        message: 'The current RunwayML API only supports image-to-video generation.'
      });
    }

    console.log('Making request to RunwayML API...');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06'
      },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);
    console.log('Response content-type:', response.headers.get('content-type'));

    // Get response as text first to debug the issue
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
        message: 'No data received'
      });
    }

    // Handle obvious binary data
    if (responseText.charCodeAt(0) === 0 || responseText.includes('\ufffd')) {
      return res.status(502).json({
        error: 'RunwayML API returned binary data',
        message: 'Unexpected binary response'
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
      return res.status(response.status).json({
        error: `RunwayML API Error (${response.status})`,
        message: data.error || data.message || 'Unknown error',
        details: data
      });
    }

    console.log('Success! Task created:', data.id);
    res.status(200).json(data);

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}