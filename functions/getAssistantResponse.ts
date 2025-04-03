import { Document, VectorStoreIndex, storageContextFromDefaults } from "llamaindex";
import { OpenAI } from "@llamaindex/openai";
import { OpenAIEmbedding } from "@llamaindex/openai";
import { PGVectorStore } from "@llamaindex/postgres";
import { readFile, readdir } from "fs/promises";
import path from "path";
import { envConfig } from "../config/env.config";
import { createHash } from "crypto";

// Configure OpenAI globally for LlamaIndex
process.env.OPENAI_API_KEY = envConfig.openai.apiKey;

interface GetAssistantResponseParams {
  inspiration: string;
  assistantName?: string; // Use assistant name instead of ID
}

// Document metadata interface
interface DocumentMetadata {
  source: string;
  content_hash: string;
  updated_at: string;
  current_files?: string;
  assistant_name: string; // Use assistant name in metadata
  [key: string]: any; // Allow for additional metadata fields
}

// Interface for assistant configuration
interface AssistantConfig {
  name: string;            // Human-readable name
  tableName: string;       // Database table name
  sourceFolder: string;    // Each assistant has its own subfolder
  promptTemplate: string;  // Query template for this assistant
}

// Assistant configurations using names rather than IDs
const ASSISTANTS: Record<string, AssistantConfig> = {
  'Victor': {  // Character inspiration assistant
    name: 'Victor',
    tableName: 'victor_embeddings',
    sourceFolder: 'Victor', // Subfolder name matches assistant name
    promptTemplate: 'Based on the following inspiration: "{query}", suggest a character and potential activities or settings that would suit them. Include specific details from any character descriptions and activities from my knowledge base.'
  },
  'Roger': {   // Lead generation assistant
    name: 'Roger',
    tableName: 'roger_embeddings',
    sourceFolder: 'Roger',  // Subfolder name matches assistant name
    promptTemplate: 'Based on the following query: "{query}", generate a lead response that highlights our company offerings. Include relevant details from our company profile.'
  }
  
  // ==================================================================================
  // HOW TO ADD A NEW ASSISTANT:
  // 1. Add a new entry to the ASSISTANTS object with a human-friendly name as the key
  // 
  // Example for adding a marketing assistant named "Marcus":
  // 
  // 'Marcus': {   // Marketing content assistant
  //   name: 'Marcus',
  //   tableName: 'marcus_embeddings',  // Unique table name for this assistant's vectors
  //   sourceFolder: 'Marcus',          // Create this folder in the /data directory
  //   promptTemplate: 'Create marketing content based on: "{query}". Use my company voice and style.'
  // }
  // 
  // 2. Create the folder in your data directory: mkdir -p data/Marcus
  // 
  // 3. Add markdown (.md) files to the folder with the assistant's knowledge
  //    For example: data/Marcus/BrandVoice.md, data/Marcus/MarketingTemplates.md
  // 
  // 4. Deploy the updated code
  // 
  // 5. Call the API with the new assistant name:
  //    { 
  //      "inspiration": "Create a social media post about our new product", 
  //      "assistantName": "Marcus" 
  //    }
  // ==================================================================================
};

// Calculate MD5 hash of content to use as version identifier
const calculateContentHash = (content: string): string => {
  return createHash('md5').update(content).digest('hex');
};

export const getAssistantResponse = async ({
  inspiration,
  assistantName = 'Victor', // Default to Victor (character inspiration)
}: GetAssistantResponseParams) => {
  const fallbackResponse = {
    result:
      "Sorry, I am dealing with a technical issue at the moment. Please make sure the OpenAI API key is properly configured.",
  };
  
  if (!envConfig.openai.apiKey) {
    console.error("OpenAI API key is not configured");
    return fallbackResponse;
  }

  // Ensure the requested assistant exists
  if (!ASSISTANTS[assistantName]) {
    console.error(`Assistant "${assistantName}" not found`);
    return {
      result: `Assistant "${assistantName}" not found. Available assistants: ${Object.keys(ASSISTANTS).join(', ')}`,
    };
  }

  const assistantConfig = ASSISTANTS[assistantName];

  if (inspiration) {
    try {
      // Initialize OpenAI with API key
      const llm = new OpenAI({ 
        model: "gpt-4o-mini",
        apiKey: envConfig.openai.apiKey 
      });

      // Initialize OpenAI embeddings
      const embedModel = new OpenAIEmbedding({
        model: "text-embedding-3-small",
        apiKey: envConfig.openai.apiKey
      });

      // Initialize PostgreSQL vector store with assistant-specific table
      const vectorStore = new PGVectorStore({
        clientConfig: {
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false
          }
        },
        tableName: assistantConfig.tableName, // Use assistant-specific table
        dimensions: 1536, // OpenAI's embedding dimension
        embedModel // Use the cost-effective embedding model
      });
      
      // Read all files from the assistant's specific folder
      const sourceDir = path.join(__dirname, "../data", assistantConfig.sourceFolder);
      let combinedContent = '';
      
      // Ensure the source directory exists
      try {
        await readdir(sourceDir);
      } catch (error) {
        console.error(`Assistant folder ${sourceDir} not found`);
        return {
          result: `Folder for assistant "${assistantName}" not found. Please create data/${assistantConfig.sourceFolder} folder with your content files.`,
        };
      }
      
      // Read all files in the assistant's directory
      const files = await readdir(sourceDir);
      const mdFiles = files.filter(file => file.endsWith('.md'));
      
      if (mdFiles.length === 0) {
        console.error(`No markdown files found in ${sourceDir}`);
        return {
          result: `No content files found for assistant "${assistantName}". Please add markdown (.md) files to the data/${assistantConfig.sourceFolder} folder.`,
        };
      }
      
      // Read all markdown files and combine their content
      for (const file of mdFiles) {
        try {
          const filePath = path.join(sourceDir, file);
          const content = await readFile(filePath, 'utf-8');
          
          // Add to combined content with section headers matching filename
          combinedContent += `\n# ${file.replace('.md', '')}\n${content}\n`;
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
          // Continue with other files instead of failing completely
        }
      }
      
      if (!combinedContent.trim()) {
        return {
          result: `Could not read any content files for assistant "${assistantName}". Please check the files in data/${assistantConfig.sourceFolder} folder.`,
        };
      }
      
      // Calculate a hash of the content to use as version identifier
      const contentHash = calculateContentHash(combinedContent);
      
      // Create storage context with our vector store
      const storageContext = await storageContextFromDefaults({ vectorStore });
      
      // Create document metadata with version information
      const metadata: DocumentMetadata = {
        source: mdFiles.join("|"),                  // List all source files
        content_hash: contentHash,                  // Store version hash
        updated_at: new Date().toISOString(),       // Store update timestamp
        current_files: files.join("|"),             // Track all files in the directory
        assistant_name: assistantName               // Use name instead of ID
      };
      
      // Create a Document object with the combined text content and metadata
      const document = new Document({ 
        text: combinedContent,
        metadata
      });
      
      console.log(`Creating vector store index for assistant "${assistantName}" with latest content...`);
      
      // Create a VectorStoreIndex from the document using storage context
      const index = await VectorStoreIndex.fromDocuments([document], { storageContext });

      // Create a query engine and get the response using the assistant's prompt template
      const queryEngine = index.asQueryEngine();
      const promptTemplate = assistantConfig.promptTemplate.replace('{query}', inspiration);
      const response = await queryEngine.query({ query: promptTemplate });

      return { result: response.response, forwardToClientEnabled: true };
    } catch (error) {
      console.log("error", error);
      return fallbackResponse;
    }
  } else {
    return fallbackResponse;
  }
}; 