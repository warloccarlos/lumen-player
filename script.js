// GLOBAL: Modal Dismissal
window.dismissLumenModal = function() {
    const modal = document.getElementById('disclaimerModal');
    if (modal) {
        modal.style.setProperty('display', 'none', 'important');
        sessionStorage.setItem('disclaimerShown', 'true');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Player Setup
    const player = videojs('lumen-player', {
        fluid: true,
        playbackRates: [0.5, 1, 1.5, 2]
    });

    const playlistUl = document.getElementById('playlist');
    const fileInput = document.getElementById('fileInput');
    const sidebar = document.querySelector('.playlist');
    const toggleBtn = document.getElementById('togglePlaylist');
    
    let playlist = [];
    let currentIndex = -1;

    // 2. Modal Logic
    if (sessionStorage.getItem('disclaimerShown') === 'true') {
        document.getElementById('disclaimerModal').style.display = 'none';
    }

    document.getElementById('helpBtn').onclick = () => document.getElementById('helpModal').style.display = 'flex';
    document.getElementById('closeHelp').onclick = () => document.getElementById('helpModal').style.display = 'none';

    // 3. Toggle Playlist Logic
    toggleBtn.onclick = () => {
        sidebar.classList.toggle('is-hidden');
        setTimeout(() => player.trigger('resize'), 100);
    };

    // 4. Playback Logic
    function loadVideo(index) {
        if (index < 0 || index >= playlist.length) return;
        currentIndex = index;
        const item = playlist[index];
        
        player.src({ type: item.type, src: item.url });
        
        document.querySelectorAll('.playlist-item').forEach((el, i) => {
            el.classList.toggle('active', i === index);
        });
        
        player.play().catch(() => {});
    }

    function addMedia(name, url, type) {
        const item = { name, url, type };
        playlist.push(item);
        const idx = playlist.length - 1;

        const li = document.createElement('li');
        li.className = 'playlist-item';
        li.innerHTML = `
            <span class="item-name">${name}</span>
            <button class="remove-btn" onclick="event.stopPropagation(); window.removeMedia(${idx})">&times;</button>
        `;
        li.onclick = () => loadVideo(idx);
        playlistUl.appendChild(li);

        if (playlist.length === 1) loadVideo(0);
    }

    // Global helper for deletion to handle index shifts
    window.removeMedia = function(index) {
        playlist.splice(index, 1);
        renderPlaylist();
        if (currentIndex === index) {
            player.pause();
            player.src('');
        }
    };

    function renderPlaylist() {
        playlistUl.innerHTML = '';
        playlist.forEach((item, i) => {
            const li = document.createElement('li');
            li.className = 'playlist-item' + (i === currentIndex ? ' active' : '');
            li.innerHTML = `
                <span class="item-name">${item.name}</span>
                <button class="remove-btn" onclick="event.stopPropagation(); window.removeMedia(${i})">&times;</button>
            `;
            li.onclick = () => loadVideo(i);
            playlistUl.appendChild(li);
        });
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
            const name = url.split('/').pop() || 'Remote Stream';
            addMedia(name, url, url.includes('m3u8') ? 'application/x-mpegURL' : 'video/mp4');
            document.getElementById('remoteUrl').value = '';
        }
    };

    // Auto-next
    player.on('ended', () => {
        if (currentIndex < playlist.length - 1) loadVideo(currentIndex + 1);
    });

    // 6. Mobile Double Tap
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