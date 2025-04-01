# Vapi Example for Serverless Vercel

Welcome to the Vapi Serverless Vercel sample project. This project demonstrates how you can extend the functionalities of Vapi, an abstraction layer for your personal assistant, to create a unique experience tailored for different use cases. The system has been enhanced with a multi-assistant architecture and vector store management for intelligent content retrieval.

## Project Overview

The project showcases the following features:

- **Multi-Assistant Architecture**: The system supports multiple assistants (like Victor for character inspiration and Roger for lead generation) with isolated vector stores and content.
- **Vector Store Management**: PostgreSQL-based vector storage with automatic content versioning and change detection.
- **Content Organization**: Each assistant has its own folder with markdown files that serve as its knowledge base.
- **Intelligent Embeddings**: Uses cost-effective OpenAI embeddings (text-embedding-3-small) for semantic search.
- **Function Calling**: Writers can invoke custom functions to retrieve character inspirations and generate random names based on specific criteria. For more info [click here](api/functions/README.md)
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

### Adding a New Assistant

To add a new assistant to the system:

1. Update the `ASSISTANTS` object in `functions/getCharacterInspiration.ts`:
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

3. Add markdown files containing the assistant's knowledge base:
   ```bash
   # Example files
   touch data/Marcus/BrandVoice.md
   touch data/Marcus/MarketingTemplates.md
   ```

4. Deploy the updated code to Vercel.

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

### Endpoint

```
POST https://voice-agent-project1-3vhq8w10z-schuttpjs-projects.vercel.app/api/getCharacterInspiration
```

### Authentication

All requests require a secret token in the header:

```
X-Vapi-Signature: your-secret-token
```

The token is set via the `API_SECRET` environment variable.

### Request Format

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
  "forwardToClientEnabled": true
}
```

## Folder Structure

```
├── api/
│   ├── getCharacterInspiration.ts  // API endpoint for assistant requests
│   ├── functions/                  // Function calling handlers
│   ├── custom-llm/                 // Custom LLM integrations
│   └── webhook/                    // Webhook event handlers
├── data/
│   ├── Victor/                     // Character inspiration assistant content
│   │   ├── Characters.md
│   │   └── Activities.md
│   └── Roger/                      // Lead generation assistant content
│       └── CompanyProfile.md
├── functions/
│   └── getCharacterInspiration.ts  // Core assistant logic
└── config/
    └── env.config.ts               // Environment configuration
```

## Features

- **Assistant-Specific Content**: Each assistant has its own knowledge base stored in markdown files.
- **Dynamic Content Loading**: The system automatically discovers and processes all markdown files in an assistant's folder.
- **Vector Store Hygiene**: Automatic detection of content changes and updates to vector embeddings.
- **Cost-Effective Embeddings**: Uses OpenAI's text-embedding-3-small model which is 5x cheaper than the default.
- **Content Versioning**: MD5 hashing detects when content has changed and needs to be re-embedded.

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
   https://<domain>/api/getCharacterInspiration
   ```
   
7. Configure your Vapi assistant to include the `assistantName` parameter if you want to use assistants other than Victor.

## Using with Vapi

When setting up your Vapi assistant:

1. Configure the webhook URL to point to your deployed endpoint.
2. Add the secret token to the server configuration:

```json
{
  "server": {
    "url": "https://your-vercel-app.vercel.app/api/getCharacterInspiration",
    "secret": "your-api-secret-token-here"
  }
}
```

3. When making function calls, include the `assistantName` parameter if you want to use an assistant other than Victor:

```json
{
  "inspiration": "A detective with a mysterious past",
  "assistantName": "Victor"
}
```

## Conclusion

This project demonstrates a scalable, multi-assistant architecture for building intelligent assistants with Vapi. By following the examples and guidelines provided, developers can create versatile voice assistants that cater to multiple use cases while maintaining clean separation of concerns.

For additional help and documentation, refer to the official [Vapi documentation](https://docs.vapi.ai).
