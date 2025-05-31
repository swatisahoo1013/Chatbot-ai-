
// Query DOM elements
const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.getElementById("send-message");
const fileInput = document.getElementById("file-input");
const voiceBtn = document.getElementById("voice-input");

// Toggle send button based on input
messageInput.addEventListener("input", () => {
    sendMessageButton.style.display = messageInput.value.trim() ? "block" : "none";
});

// API setup
const API_KEY = "AIzaSyB7KwGXXUcvU8uk0R0ley2h_ZMl0nEt21E";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const userData = {
    message: null,
    file: {
        data: null,
        mime_type: null
    }
};

// Create message element
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// Generate bot response using Gemini API
const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");

    const parts = [{ text: userData.message }];
    if (userData.file.data && userData.file.mime_type) {
        parts.push({
            inline_data: {
                mime_type: userData.file.mime_type,
                data: userData.file.data
            }
        });
    }

    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] })
    };

    try {
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error?.message || "Unknown API error");

        const botText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!botText) throw new Error("No response text from API");

        messageElement.innerText = botText.replace(/\*\*(.*?)\*\*/g, "$1").trim();
    } catch (error) {
        console.error("API Error:", error);
        messageElement.innerText = "Something went wrong. Please try again.";
        messageElement.style.color = "#ff0000";
    } finally {
        incomingMessageDiv.classList.remove("thinking");
        userData.file = { data: null, mime_type: null };
    }
};

// Handle sending message
const handleOutgoingMessage = (e) => {
    e.preventDefault();
    userData.message = messageInput.value.trim();
    if (!userData.message) return;

    messageInput.value = "";
    sendMessageButton.style.display = "none";

    const messageContent = `<div class="message-text">${userData.message}</div>`;
    const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
        const botMessageContent = `
            <svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
                <path d="..."></path>
            </svg>
            <div class="message-text">
                <div class="thinking-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;

        const incomingMessageDiv = createMessageElement(botMessageContent, "bot-message", "thinking");
        chatBody.appendChild(incomingMessageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
        generateBotResponse(incomingMessageDiv);
    }, 600);
};

// Send on Enter
messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleOutgoingMessage(e);
    }
});

// File input with preview
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
reader.onload = (e) => {
    const base64String = e.target.result.split(",")[1];
    userData.file = {
        data: base64String,
        mime_type: file.type
    };

    let messageContent = "";

    if (file.type.startsWith("image/")) {
        messageContent = `
            <div class="message-text">
                📎 Attached: <strong>${file.name}</strong><br>
                <img src="${e.target.result}" alt="${file.name}" class="chat-image-preview">
            </div>
            `;
    } else {
        messageContent = `
            <div class="message-text">
                📎 Attached file: <strong>${file.name}</strong><br>
                <span style="font-size: 0.85rem; color: #888;">${file.type || "Unknown type"}</span>
            </div>
        `;
    }

    const outgoingFileDiv = createMessageElement(messageContent, "user-message");
    chatBody.appendChild(outgoingFileDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    fileInput.value = "";
};
reader.readAsDataURL(file);
});

// Trigger file input on attach click
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());

// Send on button click
sendMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));

// Voice input
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    voiceBtn.addEventListener('click', () => {
    recognition.start();
    voiceBtn.classList.add('listening');
     });

     recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    messageInput.value = transcript;
    sendMessageButton.style.display = messageInput.value.trim() ? "block" : "none";
    };

    recognition.onend = () => {
    voiceBtn.classList.remove('listening');
    };
    recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    voiceBtn.classList.remove('listening');
    };
 
  } else {
    voiceBtn.disabled = true;
    voiceBtn.title = "Speech recognition not supported in this browser.";
}

// Emoji picker
const picker = new EmojiButton({
    position: 'top-start',
    zIndex: 9999
});

const emojiBtn = document.getElementById('emoji-picker-btn');

picker.on('emoji', emoji => {
    messageInput.value += emoji;
    sendMessageButton.style.display = messageInput.value.trim() ? "block" : "none";
});

emojiBtn.addEventListener('click', () => {
    picker.togglePicker(emojiBtn);
});
