document.addEventListener("DOMContentLoaded", () => {

  // ✅ VIDEO PLAYER FIX
  const player = videojs('mainVideo');

  // ✅ MODAL LOGIC
  const modal = document.getElementById("disclaimerModal");
  const closeBtn = document.getElementById("closeDisclaimer");

  // Show only once per session
  if (sessionStorage.getItem("disclaimerShown") !== "true") {
    modal.classList.add("show");
  }

  // Close button
  closeBtn.addEventListener("click", () => {
    modal.classList.remove("show");
    sessionStorage.setItem("disclaimerShown", "true");
  });

  // Click outside to close
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
      sessionStorage.setItem("disclaimerShown", "true");
    }
  });

  // ✅ FILE INPUT (basic)
  const fileInput = document.getElementById("fileInput");

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      player.src({ type: file.type, src: url });
      player.play();
    }
  });

});