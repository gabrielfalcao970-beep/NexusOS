const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const displayNameInput = document.getElementById('display-name');
const shareLocaleInput = document.getElementById('share-locale');
const voiceEnabledInput = document.getElementById('voice-enabled');
const welcomeBlock = document.getElementById('welcome-block');

chatForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    sendMessage();
});

document.querySelectorAll('.suggestion').forEach((button) => {
    button.addEventListener('click', () => {
        if (!userInput) return;
        userInput.value = button.dataset.prompt || '';
        userInput.focus();
        resizeInput();
    });
});

document.getElementById('new-chat-btn')?.addEventListener('click', resetChat);
document.getElementById('clear-chat-btn')?.addEventListener('click', resetChat);

userInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        chatForm?.requestSubmit();
    }
});
userInput?.addEventListener('input', resizeInput);

async function sendMessage() {
    const text = userInput?.value.trim();
    if (!text || !sendBtn) return;

    welcomeBlock?.classList.add('is-hidden');
    appendMessage(text, 'user-message');
    userInput.value = '';
    resizeInput();
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span>Gerando</span><span class="button-spinner" aria-hidden="true"></span>';
    const loadingId = appendMessage('Estou pensando...', 'ai-message', false);

    const profile = {};
    const displayName = displayNameInput?.value.trim();
    if (displayName) profile.name = displayName.slice(0, 80);

    // Idioma e fuso são lidos e enviados somente após consentimento explícito.
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
        if (!response.ok) throw new Error(data.error || `Erro do servidor (${response.status}).`);

        removeMessage(loadingId);
        appendMessage(data.reply || 'Não recebi uma resposta válida do servidor.', 'ai-message', true);
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        removeMessage(loadingId);
        appendMessage(error.message || 'Não foi possível conectar ao servidor. Tente novamente.', 'ai-message', false);
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<span>Enviar</span><span class="send-arrow" aria-hidden="true">↑</span>';
        userInput?.focus();
    }
}

function appendMessage(text, className, canSpeak = false) {
    if (!chatMessages) return null;

    const messageElement = document.createElement('article');
    messageElement.className = `message ${className}`;
    messageElement.id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const avatar = document.createElement('span');
    avatar.className = `message-avatar ${className === 'ai-message' ? 'assistant-avatar' : 'user-avatar'}`;
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = className === 'ai-message' ? '✦' : 'Você';

    const body = document.createElement('div');
    body.className = 'message-body';
    const label = document.createElement('span');
    label.className = 'message-label';
    label.textContent = className === 'ai-message' ? 'NEXUS' : 'VOCÊ';
    const content = document.createElement('p');
    content.className = 'message-content';
    content.textContent = String(text);
    body.append(label, content);

    messageElement.append(avatar, body);
    if (canSpeak && 'speechSynthesis' in window) {
        const speakButton = document.createElement('button');
        speakButton.className = 'speak-button';
        speakButton.type = 'button';
        speakButton.setAttribute('aria-label', 'Ouvir resposta do Nexus');
        speakButton.title = 'Ouvir resposta';
        speakButton.textContent = '♫';
        speakButton.addEventListener('click', () => speakText(String(text)));
        messageElement.appendChild(speakButton);
        if (voiceEnabledInput?.checked) speakText(String(text));
    }

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageElement.id;
}

function speakText(text) {
    if (!('speechSynthesis' in window)) {
        appendMessage('Este navegador não oferece síntese de voz.', 'ai-message', false);
        return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang?.toLowerCase().startsWith('pt-br'))
        || voices.find((voice) => voice.lang?.toLowerCase().startsWith('pt'))
        || null;
    window.speechSynthesis.speak(utterance);
}

function resizeInput() {
    if (!userInput) return;
    userInput.style.height = 'auto';
    userInput.style.height = `${Math.min(userInput.scrollHeight, 160)}px`;
}

function removeMessage(id) {
    if (id) document.getElementById(id)?.remove();
}

function resetChat() {
    window.speechSynthesis?.cancel();
    if (chatMessages) chatMessages.replaceChildren();
    welcomeBlock?.classList.remove('is-hidden');
    userInput?.focus();
}
