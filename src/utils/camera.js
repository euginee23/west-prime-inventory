export const openCamera = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  
        const modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = "0";
        modal.style.left = "0";
        modal.style.width = "100vw";
        modal.style.height = "100vh";
        modal.style.background = "rgba(0, 0, 0, 0.8)";
        modal.style.display = "flex";
        modal.style.alignItems = "center";
        modal.style.justifyContent = "center";
        modal.style.flexDirection = "column";
        modal.style.zIndex = "1000";
        modal.style.padding = "20px";
  
        const videoContainer = document.createElement("div");
        videoContainer.style.display = "flex";
        videoContainer.style.flexDirection = "column";
        videoContainer.style.alignItems = "center";
        videoContainer.style.justifyContent = "center";
        videoContainer.style.width = "90vw"; 
        videoContainer.style.maxWidth = "600px"; 
        videoContainer.style.background = "black";
        videoContainer.style.borderRadius = "10px";
        videoContainer.style.padding = "10px";
  
        const video = document.createElement("video");
        video.srcObject = stream;
        video.autoplay = true;
        video.style.width = "100%";
        video.style.maxHeight = "70vh"; 
        video.style.objectFit = "cover"; 
        video.style.borderRadius = "10px";
        video.style.boxShadow = "0px 0px 10px rgba(255, 255, 255, 0.5)";
  
        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.gap = "10px";
        buttonContainer.style.marginTop = "15px";
  
        const captureButton = document.createElement("button");
        captureButton.innerText = "Capture";
        captureButton.style.padding = "10px 20px";
        captureButton.style.fontSize = "1.2rem";
        captureButton.style.border = "none";
        captureButton.style.borderRadius = "5px";
        captureButton.style.background = "#28a745";
        captureButton.style.color = "white";
        captureButton.style.cursor = "pointer";
        captureButton.style.boxShadow = "0px 0px 10px rgba(255, 255, 255, 0.3)";
        captureButton.style.flex = "1";
  
        const cancelButton = document.createElement("button");
        cancelButton.innerText = "Cancel";
        cancelButton.style.padding = "10px 20px";
        cancelButton.style.fontSize = "1.2rem";
        cancelButton.style.border = "none";
        cancelButton.style.borderRadius = "5px";
        cancelButton.style.background = "#dc3545";
        cancelButton.style.color = "white";
        cancelButton.style.cursor = "pointer";
        cancelButton.style.boxShadow = "0px 0px 10px rgba(255, 255, 255, 0.3)";
        cancelButton.style.flex = "1";
  
        buttonContainer.appendChild(captureButton);
        buttonContainer.appendChild(cancelButton);
  
        videoContainer.appendChild(video);
        modal.appendChild(videoContainer);
        modal.appendChild(buttonContainer);
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
  