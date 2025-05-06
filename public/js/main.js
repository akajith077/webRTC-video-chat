const createUserBtn = document.getElementById("create-user");
const username = document.getElementById("username");
const allusersHtml = document.getElementById("allusers");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const endCallBtn = document.getElementById("end-call-btn");
const socket = io();
let localStream;
let caller = [];

// Mute your own video to avoid echo
localVideo.muted = true;

// Peer connection singleton
const PeerConnection = (function () {
  let peerConnection;

  const createPeerConnection = () => {
    const config = {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    };
    peerConnection = new RTCPeerConnection(config);

    // ✅ Log tracks being added
    console.log(
      "Tracks being sent:",
      localStream.getTracks().map((t) => `${t.kind}: ${t.enabled}`)
    );

    // Add all tracks (audio + video)
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Receive remote stream
    peerConnection.ontrack = function (event) {
      remoteVideo.srcObject = event.streams[0];
    };

    // ICE candidate
    peerConnection.onicecandidate = function (event) {
      if (event.candidate) {
        socket.emit("icecandidate", event.candidate);
      }
    };

    return peerConnection;
  };

  return {
    getInstance: () => {
      if (!peerConnection || peerConnection.signalingState === "closed") {
        peerConnection = createPeerConnection();
      }
      return peerConnection;
    },
  };
})();

// UI interaction
createUserBtn.addEventListener("click", (e) => {
  if (username.value !== "") {
    const usernameContainer = document.querySelector(".username-input");
    socket.emit("join-user", username.value);
    usernameContainer.style.display = "none";
  }
});
endCallBtn.addEventListener("click", (e) => {
  socket.emit("call-ended", caller);
});

// Socket events
socket.on("joined", (allusers) => {
  const createUsersHtml = () => {
    allusersHtml.innerHTML = "";

    for (const user in allusers) {
      const li = document.createElement("li");
      li.textContent = `${user} ${user === username.value ? "(You)" : ""}`;

      if (user !== username.value) {
        const button = document.createElement("button");
        button.classList.add("call-btn");
        button.addEventListener("click", () => {
          startCall(user);
        });
        const img = document.createElement("img");
        img.setAttribute("src", "/images/phone.png");
        img.setAttribute("width", 20);
        button.appendChild(img);
        li.appendChild(button);
      }

      allusersHtml.appendChild(li);
    }
  };

  createUsersHtml();
});

socket.on("offer", async ({ from, to, offer }) => {
  const pc = PeerConnection.getInstance();
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit("answer", { from, to, answer: pc.localDescription });
  caller = [from, to];
});

socket.on("answer", async ({ from, to, answer }) => {
  const pc = PeerConnection.getInstance();
  await pc.setRemoteDescription(answer);
  endCallBtn.style.display = "block";
  socket.emit("end-call", { from, to });
  caller = [from, to];
});

socket.on("icecandidate", async (candidate) => {
  const pc = PeerConnection.getInstance();
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("end-call", ({ from, to }) => {
  endCallBtn.style.display = "block";
});
socket.on("call-ended", (caller) => {
  endCall();
});

// Start call
const startCall = async (user) => {
  const pc = PeerConnection.getInstance();
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit("offer", {
    from: username.value,
    to: user,
    offer: pc.localDescription,
  });
};

// End call
const endCall = () => {
  const pc = PeerConnection.getInstance();
  if (pc) {
    pc.close();
    endCallBtn.style.display = "none";
  }
};

// Start camera + microphone
const startMyVideo = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    console.log({ stream });
    localStream = stream;
    localVideo.srcObject = stream;

    // ✅ Ensure remote video is ready for audio
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;
    remoteVideo.controls = true;
    remoteVideo.muted = false;
  } catch (error) {
    console.error("Error getting user media:", error);
  }
};

startMyVideo();
