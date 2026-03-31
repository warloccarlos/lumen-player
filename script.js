/**
 * LUMEN MEDIA PLAYER - Core Script
 * Privacy-Focused, PWA-Ready, Mobile-Optimized
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Initialize Video.js Player ---
    const player = videojs('lumen-player', {
        fluid: true,
        playbackRates: [0.5, 1, 1.5, 2],
        controlBar: {
            children: [
                'playToggle',
                'volumePanel',
                'currentTimeDisplay',
                'timeDivider',
                'durationDisplay',
                'progressControl',
                'remainingTimeDisplay',
                'playbackRateMenuButton',
                'subsCapsButton',
                'fullscreenToggle',
            ],
        },
    });

    // --- 2. Element Selectors ---
    const playlistElement = document.getElementById('playlist');
    const fileInput = document.getElementById('fileInput');
    const remoteUrlInput = document.getElementById('remoteUrl');
    const loadRemoteBtn = document.getElementById('loadRemote');
    const togglePlaylistBtn = document.getElementById('togglePlaylist');
    const sidebar = document.querySelector('.playlist');
    
    // Modals
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const closeHelp = document.getElementById('closeHelp');
    const disclaimerModal = document.getElementById('disclaimerModal');
    const closeDisclaimer = document.getElementById('closeDisclaimer');

    let playlist = [];
    let currentIndex = -1;

    // --- 3. Modal & UI Logic ---

    // 1. Define the function GLOBALLY (outside any {} blocks)
window.dismissLumenModal = function() {
    const modal = document.getElementById('disclaimerModal');
    if (modal) {
        modal.style.setProperty('display', 'none', 'important');
        sessionStorage.setItem('disclaimerShown', 'true');
        console.log("Lumen: Modal dismissed via global function.");
    }
};

// 2. Handle the loading logic inside the listener
document.addEventListener('DOMContentLoaded', () => {
    const disclaimerModal = document.getElementById('disclaimerModal');
    
    // Auto-hide if already seen
    if (sessionStorage.getItem('disclaimerShown') === 'true') {
        disclaimerModal.style.display = 'none';
    } else {
        disclaimerModal.style.setProperty('display', 'flex', 'important');
    }
    
    // Emergency: Close if clicking the background overlay itself
    disclaimerModal.addEventListener('click', (e) => {
        if (e.target.id === 'disclaimerModal') {
            window.dismissLumenModal();
        }
    });
});

window.addEventListener("load", () => {
  const modal = document.getElementById("disclaimerModal");
  const closeBtn = document.getElementById("closeDisclaimer");

  // show modal on load
  modal.style.display = "flex";

  // close modal on button click
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });
});

    // --- 4. Core Playback Functions ---

    function loadVideo(index) {
        if (index < 0 || index >= playlist.length) return;
        
        currentIndex = index;
        const item = playlist[index];

        // Update active state in UI
        document.querySelectorAll('.playlist-item').forEach((el, i) => {
            el.classList.toggle('active', i === index);
        });

        player.src({ type: item.type, src: item.url });
        player.play().catch(error => console.log("Auto-play prevented or failed:", error));
    }

    function addToPlaylist(name, url, type) {
        const item = { name, url, type };
        playlist.push(item);

        const li = document.createElement('li');
        li.className = 'playlist-item';
        li.innerHTML = `
            <span class="item-name">${name}</span>
            <button class="remove-btn">&times;</button>
        `;

        const index = playlist.length - 1;
        li.onclick = (e) => {
            if (e.target.classList.contains('remove-btn')) {
                playlist.splice(index, 1);
                li.remove();
            } else {
                loadVideo(index);
            }
        };

        playlistElement.appendChild(li);
        if (playlist.length === 1) loadVideo(0);
    }

    // --- 5. Input Handlers ---

    // Local Files
    fileInput.onchange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const url = URL.createObjectURL(file);
            addToPlaylist(file.name, url, file.type);
        });
    };

    // Remote URLs
    loadRemoteBtn.onclick = () => {
        const url = remoteUrlInput.value.trim();
        if (url) {
            let type = 'video/mp4';
            if (url.includes('.m3u8')) type = 'application/x-mpegURL';
            if (url.includes('.mpd')) type = 'application/dash+xml';
            
            const name = url.split('/').pop().split('?')[0] || 'Remote Stream';
            addToPlaylist(name, url, type);
            remoteUrlInput.value = '';
        }
    };

    // Auto-advance to next video
    player.on('ended', () => {
        if (currentIndex < playlist.length - 1) {
            loadVideo(currentIndex + 1);
        }
    });

    // --- 6. Mobile & Touch Gestures ---

    let lastTap = 0;
    const playerContainer = document.getElementById('lumen-player');

    playerContainer.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 300 && tapLength > 0) {
            e.preventDefault();
            const rect = playerContainer.getBoundingClientRect();
            const x = e.changedTouches[0].clientX - rect.left;
            
            if (x > rect.width / 2) {
                player.currentTime(player.currentTime() + 10);
                showFeedback('>> 10s');
            } else {
                player.currentTime(player.currentTime() - 10);
                showFeedback('<< 10s');
            }
        }
        lastTap = currentTime;
    });

    function showFeedback(text) {
        const feedback = document.createElement('div');
        feedback.className = 'touch-feedback';
        feedback.innerText = text;
        playerContainer.appendChild(feedback);
        setTimeout(() => feedback.remove(), 600);
    }

    // --- 7. PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Lumen PWA Live'))
                .catch(err => console.log('PWA Offline Mode unavailable', err));
        });
    }
});