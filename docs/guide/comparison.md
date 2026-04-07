# Multi-Model Comparison

One of Prompt Manager's core features is the ability to compare responses from multiple AI models side-by-side.

## How It Works

1. Select 2 or more AI configurations
2. Enter your prompt
3. Send to all models simultaneously
4. View responses side-by-side with streaming support

## Streaming Mode

The comparison page supports SSE (Server-Sent Events) streaming. Responses from each model appear in real-time as they're generated, so you don't have to wait for all models to finish.

## AI Auto-Rating

After receiving responses, you can use the auto-rating feature to have an AI model evaluate and score each response. The rating considers:

- Relevance to the prompt
- Quality and accuracy of the response
- Completeness and detail

## Supported Providers

Any OpenAI-compatible API endpoint is supported, including:

- OpenAI (GPT-4, GPT-4o, GPT-3.5, etc.)
- Anthropic (via compatible proxy)
- Google Gemini (via compatible proxy)
- DeepSeek
- Groq
- Local models (Ollama, LM Studio, etc.)
- Any other provider with an OpenAI-compatible API

## Saving Comparisons

Comparison results can be saved as conversation sessions for later review. Each session stores:

- The prompt used
- All model responses
- Any ratings or notes
