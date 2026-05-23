import Groq from "groq-sdk";
import dotenv from "dotenv";
import { tavily } from "@tavily/core";
import NodeCache from "node-cache";
import SYSTEM_PROMPT from "./systemPrompt.js";

// Load environment variables
dotenv.config();

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Store conversation memory
const cache = new NodeCache({ stdTTL: 60 * 60 * 24 }); //  24 Hours

// Main AI response generation function
export async function generate(userMessage, threadId) {
  try {
    const baseMessages = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
    ];

    const messages = [...(cache.get(threadId) ?? baseMessages)];

    if (!userMessage || typeof userMessage !== "string") {
      return "Invalid message.";
    }

    if (!threadId || typeof threadId !== "string") {
      return "Invalid thread.";
    }

    messages.push({ role: "user", content: userMessage });

    // Limit conversation history to reduce token usage
    const MAX_MESSAGES = 20;

    if (messages.length > MAX_MESSAGES) {
      messages.splice(1, messages.length - MAX_MESSAGES);
    }

    // Retry failed AI requests
    const MAX_RETRIES = 9;
    let count = 0;

    while (count < MAX_RETRIES) {
      count++;

      const completion = await groq.chat.completions.create({
        temperature: 0.3,
        max_tokens: 1024,
        model: "llama-3.3-70b-versatile",
        messages: messages,
        tools: [
          {
            type: "function",
            function: {
              name: "webSearch",
              description:
                "Search the latest information and real-time data from the web.",
              parameters: {
                // JSON Schema object
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The query to search for.",
                  },
                },
                required: ["query"],
              },
            },
          },
        ],
        tool_choice: "auto",
      });

      messages.push(completion.choices[0].message);

      const toolCalls = completion.choices[0].message.tool_calls;

      if (!toolCalls) {
        cache.set(threadId, messages);
        return completion.choices[0].message.content;
      }

      // Handle AI tool calls
      for (const tool of toolCalls) {
        const functionName = tool.function.name;
        let parsedArgs;

        // Safely parse tool arguments
        try {
          parsedArgs = JSON.parse(tool.function.arguments);
        } catch (error) {
          parsedArgs = { query: "" };
        }

        if (functionName === "webSearch") {
          const toolResult = await webSearch(parsedArgs);
          messages.push({
            tool_call_id: tool.id,
            role: "tool",
            name: functionName,
            content: toolResult,
          });
        }
      }
    }

    return "I'm sorry, I'm having trouble generating a response right now. Please try again later.";
  } catch (error) {
    console.error("Generate Error:", error);
    return "Something went wrong. Please try again later.";
  }
}

// function for searching latest web results using Tavily

async function webSearch({ query }) {
  try {
    if (!query || typeof query !== "string") {
      return "Invalid search query.";
    }

    const response = await tvly.search(query, { max_results: 3 });
    return JSON.stringify(
      response.results.map((result) => ({
        title: result.title,
        content: result.content,
        url: result.url,
      })),
    );
  } catch (error) {
    console.error("Tavily Error:", error);
    return "Search failed.";
  }
}
