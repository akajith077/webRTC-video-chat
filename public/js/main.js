// Get references to DOM elements
const createUserBtn = document.getElementById("create-user");
const username = document.getElementById("username");
const allusersHtml = document.getElementById("allusers");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const endCallBtn = document.getElementById("end-call-btn");

// Connect to the Socket.IO server
const socket = io();

let localStream; // Holds user's local video/audio stream
let caller = []; // Store [from, to] for active call

// Mute local video to avoid audio feedback loop
localVideo.muted = true;

// -------------------------------------
// Singleton for managing RTCPeerConnection
// -------------------------------------
const PeerConnection = (function () {
  let peerConnection;

  const createPeerConnection = () => {
    const config = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }, // Public STUN server
      ],
    };

    // Create a new peer connection
    peerConnection = new RTCPeerConnection(config);

    // Log the media tracks being sent
    console.log(
      "Tracks being sent:",
      localStream.getTracks().map((t) => `${t.kind}: ${t.enabled}`)
    );

    // Add all local media tracks (audio + video) to peer connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Handle incoming remote media stream
    peerConnection.ontrack = function (event) {
      remoteVideo.srcObject = event.streams[0];
    };

    // Handle and send ICE candidates to signaling server
    peerConnection.onicecandidate = function (event) {
      if (event.candidate) {
        socket.emit("icecandidate", event.candidate);
      }
    };

    return peerConnection;
  };

  return {
    // Provide the same connection if already created, otherwise create new
    getInstance: () => {
      if (!peerConnection || peerConnection.signalingState === "closed") {
        peerConnection = createPeerConnection();
      }
      return peerConnection;
    },
  };
})();

// -------------------------------------
// UI Interactions
// -------------------------------------

// When user clicks "Create", emit join event and hide input
createUserBtn.addEventListener("click", (e) => {
  if (username.value !== "") {
    const usernameContainer = document.querySelector(".username-input");
    socket.emit("join-user", username.value);
    usernameContainer.style.display = "none";
  }
});

// End call manually
endCallBtn.addEventListener("click", (e) => {
  socket.emit("call-ended", caller);
});

// -------------------------------------
// Socket Event Handlers
// -------------------------------------

// Update UI with list of online users
socket.on("joined", (allusers) => {
  const createUsersHtml = () => {
    allusersHtml.innerHTML = "";

    for (const user in allusers) {
      const li = document.createElement("li");
      li.textContent = `${user} ${user === username.value ? "(You)" : ""}`;

      if (user !== username.value) {
        // Add call button for other users
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

// Handle receiving an offer
socket.on("offer", async ({ from, to, offer }) => {
  const pc = PeerConnection.getInstance();
  await pc.setRemoteDescription(offer); // Set remote offer
  const answer = await pc.createAnswer(); // Create answer
  await pc.setLocalDescription(answer); // Set local description
  socket.emit("answer", { from, to, answer }); // Send answer back to caller
  caller = [from, to];
});

// Handle receiving an answer
socket.on("answer", async ({ from, to, answer }) => {
  const pc = PeerConnection.getInstance();
  await pc.setRemoteDescription(answer); // Set remote answer
  endCallBtn.style.display = "block"; // Show end call button
  socket.emit("end-call", { from, to }); // Notify both peers call is active
  caller = [from, to];
});

// Handle receiving ICE candidate
socket.on("icecandidate", async (candidate) => {
  const pc = PeerConnection.getInstance();
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
});

// Show end call button when notified
socket.on("end-call", ({ from, to }) => {
  endCallBtn.style.display = "block";
});

// Handle call ended event
socket.on("call-ended", (caller) => {
  endCall();
});

// -------------------------------------
// Start a call with selected user
// -------------------------------------
const startCall = async (user) => {
  const pc = PeerConnection.getInstance();
  const offer = await pc.createOffer(); // Create SDP offer
  await pc.setLocalDescription(offer); // Set local offer
  socket.emit("offer", {
    from: username.value,
    to: user,
    offer: pc.localDescription,
  });
};

// -------------------------------------
// End the ongoing call
// -------------------------------------
const endCall = () => {
  const pc = PeerConnection.getInstance();
  if (pc) {
    pc.close(); // Close peer connection
    endCallBtn.style.display = "none";
  }
};

// -------------------------------------
// Start local camera and mic
// -------------------------------------
const startMyVideo = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    console.log({ stream });
    localStream = stream;
    localVideo.srcObject = stream;

    // Prepare remote video settings
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;
    remoteVideo.controls = true;
    remoteVideo.muted = false;
  } catch (error) {
    console.error("Error getting user media:", error);
  }
};

// Start local stream when script loads
startMyVideo();
