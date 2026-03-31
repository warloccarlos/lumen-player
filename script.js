document.addEventListener('DOMContentLoaded', () => {
    // Initialize Player
    const player = videojs('lumen-player', {
        responsive: true,
        fluid: false, // Turned off fluid because we are using the ratio-keeper hack
        playbackRates: [0.5, 1, 1.5, 2]
    });

    const playlistUl = document.getElementById('playlist');
    const fileInput = document.getElementById('fileInput');
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('togglePlaylist');
    
    let playlist = [];
    let currentIndex = -1;

    // Toggle Playlist
    toggleBtn.onclick = () => {
        sidebar.classList.toggle('is-hidden');
        player.trigger('resize');
    };

    window.removeVideo = (index, e) => {
        e.stopPropagation();
        playlist.splice(index, 1);
        renderPlaylist();
        if (currentIndex === index) player.src('');
    };

    function renderPlaylist() {
        playlistUl.innerHTML = '';
        playlist.forEach((video, i) => {
            const li = document.createElement('li');
            li.className = `playlist-item ${i === currentIndex ? 'active' : ''}`;
            li.innerHTML = `
                <span style="overflow:hidden; text-overflow:ellipsis;">${video.name}</span>
                <button onclick="window.removeVideo(${i}, event)" style="background:none; border:none; color:gray; cursor:pointer;">&times;</button>
            `;
            li.onclick = () => {
                currentIndex = i;
                player.src({ type: video.type, src: video.url });
                player.play();
                renderPlaylist();
            };
            playlistUl.appendChild(li);
        });
    }

    fileInput.onchange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            playlist.push({
                name: file.name,
                url: URL.createObjectURL(file),
                type: file.type
            });
        });
        renderPlaylist();
        if (currentIndex === -1 && playlist.length > 0) {
            currentIndex = 0;
            player.src({ type: playlist[0].type, src: playlist[0].url });
        }
    };

    document.getElementById('loadRemote').onclick = () => {
        const url = document.getElementById('remoteUrl').value.trim();
        if (url) {
            playlist.push({
                name: url.split('/').pop() || "Remote Stream",
                url: url,
                type: url.includes('m3u8') ? 'application/x-mpegURL' : 'video/mp4'
            });
            renderPlaylist();
            document.getElementById('remoteUrl').value = '';
        }
    };
});