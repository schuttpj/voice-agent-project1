import { VercelRequest, VercelResponse } from "@vercel/node";
import { getCharacterInspiration } from "../functions/getCharacterInspiration";

// A simple secret token for authentication
const API_SECRET = process.env.API_SECRET || "your-default-secret-token";

export default async (req: VercelRequest, res: VercelResponse) => {
  console.log("========== REQUEST RECEIVED ==========");
  console.log("Request method:", req.method);
  console.log("Request headers:", JSON.stringify(req.headers, null, 2));
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  
  try {
    // Check for authentication
    const token = req.headers["x-vapi-signature"];
    
    if (!token || token !== API_SECRET) {
      console.log("Authentication failed. Token:", token);
      return res.status(401).json({ error: "Unauthorized: Invalid or missing authentication token" });
    }

    // Process the request
    const { inspiration, assistantName } = req.body;
    
    if (!inspiration) {
      console.log("Missing required parameter: inspiration");
      return res.status(400).json({ error: "Missing required parameter: inspiration" });
    }

    console.log(`Processing request with inspiration: "${inspiration}" and assistantName: "${assistantName || 'default'}"`);

    // Call the function with optional assistantName
    const result = await getCharacterInspiration({ 
      inspiration,
      assistantName // Pass the assistantName if provided
    });
    
    // Return the result
    console.log("Result generated successfully:", JSON.stringify(result).substring(0, 100) + "...");
    console.log("========== REQUEST COMPLETED ==========");
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      message: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}; 