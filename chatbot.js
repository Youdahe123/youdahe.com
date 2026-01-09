// Chatbot functionality
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const suggestedPrompts = document.getElementById('suggestedPrompts');

// Configuration
const API_ENDPOINT = '/api/chat.js'; // Call our backend instead of OpenAI directly

// Store conversation history
let conversationHistory = [];

// Add message to chat
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typing-indicator';

    const indicatorDiv = document.createElement('div');
    indicatorDiv.className = 'typing-indicator';
    indicatorDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;

    typingDiv.appendChild(indicatorDiv);
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Send message to AI
async function sendMessageToAI(userMessage) {
    // Add user message to history
    conversationHistory.push({
        role: 'user',
        content: userMessage
    });

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: conversationHistory
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Add AI response to history
        conversationHistory.push({
            role: 'assistant',
            content: aiResponse
        });

        return aiResponse;
    } catch (error) {
        console.error('Error calling AI API:', error);
        return "oops, something went wrong on my end. mind trying that again?";
    }
}

// Handle sending message
async function handleSendMessage() {
    const message = chatInput.value.trim();

    if (!message) return;

    // Add user message to chat
    addMessage(message, true);
    chatInput.value = '';

    // Hide suggested prompts after first message
    if (suggestedPrompts && conversationHistory.length === 0) {
        suggestedPrompts.style.display = 'none';
    }

    // Disable input while waiting
    chatInput.disabled = true;
    sendButton.disabled = true;

    // Show typing indicator
    showTypingIndicator();

    // Get AI response
    const response = await sendMessageToAI(message);

    // Remove typing indicator
    removeTypingIndicator();

    // Add AI response to chat
    addMessage(response, false);

    // Re-enable input
    chatInput.disabled = false;
    sendButton.disabled = false;
    chatInput.focus();
}

// Event listeners
sendButton.addEventListener('click', handleSendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

// Handle suggested prompts
if (suggestedPrompts) {
    const promptButtons = suggestedPrompts.querySelectorAll('.prompt-chip');
    promptButtons.forEach(button => {
        button.addEventListener('click', () => {
            const prompt = button.getAttribute('data-prompt');
            chatInput.value = prompt;
            chatInput.focus();
            handleSendMessage();
        });
    });
}

// Auto-focus input on page load
chatInput.focus();
