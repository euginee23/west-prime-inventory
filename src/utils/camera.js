export const openCamera = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      const modal = document.createElement("div");
      Object.assign(modal.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.9)", 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "9999",
        flexDirection: "column",
      });

      const videoContainer = document.createElement("div");
      Object.assign(videoContainer.style, {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "90vw",
        maxWidth: "500px", 
        background: "black",
        borderRadius: "15px",
        padding: "15px",
        position: "relative",
        boxShadow: "0px 4px 20px rgba(255, 255, 255, 0.3)",
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      Object.assign(video.style, {
        width: "100%",
        maxHeight: "65vh",
        objectFit: "cover",
        borderRadius: "10px",
        boxShadow: "0px 0px 15px rgba(255, 255, 255, 0.5)",
      });

      const captureButton = document.createElement("button");
      captureButton.innerHTML = "&#128247;"; 
      Object.assign(captureButton.style, {
        position: "absolute",
        bottom: "-40px",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "18px",
        fontSize: "1.5rem",
        border: "none",
        borderRadius: "50%",
        background: "#28a745",
        color: "white",
        cursor: "pointer",
        boxShadow: "0px 0px 15px rgba(255, 255, 255, 0.5)",
        transition: "background 0.3s, transform 0.1s",
      });

      captureButton.addEventListener("mousedown", () => {
        captureButton.style.transform = "translateX(-50%) scale(0.95)";
      });
      captureButton.addEventListener("mouseup", () => {
        captureButton.style.transform = "translateX(-50%) scale(1)";
      });

      const cancelButton = document.createElement("button");
      cancelButton.innerHTML = "&#10060;"; 
      Object.assign(cancelButton.style, {
        position: "absolute",
        top: "10px",
        right: "10px",
        padding: "8px",
        fontSize: "1.2rem",
        border: "none",
        borderRadius: "50%",
        background: "#dc3545",
        color: "white",
        cursor: "pointer",
        boxShadow: "0px 0px 10px rgba(255, 255, 255, 0.3)",
        transition: "background 0.3s, transform 0.1s",
      });

      cancelButton.addEventListener("mousedown", () => {
        cancelButton.style.transform = "scale(0.9)";
      });
      cancelButton.addEventListener("mouseup", () => {
        cancelButton.style.transform = "scale(1)";
      });

      videoContainer.appendChild(video);
      videoContainer.appendChild(captureButton);
      videoContainer.appendChild(cancelButton);
      modal.appendChild(videoContainer);
      document.body.appendChild(modal);

      captureButton.addEventListener("click", () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        video.srcObject.getTracks().forEach((track) => track.stop());
        document.body.removeChild(modal);

        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/jpeg");
      });

      cancelButton.addEventListener("click", () => {
        video.srcObject.getTracks().forEach((track) => track.stop());
        document.body.removeChild(modal);
        reject("Camera capture canceled.");
      });
    } catch (err) {
      reject(err);
    }
  });
};
