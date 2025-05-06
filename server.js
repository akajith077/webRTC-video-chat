// Import required modules
import express from "express"; // Web framework for Node.js
import { createServer } from "http"; // Built-in HTTP module to create server
import { Server } from "socket.io"; // Socket.IO for real-time bidirectional communication
import { fileURLToPath } from "url"; // Converts module URL to file path
import { dirname, join } from "path"; // For handling file paths

// Initialize Express app and HTTP server
const app = express();
const server = createServer(app);
const io = new Server(server); // Attach socket.io to HTTP server

// Store all connected users with their socket IDs
const allusers = {};

// Convert module URL to directory path (for ES modules)
const __dirname = dirname(fileURLToPath(import.meta.url));

// Serve static files (HTML, CSS, JS) from "public" folder
app.use(express.static("public"));

// Route handler for the root path "/"
app.get("/", (req, res) => {
  console.log("GET Request /");
  res.sendFile(join(__dirname + "/app/index.html"));
});

// Handle WebSocket connections
io.on("connection", (socket) => {
  console.log(`New client connected: Socket ID = ${socket.id}`);

  // When a user joins, save their username and socket ID
  socket.on("join-user", (username) => {
    console.log(`${username} joined the room.`);
    allusers[username] = { username, id: socket.id };

    // Notify all connected clients of the updated user list
    io.emit("joined", allusers);
  });

  // Handle offer from caller and send it to callee
  socket.on("offer", ({ from, to, offer }) => {
    console.log("Offer received:", { from, to });
    io.to(allusers[to].id).emit("offer", { from, to, offer });
  });

  // Handle answer from callee and send it back to caller
  socket.on("answer", ({ from, to, answer }) => {
    io.to(allusers[from].id).emit("answer", { from, to, answer });
  });

  // Notify callee to end the call
  socket.on("end-call", ({ from, to }) => {
    io.to(allusers[to].id).emit("end-call", { from, to });
  });

  // Notify both peers that call has ended
  socket.on("call-ended", (caller) => {
    const [from, to] = caller;
    io.to(allusers[from].id).emit("call-ended", caller);
    io.to(allusers[to].id).emit("call-ended", caller);
  });

  // Relay ICE candidates between peers
  socket.on("icecandidate", (candidate) => {
    console.log("ICE Candidate received:", candidate);

    // Broadcast ICE candidate to all peers except sender
    socket.broadcast.emit("icecandidate", candidate);
  });

  // (Optional) Clean-up logic for disconnected users could go here
});

// Start server on port 9000
server.listen(9000, () => {
  console.log(`Server is running and listening on port 9000`);
});
