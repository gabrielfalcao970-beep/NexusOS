const firebaseConfig = {
    apiKey: "AIzaSyDV-cUoW9nC6LZrXkHyTa8GBnphFK32DSI",
    authDomain: "nexusos-96d4d.firebaseapp.com",
    projectId: "nexusos-96d4d",
    storageBucket: "nexusos-96d4d.appspot.com",
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
}

if (auth) {
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
}

function gatherTelemetry() {
    const platform = navigator.platform || 'Desconhecida';
    const cores = navigator.hardwareConcurrency || 'N/D';
    const memory = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'N/D';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            userLocation = `Lat: ${position.coords.latitude.toFixed(2)}, Lon: ${position.coords.longitude.toFixed(2)}`;
            if (telemetryDisplay) {
                telemetryDisplay.textContent = `SO: ${platform} | Núcleos: ${cores} | RAM aprox: ${memory} | Loc: ${userLocation}`;
            }
        }, () => {
            if (telemetryDisplay) {
                telemetryDisplay.textContent = `SO: ${platform} | Núcleos: ${cores} | RAM aprox: ${memory}`;
            }
        });
    } else if (telemetryDisplay) {
        telemetryDisplay.textContent = `SO: ${platform} | Núcleos: ${cores} | RAM aprox: ${memory}`;
    }
}

if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
}

if (userInput) {
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

async function sendMessage() {
    if (!currentUser) {
        appendMessage('Você precisa fazer login antes de usar o NexusOS.', 'ai-message');
        return;
    }

    const text = userInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user-message');
    userInput.value = '';

    const loadingId = appendMessage('Processando...', 'ai-message');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                user: {
                    name: currentUser.displayName,
                    email: currentUser.email
                },
                telemetry: {
                    platform: navigator.platform,
                    location: userLocation
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const element = document.getElementById(loadingId);
        if (element) element.remove();

        if (data.reply) {
            appendMessage(data.reply, 'ai-message');
        } else {
            appendMessage('Erro de resposta do servidor.', 'ai-message');
        }
    } catch (err) {
        console.error(err);
        const element = document.getElementById(loadingId);
        if (element) element.remove();
        appendMessage('Erro de conexão com o backend.', 'ai-message');
    }
}

function appendMessage(text, className) {
    if (!chatMessages) return null;

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${className}`;
    msgDiv.textContent = String(text);
    const id = 'msg-' + Date.now();
    msgDiv.id = id;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
}
