const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const displayNameInput = document.getElementById('display-name');
const shareLocaleInput = document.getElementById('share-locale');

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

    const profile = {};
    const displayName = displayNameInput?.value.trim();
    if (displayName) profile.name = displayName.slice(0, 80);

    // Só acessamos e enviamos os metadados de idioma/fuso após consentimento explícito.
    if (shareLocaleInput?.checked) {
        try {
            profile.language = String(navigator.language || '').slice(0, 35);
            profile.timeZone = String(Intl.DateTimeFormat().resolvedOptions().timeZone || '').slice(0, 80);
        } catch (error) {
            console.warn('Não foi possível obter idioma/fuso horário:', error);
        }
    }

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, profile })
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
