const socket = io();

const clientLogger = {
    info: (msg) => socket.emit('client_log', { level: 'info', message: msg }),
    warn: (msg) => socket.emit('client_log', { level: 'warn', message: msg }),
    error: (msg) => socket.emit('client_log', { level: 'error', message: msg })
};

// UI Elements
const statusIndicator = document.getElementById('status-indicator');
const setupSection = document.getElementById('setup-section');
const remoteSection = document.getElementById('remote-section');
const pairingSection = document.getElementById('pairing-section');

const ipInput = document.getElementById('tv-ip');
const connectBtn = document.getElementById('btn-connect');
const pairingCodeInput = document.getElementById('pairing-code');
const pairBtn = document.getElementById('btn-pair');
const recentIpsContainer = document.getElementById('recent-ips-container');
const recentIpsList = document.getElementById('recent-ips-list');
const disconnectBtn = document.getElementById('btn-disconnect');

let currentIP = null;

function getRecentIPs() {
    try {
        // Handle migration from single string to array
        const oldStr = localStorage.getItem('saved_tv_ip');
        if (oldStr && !oldStr.startsWith('[')) {
            localStorage.setItem('saved_tv_ips', JSON.stringify([oldStr]));
            localStorage.removeItem('saved_tv_ip');
        }
        return JSON.parse(localStorage.getItem('saved_tv_ips')) || [];
    } catch {
        return [];
    }
}

function saveRecentIP(ip) {
    let ips = getRecentIPs();
    ips = ips.filter(saved => saved !== ip);
    ips.unshift(ip);
    if (ips.length > 3) ips = ips.slice(0, 3);
    localStorage.setItem('saved_tv_ips', JSON.stringify(ips));
    renderRecentIPs();
}

function renderRecentIPs() {
    const ips = getRecentIPs();
    if (ips.length === 0) {
        recentIpsContainer.classList.add('hidden');
        return;
    }
    
    recentIpsContainer.classList.remove('hidden');
    recentIpsList.innerHTML = '';
    
    ips.forEach(ip => {
        const btn = document.createElement('button');
        btn.textContent = ip;
        btn.className = 'recent-btn';
        btn.onclick = () => {
            ipInput.value = ip;
            connectBtn.click();
        };
        recentIpsList.appendChild(btn);
    });
}

// Socket Events
socket.on('connect', () => {
    clientLogger.info('Connected to local server');
});

window.addEventListener('DOMContentLoaded', () => {
    renderRecentIPs();
    const ips = getRecentIPs();
    if (ips.length > 0) {
        ipInput.value = ips[0];
    }
});

socket.on('connected_tvs', (tvs) => {
    if (tvs.length > 0) {
        saveRecentIP(tvs[0]);
        switchToRemote(tvs[0]);
    }
});

socket.on('connect_tv_result', (data) => {
    if (data.status === 'error') {
        clientLogger.error(`Failed to connect to TV at ${data.ip}: ${data.error}`);
        alert('Failed to connect: ' + data.error);
        statusIndicator.innerHTML = '<span class="status-dot"></span> Error';
        statusIndicator.className = 'status error';
    } else if (data.status === 'already_connected' || data.status === 'started') {
        statusIndicator.innerHTML = '<span class="status-dot"></span> Connecting...';
        statusIndicator.className = 'status disconnected';
    }
});

socket.on('tv_needs_pairing', (data) => {
    clientLogger.warn(`TV at ${data.ip} requires pairing`);
    if (data.ip === currentIP) {
        pairingSection.classList.remove('hidden');
        statusIndicator.innerHTML = '<span class="status-dot"></span> Pairing Required';
        statusIndicator.className = 'status error';
    }
});

socket.on('tv_ready', (data) => {
    clientLogger.info(`TV at ${data.ip} is ready`);
    if (data.ip === currentIP || !currentIP) {
        saveRecentIP(data.ip);
        switchToRemote(data.ip);
    }
});

socket.on('tv_error', (data) => {
    clientLogger.error(`TV Error for ${data.ip}: ${data.error}`);
    if (data.ip === currentIP) {
        alert('TV Error: ' + data.error);
        switchToSetup();
    }
});

// User Actions
connectBtn.addEventListener('click', () => {
    const ip = ipInput.value.trim();
    if (!ip) return;
    clientLogger.info(`Initiating connection to TV at ${ip}`);
    currentIP = ip;
    statusIndicator.innerHTML = '<span class="status-dot"></span> Connecting...';
    socket.emit('connect_tv', { ip });
});

pairBtn.addEventListener('click', () => {
    const code = pairingCodeInput.value.trim();
    if (!code || !currentIP) return;
    clientLogger.info(`Sending pairing code to ${currentIP}`);
    socket.emit('send_code', { ip: currentIP, code });
    pairingSection.classList.add('hidden');
});

// Keyboard Support
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!setupSection.classList.contains('hidden')) {
            if (!pairingSection.classList.contains('hidden')) {
                pairBtn.click();
            } else {
                connectBtn.click();
            }
        }
    }
});

ipInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') connectBtn.click();
});

pairingCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') pairBtn.click();
});

if (disconnectBtn) {
    disconnectBtn.addEventListener('click', () => {
        if (currentIP) {
            clientLogger.info(`Disconnected from TV at ${currentIP}`);
            switchToSetup();
        }
    });
}

// Remote Buttons
document.querySelectorAll('[data-key]').forEach(btn => {
    const keyName = btn.getAttribute('data-key');
    
    if (keyName === 'DPAD_CENTER') {
        let holdTimeout;
        let isHolding = false;

        const startHold = (e) => {
            e.preventDefault();
            if (!currentIP) return;
            
            holdTimeout = setTimeout(() => {
                isHolding = true;
                if (navigator.vibrate) navigator.vibrate(40);
                clientLogger.info(`Long press start for ${keyName}`);
                socket.emit('send_key', { ip: currentIP, keyName, direction: "START_LONG" });
            }, 500); // 500ms trigger for long press
        };

        const endHold = (e) => {
            e.preventDefault();
            clearTimeout(holdTimeout);
            if (!currentIP) return;

            if (isHolding) {
                isHolding = false;
                clientLogger.info(`Long press end for ${keyName}`);
                socket.emit('send_key', { ip: currentIP, keyName, direction: "END_LONG" });
            } else if (e.type === 'mouseup' || e.type === 'touchend') {
                if (navigator.vibrate) navigator.vibrate(40);
                clientLogger.info(`Sending key ${keyName} to ${currentIP}`);
                socket.emit('send_key', { ip: currentIP, keyName, direction: "SHORT" });
            }
        };

        btn.addEventListener('mousedown', startHold);
        btn.addEventListener('touchstart', startHold, {passive: false});
        btn.addEventListener('mouseup', endHold);
        btn.addEventListener('touchend', endHold, {passive: false});
        btn.addEventListener('mouseleave', (e) => {
            if (isHolding) endHold(e);
            else clearTimeout(holdTimeout);
        });
    } else {
        btn.addEventListener('click', () => {
            if (!currentIP) return;
            if (navigator.vibrate) navigator.vibrate(40);
            clientLogger.info(`Sending key ${keyName} to ${currentIP}`);
            socket.emit('send_key', { ip: currentIP, keyName, direction: "SHORT" });
        });
    }
});

function switchToRemote(ip) {
    currentIP = ip;
    setupSection.classList.add('hidden');
    remoteSection.classList.remove('hidden');
    statusIndicator.innerHTML = '<span class="status-dot"></span> Connected: ' + ip;
    statusIndicator.className = 'status connected';
}

function switchToSetup() {
    currentIP = null;
    setupSection.classList.remove('hidden');
    remoteSection.classList.add('hidden');
    pairingSection.classList.add('hidden');
    statusIndicator.innerHTML = '<span class="status-dot"></span> Disconnected';
    statusIndicator.className = 'status disconnected';
}
