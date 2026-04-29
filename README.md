# Android TV Remote

A sleek, locally-hosted web application to control your Android TV or Google Cast-enabled devices over the network. 

## Features
- **Local Network Discovery**: Easily connect to Android TVs using their IP address.
- **Secure Pairing Flow**: Handles the cryptographic handshake and PIN authentication seamlessly.
- **Minimalist Web Interface**: High-end, dark mode UI.
- **D-Pad & Media Controls**: Intuitive remote layout with support for long-press actions.
- **Quick Reconnect**: Remembers your recently connected IPs.

## Getting Started

### Prerequisites
- A device with Node.js (v16 or higher) installed
- NPM or Yarn
- Be on the same network as the device you want to control
- Have an Android TV or Google Cast-enabled device

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/MikaTech-dev/android-tv-remote.git
   ```
   *(...or download and unzip the project)*
2. Navigate to the project directory:
   ```bash
   cd android-tv-remote
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the App
Start the local server:
```bash
npm start
```
*(Or use `node .`)*

Once running, open your browser and navigate to `http://localhost:3000`. Enter your Android TV's IP address to initiate the pairing process.

## Built With
- **Frontend**: Vanilla HTML/CSS/JS
- **Backend**: Node.js, Express, Socket.IO
- **Protocol**: Custom Android TV remote protocol handling built by [louis49](https://github.com/louis49/androidtv-remote)