const firebaseConfig = {
    apiKey: "AIzaSyDV-cUoW9nC6LZrXkHyTa8GBnphFK32DSI",
    authDomain: "nexusos-96d4d.firebaseapp.com",
    projectId: "nexusos-96d4d",
    storageBucket: "nexusos-96d4d.appspot.com",
    messagingSenderId: "801996261517",
    appId: "1:801996261517:web:b40ccea858e18a4b997ac4"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

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

googleLoginBtn.addEventListener('click', () => {
    auth.signInWithPopup(googleProvider).catch((error) => {
        console.error("Erro no login:", error);
    });
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        authScreen.classList.add('hidden');
        desktopScreen.classList.remove('hidden');
        userAvatar.src = user.photoURL || 'https://via.placeholder.com/35';
        userName.textContent = user.displayName || 'Usuário';
        gatherTelemetry();
    } else {
        currentUser = null;
        desktopScreen.classList.add('hidden');
        authScreen.classList.remove('hidden');
    }
});

function gatherTelemetry() {
    const platform = navigator.platform || 'Desconhecida';
    const cores = navigator.hardwareConcurrency || 'N/D';
    const memory = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'N/D';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            userLocation = `Lat: ${position.coords.latitude.toFixed(2)}, Lon: ${position.coords.longitude.toFixed(2)}`;
            telemetryDisplay.textContent = `SO: ${platform} | Núcleos: ${cores} | RAM aprox: ${memory} | Loc: ${userLocation}`;
        }, () => {
            telemetryDisplay.textContent = `SO: ${platform} | Núcleos: ${cores} | RAM aprox: ${memory}`;
        });
    } else {
        telemetryDisplay.textContent = `SO: ${platform} | Núcleos: ${cores} | RAM aprox: ${memory}`;
    }
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

async function sendMessage() {
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

        const data = await response.json();
        document.getElementById(loadingId).remove();

        if (data.reply) {
            appendMessage(data.reply, 'ai-message');
        } else {
            appendMessage('Erro de resposta do servidor.', 'ai-message');
        }
    } catch (err) {
        console.error(err);
        document.getElementById(loadingId).remove();
        appendMessage('Erro de conexão com o backend.', 'ai-message');
    }
}

function appendMessage(text, className) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${className}`;
    msgDiv.textContent = text;
    const id = 'msg-' + Date.now();
    msgDiv.id = id;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
}
