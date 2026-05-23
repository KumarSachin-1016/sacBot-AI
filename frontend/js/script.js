const input = document.querySelector("#userinput");
const chatContainer = document.querySelector("#chat_container");
const askButton = document.querySelector("#ask_button");

input.addEventListener("keyup", handleEnter);
askButton.addEventListener("click", handleAsk);

let threadId = crypto.randomUUID();

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
