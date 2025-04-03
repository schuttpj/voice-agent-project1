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
    const { type, assistant } = req.query;
    const templatesPath = path.join(process.cwd(), 'assistants-templates');
    
    // Return the list of available assistants
    if (!type && !assistant) {
      const listPath = path.join(templatesPath, 'assistants-list.json');
      const listContent = fs.readFileSync(listPath, 'utf-8');
      res.status(200).json(JSON.parse(listContent));
      return;
    }
    
    // Return common server configuration
    if (type === 'server-config') {
      const configPath = path.join(templatesPath, 'common', 'server-config.json');
      const configContent = fs.readFileSync(configPath, 'utf-8');
      res.status(200).json(JSON.parse(configContent));
      return;
    }
    
    // Return assistant-specific configuration
    if (assistant && type) {
      const assistantPath = path.join(templatesPath, String(assistant));
      
      // Check if the assistant directory exists
      if (!fs.existsSync(assistantPath)) {
        res.status(404).json({ error: 'Assistant not found' });
        return;
      }
      
      // Load the requested configuration type
      const configPath = path.join(assistantPath, `${type}.json`);
      if (!fs.existsSync(configPath)) {
        res.status(404).json({ error: 'Configuration not found' });
        return;
      }
      
      const configContent = fs.readFileSync(configPath, 'utf-8');
      res.status(200).json(JSON.parse(configContent));
      return;
    }
    
    res.status(400).json({ error: 'Invalid request' });
  } catch (error) {
    console.error('[getAssistantTemplates] Error:', error);
    res.status(500).json({ error: 'Failed to fetch assistant templates' });
  }
} 