const input = document.querySelector("#userinput");
const chatContainer = document.querySelector("#chat_container");
const askButton = document.querySelector("#ask_button");
const voiceButton = document.querySelector("#voice_button");

input.addEventListener("keyup", handleEnter);
askButton.addEventListener("click", handleAsk);

let threadId = crypto.randomUUID();
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

// Scrolling function

function scrollToBottom() {
  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: "smooth",
  });
}

// function for generating messages from LLM

async function generate(text) {
  // Ask Button Disable
  askButton.disabled = true;
  askButton.classList.add("opacity-50", "cursor-not-allowed");

  // Loading Bubble
  const loading = document.createElement("div");

  try {
    // Tailwind classes for bubble
    loading.className = "my-6 bg-neutral-800 p-3 rounded-xl w-fit";

    // Inner dots container
    loading.innerHTML = `
  <div class="flex items-center gap-1">
    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
  </div>
 `;

    // Append user message to chat UI

    const msg = document.createElement("div");
    msg.className = `bg-neutral-800 my-6 p-4 rounded-xl ml-auto max-w-fit`;
    msg.textContent = text;
    chatContainer?.appendChild(msg);
    scrollToBottom();
    input.value = "";

    // Adding Loading Bubble to chat UI

    chatContainer?.appendChild(loading);
    scrollToBottom();

    // Send Message To LLM

    const assistantResponse = await callServer(text);

    // Append assistant message to chat UI

    const assistantMsg = document.createElement("div");
    assistantMsg.className = `max-w-fit`;
    assistantMsg.textContent = assistantResponse;
    chatContainer?.appendChild(assistantMsg);
    scrollToBottom();
  } catch (error) {
    console.error(error);
    const errorMsg = document.createElement("div");
    errorMsg.className = "text-red-400 my-4";
    errorMsg.textContent = "Something went wrong.";
    chatContainer.appendChild(errorMsg);
    scrollToBottom();
  } finally {
    loading.remove();
    askButton.disabled = false;
    askButton.classList.remove("opacity-50", "cursor-not-allowed");
  }
}

// Voice Recording Function

async function startRecording() {
  try {
    // Request microphone permission
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    // Create MediaRecorder
    mediaRecorder = new MediaRecorder(stream);

    audioChunks = [];

    // Collect recorded audio data
    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    });

    // When recording stops
    mediaRecorder.addEventListener("stop", async () => {
      const audioBlob = new Blob(audioChunks, {
        type: mediaRecorder.mimeType,
      });

      // Stop microphone tracks
      stream.getTracks().forEach((track) => track.stop());

      await transcribeAudio(audioBlob);
    });

    // Start recording
    mediaRecorder.start();

    isRecording = true;

    // Change microphone button appearance
    voiceButton.classList.add("bg-red-600");
    voiceButton.innerHTML = '<i class="fa-solid fa-stop"></i>';
  } catch (error) {
    console.error("Microphone Error:", error);
    alert("Please allow microphone access.");
  }
}

// Stop Recording Function

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();

    isRecording = false;

    voiceButton.classList.remove("bg-red-600");
    voiceButton.innerHTML = '<i class="fa-solid fa-microphone"></i>';
  }
}

// Voice Button Click

voiceButton.addEventListener("click", () => {
  if (!isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
});

// Send Audio to Backend for Transcription

async function transcribeAudio(audioBlob) {
  try {
    voiceButton.disabled = true;

    const formData = new FormData();

    formData.append("audio", audioBlob, "recording.webm");

    const response = await fetch("https://sacbot-ai.onrender.com/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Transcription failed");
    }

    const result = await response.json();

    console.log("Transcribed Text:", result.text);

    if (result.text.trim()) {
      await generate(result.text);
    }
  } catch (error) {
    console.error("Voice Error:", error);
    alert("Could not process your voice. Please try again.");
  } finally {
    voiceButton.disabled = false;
  }
}

// Function for calling server

async function callServer(inputText) {
  const response = await fetch("https://sacbot-ai.onrender.com/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ threadId: threadId, message: inputText }),
  });

  if (!response.ok) {
    throw new Error("Error calling server");
  }

  const result = await response.json();
  return result.assistantMessage;
}

// function for Ask button

async function handleAsk() {
  const text = input.value;
  if (!text.trim()) return;
  await generate(text);
}

// function for Enter key

async function handleEnter(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    const text = input.value;
    if (!text.trim()) return;
    await generate(text);
  }
}
