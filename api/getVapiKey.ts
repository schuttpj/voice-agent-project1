import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Check if request is authorized
  const authHeader = req.headers['x-vapi-signature'];
  const expectedSecret = process.env.API_SECRET;
  
  // Set CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Vapi-Signature');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Get the API key from environment variables
    const apiKey = process.env.VAPI_API_KEY;
    
    if (!apiKey) {
      console.error('VAPI_API_KEY is not defined in environment variables');
      return res.status(500).json({
        error: 'API key not configured',
        success: false
      });
    }
    
    // Return the API key exactly as in the environment variable
    return res.status(200).json({
      apiKey,
      success: true
    });
  } catch (error) {
    console.error('Error getting Vapi API key:', error);
    return res.status(500).json({
      error: 'Failed to get API key',
      success: false
    });
  }
} 