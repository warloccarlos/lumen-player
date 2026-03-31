document.addEventListener('DOMContentLoaded', () => {
    const player = videojs('lumen-player', {
        responsive: true,
        playbackRates: [0.5, 1, 1.5, 2]
    });

    const playlistUl = document.getElementById('playlist');
    const fileInput = document.getElementById('fileInput');
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('togglePlaylist');
    
    let playlist = [];
    let currentIndex = -1;

    // Modals
    document.getElementById('helpBtn').onclick = () => document.getElementById('helpModal').style.display = 'flex';
    document.getElementById('closeHelp').onclick = () => document.getElementById('helpModal').style.display = 'none';

    // Toggle Sidebar
    toggleBtn.onclick = () => {
        sidebar.classList.toggle('is-hidden');
        player.trigger('resize');
    };

    window.deleteItem = function(index, event) {
        event.stopPropagation();
        playlist.splice(index, 1);
        if (currentIndex === index) {
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
                <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</span>
                <button class="remove-btn" onclick="window.deleteItem(${i}, event)">&times;</button>
            `;
            li.onclick = () => loadVideo(i);
            playlistUl.appendChild(li);
        });
    }

    function loadVideo(index) {
        if (index < 0 || index >= playlist.length) return;
        currentIndex = index;
        player.src({ type: playlist[index].type, src: playlist[index].url });
        renderPlaylist();
        player.play().catch(() => {});
    }

    fileInput.onchange = (e) => {
        Array.from(e.target.files).forEach(file => {
            playlist.push({ name: file.name, url: URL.createObjectURL(file), type: file.type });
        });
        renderPlaylist();
        if (playlist.length > 0 && currentIndex === -1) loadVideo(0);
    };

    document.getElementById('loadRemote').onclick = () => {
        const url = document.getElementById('remoteUrl').value.trim();
        if (url) {
            const name = url.split('/').pop().split('?')[0] || 'Remote Stream';
            playlist.push({ name, url, type: url.includes('m3u8') ? 'application/x-mpegURL' : 'video/mp4' });
            renderPlaylist();
            if (playlist.length === 1) loadVideo(0);
            document.getElementById('remoteUrl').value = '';
        }
    };

    player.on('ended', () => {
        if (currentIndex < playlist.length - 1) loadVideo(currentIndex + 1);
    });

    // Mobile double tap seek
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
});