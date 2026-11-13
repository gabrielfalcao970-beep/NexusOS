const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

chatForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    sendMessage();
});

async function sendMessage() {
    const text = userInput?.value.trim();
    if (!text || !sendBtn) return;

    appendMessage(text, 'user-message');
    userInput.value = '';
    sendBtn.disabled = true;
    sendBtn.textContent = 'Enviando...';
    const loadingId = appendMessage('Pensando...', 'ai-message');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || `Erro do servidor (${response.status}).`);
        }

        removeMessage(loadingId);
        appendMessage(data.reply || 'Não recebi uma resposta válida do servidor.', 'ai-message');
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        removeMessage(loadingId);
        appendMessage(error.message || 'Não foi possível conectar ao servidor. Tente novamente.', 'ai-message');
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Enviar';
        userInput?.focus();
    }
}

function appendMessage(text, className) {
    if (!chatMessages) return null;

    const messageElement = document.createElement('div');
    messageElement.className = `message ${className}`;
    messageElement.textContent = String(text);
    messageElement.id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageElement.id;
}

function removeMessage(id) {
    if (id) document.getElementById(id)?.remove();
}
