import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get the path to the HTML file
    const filePath = path.join(process.cwd(), 'public', 'inline-assistant.html');
    
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Set headers and send the file
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(fileContent);
    
    console.log('[inlineAssistant] Successfully served dynamic assistant HTML page');
  } catch (error) {
    console.error('[inlineAssistant] Error serving dynamic assistant HTML page:', error);
    res.status(500).json({ error: 'Failed to serve HTML page' });
  }
} 