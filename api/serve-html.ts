import { VercelRequest, VercelResponse } from "@vercel/node";
import { readFile } from "fs/promises";
import path from "path";

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const htmlPath = path.join(process.cwd(), "public", "index.html");
    const htmlContent = await readFile(htmlPath, "utf-8");
    
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(htmlContent);
  } catch (error) {
    console.error("Error serving HTML:", error);
    return res.status(500).send("Error serving the page");
  }
}; 