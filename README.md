# WebRTC Video Chat Application

This is a real-time video chat application built using **WebRTC**, **Socket.IO**, and **Node.js**. It allows multiple users to join a shared space and initiate peer-to-peer video calls with each other via a browser.

## Features

- Real-time peer-to-peer video communication using WebRTC.
- User list display with clickable call buttons.
- End-call functionality with remote stream disconnection.
- Uses STUN server for NAT traversal.
- Socket.IO for signaling and real-time communication.
- Basic frontend UI with user-friendly call interaction buttons.

## Project Structure

```
CHAT-APP2/
│
├── app/
│   └── index.html             # Main HTML interface
│
├── public/
│   ├── css/
│   │   └── style.css          # Application styles
│   ├── images/                # Icons for UI
│   │   ├── phone.png
│   │   ├── phone-call.png
│   │   ├── phone-disconnect.png
│   │   └── customer-service.png
│   └── js/
│       ├── main.js            # Frontend WebRTC logic
│       └── socket.io.js       # Socket.IO client (optional if served via CDN)
│
├── server.js                  # Node.js + Express + Socket.IO server
├── package.json
└── package-lock.json
```

## ⚙️ Installation

### Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or newer recommended)
- npm (comes with Node.js)

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/webrtc-video-chat.git
   cd webrtc-video-chat
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   node server.js
   ```

4. **Access the app**:
   Open your browser and navigate to:
   ```
   http://localhost:9000/
   ```

## Usage

1. Enter a unique username in the input field and click "Create".
2. You will see a list of all online users.
3. Click the 📞 icon beside a user’s name to start a video call.
4. Click "End Call" to hang up.

> Note: Ensure that you allow the browser to access your camera and microphone.

## Technologies Used

- WebRTC
- Socket.IO
- Express.js
- JavaScript (Vanilla)
- HTML/CSS

## Future Improvements

- Add chat messaging feature.
- Display connection status (connecting, connected, disconnected).
- Add screen-sharing support.
- Support for multiple concurrent rooms.

## License

This project is open source and available under the [MIT License](LICENSE).


