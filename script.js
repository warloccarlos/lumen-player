// 1. Initialize Video.js Player
const player = videojs('mainVideo');

// 2. Select Elements
const fileInput = document.getElementById('fileInput');
const remoteUrlInput = document.getElementById('remoteUrl');
const loadRemoteBtn = document.getElementById('loadRemoteBtn');
const playlistContainer = document.getElementById('playlistItems');
const itemCountDisplay = document.getElementById('itemCount');
const toggleBtn = document.getElementById('togglePlaylist');
const mainContainer = document.querySelector('.main-container');
const playerContainer = document.getElementById('playerContainer');

// New: Clear All button (Assumes id="clearPlaylist" in HTML)
const clearBtn = document.getElementById('clearPlaylist');

let playlist = [];

// 3. Handle Local File Selection
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = ''; 
});

// 4. Handle Remote URL Loading
loadRemoteBtn.onclick = () => {
    const url = remoteUrlInput.value.trim();
    if (url) {
        let type = 'video/mp4'; 
        if (url.includes('.m3u8')) type = 'application/x-mpegURL';
        if (url.includes('.webm')) type = 'video/webm';

        const item = { 
            name: url.split('/').pop().split('?')[0] || 'Remote Stream', 
            url: url, 
            type: type,
            isRemote: true 
        };
        
        playlist.push(item);
        renderPlaylist();
        
        if (playlist.length === 1) loadVideo(0);
        remoteUrlInput.value = '';
    }
};

// 5. Shared File Handler
function handleFiles(files) {
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
        const url = URL.createObjectURL(file);
        playlist.push({ 
            name: file.name, 
            url: url, 
            type: file.type,
            isLocal: true 
        });
    });
    renderPlaylist();
    if (playlist.length > 0 && !player.src()) loadVideo(0);
}

// 6. Render Playlist UI
function renderPlaylist() {
    playlistContainer.innerHTML = ''; 
    itemCountDisplay.innerText = `${playlist.length} Items`;

    playlist.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'playlist-item';
        // Compare URLs to mark the active one
        if (player.currentSrc() === item.url) div.classList.add('active');

        const span = document.createElement('span');
        span.innerText = item.name;
        span.style.flex = "1";
        span.onclick = () => loadVideo(index);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = (e) => {
            e.stopPropagation(); 
            removeItem(index);
        };

        div.appendChild(span);
        div.appendChild(removeBtn);
        playlistContainer.appendChild(div);
    });
}

// 7. Remove Single Item
function removeItem(index) {
    const item = playlist[index];
    if (item.isLocal) URL.revokeObjectURL(item.url);

    const wasPlaying = (player.currentSrc() === item.url);
    playlist.splice(index, 1);
    
    renderPlaylist();

    if (wasPlaying) {
        player.src(''); 
        if (playlist.length > 0) {
            loadVideo(Math.min(index, playlist.length - 1));
        }
    }
}

// 8. Clear All Logic
if (clearBtn) {
    clearBtn.onclick = () => {
        // Clean up all memory blobs
        playlist.forEach(item => {
            if (item.isLocal) URL.revokeObjectURL(item.url);
        });
        playlist = [];
        player.src('');
        renderPlaylist();
    };
}

// 9. Video Loading Logic
function loadVideo(index) {
    const target = playlist[index];
    if (!target) return;

    player.src({ type: target.type, src: target.url });
    player.ready(() => {
        player.play().catch(() => {});
    });

    renderPlaylist(); 
}

// 10. Auto-Advance
player.on('ended', () => {
    const currentSrc = player.currentSrc();
    const currentIndex = playlist.findIndex(item => item.url === currentSrc);
    if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
        loadVideo(currentIndex + 1);
    }
});

// 11. Toggle Sidebar
toggleBtn.onclick = () => {
    mainContainer.classList.toggle('playlist-hidden');
    toggleBtn.innerText = mainContainer.classList.contains('playlist-hidden') ? 'Show Playlist' : 'Hide Playlist';
    setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 500);
};

// 12. Drag and Drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
    playerContainer.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

playerContainer.addEventListener('drop', (e) => {
    handleFiles(e.dataTransfer.files);
});

// 13. Hotkeys
document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT') return; 
    
    if (e.code === 'Space') {
        e.preventDefault();
        player.paused() ? player.play() : player.pause();
    }
    if (e.code === 'KeyF') {
        player.isFullscreen() ? player.exitFullscreen() : player.requestFullscreen();
    }
});

const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const closeHelp = document.getElementById('closeHelp');

helpBtn.onclick = () => helpModal.style.display = 'flex';
closeHelp.onclick = () => helpModal.style.display = 'none';

// Close modal if user clicks outside the content box
window.onclick = (event) => {
    if (event.target == helpModal) {
        helpModal.style.display = 'none';
    }
};

// --- 1. Disclaimer Modal Logic ---
const disclaimerModal = document.getElementById('disclaimerModal');
const closeDisclaimer = document.getElementById('closeDisclaimer');

closeDisclaimer.onclick = () => {
    disclaimerModal.style.display = 'none';
    // Optional: Save to localStorage so it only shows once per session
    sessionStorage.setItem('disclaimerShown', 'true');
};

// Check if already shown this session
if (sessionStorage.getItem('disclaimerShown')) {
    disclaimerModal.style.display = 'none';
}

// --- 2. Mobile Touch Gestures (Double Tap to Seek) ---
let lastTap = 0;
playerContainer.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 300 && tapLength > 0) {
        e.preventDefault();
        const rect = playerContainer.getBoundingClientRect();
        const x = e.changedTouches[0].clientX - rect.left;
        
        if (x > rect.width / 2) {
            // Double tap right side: Skip Forward
            player.currentTime(player.currentTime() + 10);
            showFeedback('>> 10s');
        } else {
            // Double tap left side: Skip Backward
            player.currentTime(player.currentTime() - 10);
            showFeedback('<< 10s');
        }
    }
    lastTap = currentTime;
});

// Visual Feedback for Gestures
function showFeedback(text) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.6); color: white; padding: 10px 20px;
        border-radius: 20px; pointer-events: none; z-index: 10; font-weight: bold;
    `;
    feedback.innerText = text;
    playerContainer.appendChild(feedback);
    setTimeout(() => feedback.remove(), 500);
}