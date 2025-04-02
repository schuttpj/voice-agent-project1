import { VercelRequest, VercelResponse } from "@vercel/node";
import { getCharacterInspiration } from "../functions/getCharacterInspiration";

// Environment variables
const API_SECRET = process.env.API_SECRET || "vapi-voice-agent-secret";
const ENVIRONMENT = process.env.ENVIRONMENT || "development";
const IS_DEV = ENVIRONMENT === "development";

export default async (req: VercelRequest, res: VercelResponse) => {
  // Add CORS headers in development mode
  if (IS_DEV) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-vapi-signature");
    
    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
  }

  console.log(`[${ENVIRONMENT}] ========== REQUEST RECEIVED ==========`);
  console.log(`[${ENVIRONMENT}] Request method:`, req.method);
  console.log(`[${ENVIRONMENT}] Request headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`[${ENVIRONMENT}] Request body:`, JSON.stringify(req.body, null, 2));
  
  try {
    // Check for authentication - skip in development if needed
    const token = req.headers["x-vapi-signature"];
    
    if (!IS_DEV && (!token || token !== API_SECRET)) {
      console.log(`[${ENVIRONMENT}] Authentication failed. Token:`, token);
      return res.status(401).json({ 
        error: "Unauthorized: Invalid or missing authentication token",
        expectedToken: IS_DEV ? API_SECRET : undefined // Only show expected token in dev
      });
    }

    // Process the request
    const { inspiration, assistantName } = req.body;
    
    if (!inspiration) {
      console.log(`[${ENVIRONMENT}] Missing required parameter: inspiration`);
      return res.status(400).json({ error: "Missing required parameter: inspiration" });
    }

    console.log(`[${ENVIRONMENT}] Processing request with inspiration: "${inspiration}" and assistantName: "${assistantName || 'default'}"`);

    // Call the function with optional assistantName
    const result = await getCharacterInspiration({ 
      inspiration,
      assistantName // Pass the assistantName if provided
    });
    
    // Return the result
    console.log(`[${ENVIRONMENT}] Result generated successfully:`, JSON.stringify(result).substring(0, 100) + "...");
    console.log(`[${ENVIRONMENT}] ========== REQUEST COMPLETED ==========`);
    return res.status(200).json(result);
  } catch (error) {
    console.error(`[${ENVIRONMENT}] Error processing request:`, error);
    
    // Provide more detailed error information in development
    return res.status(500).json({ 
      error: "Internal server error", 
      message: error instanceof Error ? error.message : "Unknown error",
      stack: IS_DEV && error instanceof Error ? error.stack : undefined
    });
  }
}; 