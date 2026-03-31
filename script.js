document.addEventListener('DOMContentLoaded', () => {
    // 1. Player Initialization with explicit UI components
    const player = videojs('lumen-player', {
        fluid: true,
        responsive: true,
        playbackRates: [0.5, 1, 1.5, 2],
        controlBar: {
            children: [
                'playToggle',
                'volumePanel',
                'currentTimeDisplay',
                'timeDivider',
                'durationDisplay',
                'progressControl',
                'liveDisplay',
                'remainingTimeDisplay',
                'playbackRateMenuButton',
                'fullscreenToggle',
            ],
        },
    });

    const playlistUl = document.getElementById('playlist');
    const fileInput = document.getElementById('fileInput');
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('togglePlaylist');
    
    let playlist = [];
    let currentIndex = -1;

    // 2. Help Modal
    document.getElementById('helpBtn').onclick = () => document.getElementById('helpModal').style.display = 'flex';
    document.getElementById('closeHelp').onclick = () => document.getElementById('helpModal').style.display = 'none';

    // 3. Playlist Toggle
    toggleBtn.onclick = () => {
        sidebar.classList.toggle('is-hidden');
        setTimeout(() => player.trigger('resize'), 200);
    };

    // 4. Playback Logic
    function loadVideo(index) {
        if (index < 0 || index >= playlist.length) return;
        currentIndex = index;
        const item = playlist[index];
        
        player.src({ type: item.type, src: item.url });
        renderPlaylist(); // Update active class
        
        player.ready(() => {
            player.play().catch(() => console.log("Interaction required"));
        });
    }

    // Global removal function
    window.deleteItem = function(index, event) {
        event.stopPropagation();
        playlist.splice(index, 1);
        if (currentIndex === index) {
            player.pause();
            player.src('');
            currentIndex = -1;
        } else if (currentIndex > index) {
            currentIndex--;
        }
        renderPlaylist();
    };

    function renderPlaylist() {
        playlistUl.innerHTML = '';
        playlist.forEach((item, i) => {
            const li = document.createElement('li');
            li.className = `playlist-item ${i === currentIndex ? 'active' : ''}`;
            li.innerHTML = `
                <span class="item-name">${item.name}</span>
                <button class="remove-btn" onclick="window.deleteItem(${i}, event)">&times;</button>
            `;
            li.onclick = () => loadVideo(i);
            playlistUl.appendChild(li);
        });
    }

    function addMedia(name, url, type) {
        playlist.push({ name, url, type });
        renderPlaylist();
        if (playlist.length === 1 && currentIndex === -1) loadVideo(0);
    }

    // 5. Input Handlers
    fileInput.onchange = (e) => {
        Array.from(e.target.files).forEach(file => {
            addMedia(file.name, URL.createObjectURL(file), file.type);
        });
    };

    document.getElementById('loadRemote').onclick = () => {
        const url = document.getElementById('remoteUrl').value.trim();
        if (url) {
            const name = url.split('/').pop().split('?')[0] || 'Remote Stream';
            const type = url.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4';
            addMedia(name, url, type);
            document.getElementById('remoteUrl').value = '';
        }
    };

    player.on('ended', () => {
        if (currentIndex < playlist.length - 1) loadVideo(currentIndex + 1);
    });

    // 6. Mobile Gestures
    let lastTap = 0;
    player.on('touchend', (e) => {
        const now = Date.now();
        if (now - lastTap < 300) {
            const rect = player.el().getBoundingClientRect();
            const x = (e.changedTouches[0].clientX - rect.left) / rect.width;
            x > 0.5 ? player.currentTime(player.currentTime() + 10) : player.currentTime(player.currentTime() - 10);
        }
        lastTap = now;
    });

    // PWA Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
});