# IP Status Monitor

A simple web application for monitoring IP address status in real-time.

## Features

- View real-time online/offline status of IP addresses
- Auto-refresh every 30 seconds
- Manual refresh option
- Persistent storage of IP data in localStorage
- Clean and responsive design

## Requirements

- Node.js (v12 or higher recommended)
- npm (comes with Node.js)

## Installation

1. Clone this repository or download the source code
2. Navigate to the project directory
3. Install dependencies:

```
npm install
```

## Usage

1. Start the server:

```
npm start
```

2. Open your web browser and navigate to:

```
http://localhost:3000
```

## How It Works

- The application uses a lightweight Express server to serve static files and provide API endpoints
- IP status is simulated on the frontend (due to browser security limitations for actual pinging)
- Data is stored in localStorage to persist between sessions
- The status is automatically updated every 30 seconds, or manually via the "Refresh Now" button

## Customization

To add or modify the IP addresses being monitored, edit the `ipData` array in `server.js`.

## License

MIT 