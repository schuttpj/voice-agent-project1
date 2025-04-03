# Vapi Example for Serverless Vercel

Welcome to the Vapi Serverless Vercel sample project. This project demonstrates how you can extend the functionalities of Vapi, an abstraction layer for your personal assistant, to create a unique experience tailored for different use cases. The system has been enhanced with a multi-assistant architecture and vector store management for intelligent content retrieval.

## Project Overview

The project showcases the following features:

- **Multi-Assistant Architecture**: The system supports multiple assistants (like Victor for character inspiration and Roger for lead generation) with isolated vector stores and content.
- **Dynamic Assistant Templates**: Modular system for defining and loading assistant configurations from separate files.
- **Multiple Calling Methods**: Support for both Vapi assistant ID and inline configuration approaches.
- **Vector Store Management**: PostgreSQL-based vector storage with automatic content versioning and change detection.
- **Content Organization**: Each assistant has its own folder with markdown files that serve as its knowledge base.
- **Intelligent Embeddings**: Uses cost-effective OpenAI embeddings (text-embedding-3-small) for semantic search.
- **Function Calling**: Writers can invoke custom functions to retrieve assistant responses based on specific criteria.
- **Custom Large Language Model (LLM) Integration**: Enhance conversational capabilities by integrating custom LLMs with Vapi for nuanced and context-aware interactions. For more info [click here](api/custom-llm/README.md)
- **Server URL Events**: Handle various events during a call's lifecycle, such as function calls and assistant requests, to provide dynamic responses. For more info [click here](api/webhook/README.md)

## Multi-Assistant Architecture

### Currently Available Assistants

The system has two assistants pre-configured:

1. **Victor** - Character Inspiration Assistant
   - Located in: `data/Victor/`
   - Files: `Characters.md`, `Activities.md`
   - Purpose: Helps authors develop character ideas and storylines

2. **Roger** - Lead Generation Assistant
   - Located in: `data/Roger/`
   - Files: `CompanyProfile.md`
   - Purpose: Generates leads and responses based on company information

### Assistant Configuration Templates

The project now includes a modular template system for assistant configurations:

```
assistants-templates/
├── common/
│   └── server-config.json         # Shared server settings (URLs, API keys)
├── Roger/
│   ├── button-config.json         # Button styling 
│   ├── functions-config.json      # Function definitions
│   ├── metadata.json              # Name, description, etc.
│   ├── model-config.json          # Model settings and system prompts
│   └── voice-config.json          # Voice settings and messages
└── assistants-list.json           # Registry of all available assistants
```

### Assistant Calling Methods

This project supports two different ways to call Vapi assistants:

1. **Assistant ID Method**:
   - Uses a pre-created assistant in the Vapi dashboard
   - Configuration is stored on Vapi's servers
   - Access via: `/api/serve-html`

2. **Inline Configuration Method**:
   - Dynamic configuration sent with each request
   - Greater flexibility and client-side control
   - Two implementation options:
     - **Static Inline Config**: Fixed configuration in `/api/inlineRoger`
     - **Dynamic Template-Based**: Configurable assistants in `/api/inlineAssistant`

### Adding a New Assistant

#### For Vector Store Assistants:

1. Update the `ASSISTANTS` object in `functions/getAssistantResponse.ts`:
   ```typescript
   'Marcus': {   // Marketing content assistant
     name: 'Marcus',
     tableName: 'marcus_embeddings',
     sourceFolder: 'Marcus',
     promptTemplate: 'Create marketing content based on: "{query}". Use my company voice and style.'
   }
   ```

2. Create the folder for your assistant's content:
   ```bash
   mkdir -p data/Marcus
   ```

3. Add markdown files containing the assistant's knowledge base.

#### For Dynamic Template-Based Assistants:

1. Create a new folder in `assistants-templates/` with your assistant's name
2. Add the required configuration files:
   ```bash
   mkdir -p assistants-templates/NewAssistant
   touch assistants-templates/NewAssistant/button-config.json
   touch assistants-templates/NewAssistant/functions-config.json
   touch assistants-templates/NewAssistant/metadata.json
   touch assistants-templates/NewAssistant/model-config.json
   touch assistants-templates/NewAssistant/voice-config.json
   ```
3. Add your assistant to the list in `assistants-templates/assistants-list.json`
4. No code changes are required!

### Vector Store Management

The system implements advanced vector store management:

1. **Content Versioning**: MD5 hash-based content tracking detects when files have changed.
2. **Assistant Isolation**: Each assistant has its own PostgreSQL table for vectors.
3. **Metadata Tagging**: All vectors are tagged with assistant name, content hash, timestamps, etc.
4. **File Change Detection**: The system tracks which files exist in each assistant's folder.

This architecture ensures:
- Changes to one assistant don't affect others
- Content updates are detected and embeddings are refreshed
- Each assistant has its own isolated vector space

## API Usage

### Endpoints

```
# Vector store-based assistant responses
POST https://your-vercel-app.vercel.app/api/getAssistantResponse

# HTML interfaces
GET https://your-vercel-app.vercel.app/api/serve-html      # Assistant ID method
GET https://your-vercel-app.vercel.app/api/inlineRoger     # Static inline config
GET https://your-vercel-app.vercel.app/api/inlineAssistant # Dynamic template-based
```

### Authentication

All requests require a secret token in the header:

```
X-Vapi-Signature: your-secret-token
```

The token is set via the `API_SECRET` environment variable.

### Request Format for getAssistantResponse

```json
{
  "inspiration": "Your query or request here",
  "assistantName": "Victor"  // Optional, defaults to "Victor"
}
```

### Response Format

```json
{
  "result": "The assistant's response text",
  "forwardToClientEnabled": true,
  "success": true
}
```

## Folder Structure

```
├── api/
│   ├── getAssistantResponse.ts    // Generic API endpoint for assistant requests
│   ├── serve-html.ts              // Serves HTML for assistant ID method
│   ├── inlineRoger.ts             // Serves HTML for static inline config
│   ├── inlineAssistant.ts         // Serves HTML for dynamic template-based config
│   └── getAssistantTemplates.ts   // API to serve assistant templates
├── assistants-templates/          // Modular assistant configuration templates
│   ├── common/                    // Shared configuration
│   ├── Roger/                     // Example assistant configuration
│   └── assistants-list.json       // Registry of all available assistants
├── data/                          // Content for vector store-based assistants
│   ├── Victor/                    // Character inspiration content
│   └── Roger/                     // Lead generation content
├── functions/
│   └── getAssistantResponse.ts    // Core assistant logic
├── public/                        // Static HTML files
│   ├── index.html                 // Assistant ID method
│   ├── inline-roger.html          // Static inline configuration
│   └── inline-assistant.html      // Dynamic template-based configuration
└── config/
    └── env.config.ts              // Environment configuration
```

## Features

- **Multiple Integration Methods**: Choose between assistant ID or inline configuration based on your needs.
- **Dynamic Assistant Selection**: Load and switch between different assistants at runtime.
- **Assistant-Specific Content**: Each assistant has its own knowledge base stored in markdown files.
- **Modular Configuration**: Split assistant settings into logical components for easier management.
- **Vector Store Hygiene**: Automatic detection of content changes and updates to vector embeddings.
- **Cost-Effective Embeddings**: Uses OpenAI's text-embedding-3-small model which is 5x cheaper than the default.

## Getting Started

To get started with this project:

#### Basic Project Setup

1. Clone the repository to your local machine.
2. Install the dependencies by running `pnpm install`.
3. Setup Vercel using `vercel` command from the root directory. Install vercel cli if you don't have it using `npm i -g vercel`.
4. You can start the project locally using command `pnpm start`
5. You can deploy the project to vercel using command `pnpm deploy:prod`

#### Configuration

1. Create a .env file in your repository using the command `cp example.env .env`
2. Get your `OPENAI_API_KEY` from OpenAI and update the `.env` file.
3. Set up a PostgreSQL database and add its connection URL to `.env` as `DATABASE_URL`.
4. Add your `API_SECRET` for webhook authentication to `.env`.
5. From Vapi dashboard, you can get your Vapi Private key from **Dashboard > Accounts > Vapi Keys > Api Key** and update `.env` file.
6. Set the Server URL in Vapi to your deployed endpoint:
   ```
   https://<domain>/api/getAssistantResponse
   ```
   
7. Configure your Vapi assistant to include the `assistantName` parameter if you want to use assistants other than Victor.

## Using with Vapi

### Assistant ID Method

1. Create an assistant in the Vapi dashboard
2. Use the assistant ID in your HTML:
   ```javascript
   assistant: "d10f09d4-b2d0-4f88-9f6d-527332977cc7"
   ```

### Inline Configuration Method

1. Configure the assistant directly in your code:
   ```javascript
   assistant: {
     model: {
       provider: "openai",
       model: "gpt-4",
       // other configuration...
     },
     voice: {
       // voice configuration...
     }
   }
   ```

2. Include the Vapi signature in headers:
   ```javascript
   headers: {
     "x-vapi-signature": "your-api-secret-token-here"
   }
   ```

## Conclusion

This project demonstrates a scalable, multi-assistant architecture for building intelligent assistants with Vapi. By providing both assistant ID and inline configuration options, developers have flexibility in how they implement Vapi assistants. The modular template system makes it easy to add and manage multiple assistants without code changes.

For additional help and documentation, refer to the official [Vapi documentation](https://docs.vapi.ai).
