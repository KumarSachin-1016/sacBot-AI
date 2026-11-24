import express from "express";
import { generate } from "./llm.js";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import multer from "multer";
import { toFile } from "groq-sdk/uploads";

// Load environment variables
dotenv.config();

const app = express();

// Rate limiter to prevent API abuse and spam requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Configure Multer to store uploaded audio files temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
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

// Voice-to-Text endpoint
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Audio file is required",
      });
    }

    const audioFile = await toFile(
      req.file.buffer,
      req.file.originalname || "audio.webm"
    );

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3-turbo",
      response_format: "json",
      prompt:
        "Transcribe Hindi, English, and Hinglish speech accurately. Preserve the original language and English technical terms.",
    });

    res.json({
      text: transcription.text,
    });
  } catch (error) {
    console.error("Transcription Error:", error);

    res.status(500).json({
      error: "Failed to transcribe audio",
    });
  }
});

// Start Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
