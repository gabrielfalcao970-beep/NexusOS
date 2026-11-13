const firebaseConfig = {
    apiKey: "AIzaSyDV-cUoW9nC6LZrXkHyTa8GBnphFK32DSI",
    authDomain: "nexusos-96d4d.firebaseapp.com",
    projectId: "nexusos-96d4d",
    storageBucket: "nexusos-96d4d.firebasestorage.app",
    messagingSenderId: "801996261517",
    appId: "1:801996261517:web:b40ccea858e18a4b997ac4"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase && firebase.auth ? firebase.auth() : null;
const googleProvider = auth ? new firebase.auth.GoogleAuthProvider() : null;

const authScreen = document.getElementById('auth-screen');
const desktopScreen = document.getElementById('desktop-screen');
const googleLoginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const telemetryDisplay = document.getElementById('telemetry-display');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let currentUser = null;
let userLocation = 'Localização não obtida';

if (googleLoginBtn && auth && googleProvider) {
    googleLoginBtn.addEventListener('click', () => {
        auth.signInWithRedirect(googleProvider).catch((error) => {
            console.error('Erro no login:', error);
            appendMessage('Não foi possível iniciar o login com o Google.', 'ai-message');
        });
    });
}

if (logoutBtn && auth) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().catch((error) => {
            console.error('Erro no logout:', error);
        });
    });
}

if (auth) {
    auth.getRedirectResult().catch((error) => {
        console.error('Erro no redirect:', error);
    });

    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            if (authScreen) authScreen.classList.add('hidden');
            if (desktopScreen) desktopScreen.classList.remove('hidden');
            if (userAvatar) userAvatar.src = user.photoURL || 'https://via.placeholder.com/35';
            if (userName) userName.textContent = user.displayName || 'Usuário';
            gatherTelemetry();
        } else {
            currentUser = null;
            if (desktopScreen) desktopScreen.classList.add('hidden');
            if (authScreen) authScreen.classList.remove('hidden');
        }
    });
} else if (authScreen) {
    appendMessage('O serviço de autenticação não carregou. Atualize a página ou tente novamente mais tarde.', 'ai-message');
}

function gatherTelemetry() {
    const platform = navigator.platform || 'Desconhecida';
    const cores = navigator.hardwareConcurrency || 'N/D';
    const memory = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'N/D';
    const baseTelemetry = `SO: ${platform} | Núcleos: ${cores} | RAM aprox: ${memory}`;

    if (telemetryDisplay) telemetryDisplay.textContent = baseTelemetry;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            userLocation = `Lat: ${position.coords.latitude.toFixed(2)}, Lon: ${position.coords.longitude.toFixed(2)}`;
            if (telemetryDisplay) telemetryDisplay.textContent = `${baseTelemetry} | Loc: ${userLocation}`;
        }, () => {
            userLocation = 'Localização não autorizada';
        });
    }
}

if (sendBtn) sendBtn.addEventListener('click', sendMessage);
if (userInput) {
    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') sendMessage();
    });
}

async function sendMessage() {
    if (!currentUser) {
        appendMessage('Você precisa fazer login antes de usar o NexusOS.', 'ai-message');
        return;
    }

    const text = userInput?.value.trim();
    if (!text) return;

    appendMessage(text, 'user-message');
    userInput.value = '';
    if (sendBtn) sendBtn.disabled = true;
    const loadingId = appendMessage('Processando...', 'ai-message');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                user: { name: currentUser.displayName, email: currentUser.email },
                telemetry: { platform: navigator.platform, location: userLocation }
            })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }

        removeMessage(loadingId);
        appendMessage(data.reply || 'O servidor não retornou uma resposta.', 'ai-message');
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        removeMessage(loadingId);
        appendMessage(error.message || 'Erro de conexão com o backend.', 'ai-message');
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        if (userInput) userInput.focus();
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
    if (!id) return;
    document.getElementById(id)?.remove();
}
