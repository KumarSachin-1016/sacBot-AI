import express from "express";
import { generate } from "./llm.js";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// Rate limiter to prevent API abuse and spam requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

// Enable CORS for frontend communication
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

const port = process.env.PORT || 3000;

// Main AI chat endpoint
app.post("/chat", async (req, res) => {
  try {
    // Validate Fields
    if (!req.body.message || !req.body.threadId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { message, threadId } = req.body;

    // Generate AI response
    const result = await generate(message, threadId);
    res.json({ assistantMessage: result });
  } catch (error) {
    console.error("Chat Route Error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Start Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
