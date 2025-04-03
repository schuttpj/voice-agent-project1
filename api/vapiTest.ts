import { VercelRequest, VercelResponse } from '@vercel/node';
import { readFile } from 'fs/promises';
import path from 'path';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Read the HTML file
    const filePath = path.join(process.cwd(), 'public', 'vapi-test.html');
    const htmlContent = await readFile(filePath, 'utf8');
    
    // Set the content type header
    res.setHeader('Content-Type', 'text/html');
    
    // Send the HTML content
    return res.status(200).send(htmlContent);
  } catch (error) {
    console.error('Error serving HTML:', error);
    return res.status(500).send('Error serving HTML');
  }
} 