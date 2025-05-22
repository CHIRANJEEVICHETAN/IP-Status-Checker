# IP Status Monitor

A real-time application for monitoring the online/offline status of IP addresses through multiple checking methods. The application provides a clean, responsive interface for tracking the status of multiple network devices or services.

## Features

- Real-time monitoring of IP address status (online/offline)
- Multiple fallback methods for status checking
- Add custom IP addresses with their locations
- Status updates every 30 seconds, with manual refresh option
- Visual status indicators (green for online, red for offline)
- Persistent storage using localStorage
- Responsive design that works on desktop and mobile devices
- Detailed browser console logging of checking methods used

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js with Express.js
- **Status Checking**: Multiple methods (ICMP Ping, TCP, HTTP, DNS)
- **Storage**: Browser localStorage for persistence
- **Deployment**: Compatible with various hosting platforms (Render, Azure, etc.)

## Project Structure

```
IpTest/
├── src/                    # Frontend source code
│   ├── scripts/            
│   │   └── script.js       # Frontend JavaScript
│   ├── styles/             
│   │   └── style.css       # CSS styling
│   └── index.html          # Main HTML file
├── server.js               # Express server and API endpoints
├── ping-fallback.js        # Alternative status checking methods
├── main.py                 # Original Python script (reference only)
├── package.json            # Node.js dependencies and scripts
├── package-lock.json       # Dependency lock file
├── .gitignore              # Git ignore file
└── README.md               # Project documentation
```

## Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/ip-status-monitor.git
cd ip-status-monitor
```

2. Install dependencies:
```
npm install
```

3. Start the server:
```
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## IP Status Checking Methods

The application employs multiple methods to check the status of IP addresses, with automatic fallbacks when the primary method fails. Below is a detailed explanation of each method:

### 1. ICMP Ping (Primary Method)

**How it works**: The traditional ping method sends ICMP Echo Request packets to the target IP address and waits for Echo Reply packets.

**Technical details**:
- Uses the `ping` NPM package which wraps the system's ping utility
- Sends a single ping packet (`-c 1` option) with a 2-second timeout
- Efficient and provides accurate response time

**Code implementation**:
```javascript
const result = await ping.promise.probe(ip, { 
  timeout: 2,
  extra: ['-c', '1']  // Send just 1 packet
});
```

**Advantages**:
- Most direct and accurate method
- Low overhead and fast response
- Provides response time metrics

**Limitations**:
- Requires elevated privileges on many systems
- Often blocked by firewalls and cloud platforms (like Render)
- Not available in browser environments

### 2. TCP Port Connection

**How it works**: Attempts to establish a TCP connection to commonly used ports on the target IP address.

**Technical details**:
- Uses Node.js `net` module to create socket connections
- Tests ports 80 (HTTP), 443 (HTTPS), 22 (SSH), and 21 (FTP)
- Each connection attempt has a 2-second timeout
- Connection is closed immediately after successful establishment

**Code implementation**:
```javascript
function checkTcpPort(host, port) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });
    
    socket.connect(port, host);
  });
}
```

**Advantages**:
- Works in most network environments
- Doesn't require special privileges
- Tests actual service availability, not just network reachability

**Limitations**:
- Only detects hosts with the specified services running
- Firewalls may block connection attempts
- Slightly slower than ICMP ping

### 3. HTTP Request

**How it works**: Attempts to make an HTTP GET request to the target IP address.

**Technical details**:
- Uses Node.js `http` module
- Sends a GET request to the root path (/)
- Request has a 2-second timeout
- Connection is closed immediately after receiving a response

**Code implementation**:
```javascript
function checkHttp(host) {
  return new Promise((resolve, reject) => {
    const request = http.get(`http://${host}`, {
      timeout: 2000
    }, (res) => {
      res.destroy();
      resolve(true);
    });
    
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('HTTP request timeout'));
    });
  });
}
```

**Advantages**:
- Very reliable for web servers
- Works in most network environments
- Rarely blocked by network policies

**Limitations**:
- Only works for hosts running web servers
- Higher overhead than other methods
- May trigger security alerts on some systems

### 4. DNS Resolution

**How it works**: Attempts to perform reverse DNS lookup on the IP address.

**Technical details**:
- Uses Node.js `dns` module's reverse() function
- Attempts to resolve the IP address to a hostname
- Considered successful if any response is received

**Code implementation**:
```javascript
function checkDns(ip) {
  return new Promise((resolve, reject) => {
    dns.reverse(ip, (err, hostnames) => {
      if (err) reject(err);
      else resolve(hostnames);
    });
  });
}
```

**Advantages**:
- Works in most network environments
- Requires minimal privileges
- Light network footprint

**Limitations**:
- Less reliable indicator of actual host status
- A host can be online but have no reverse DNS record
- A host can be offline but still have DNS records in cache

### Fallback Strategy

The application implements an intelligent fallback strategy:

1. First tries ICMP ping (primary method)
2. If ping fails or is unavailable, tries TCP connections to common ports
3. If TCP fails, tries HTTP request
4. If HTTP fails, tries DNS resolution
5. If all methods fail, reports the host as offline

This multi-layered approach ensures maximum reliability across different network environments and hosting platforms.

## Deployment

### Local Development

Run the application locally with:
```
npm start
```

### Deploying to Render

1. Push your code to a GitHub repository
2. Create a new Web Service on Render
3. Connect to your GitHub repository
4. Use the following settings:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Node.js version**: 16.x or later

Note that ICMP ping will not work on Render, but the application will automatically fall back to other methods.

## Browser Console Information

To see which method was used to check each IP:

1. Open your browser's developer console (F12 key)
2. Look for the "IP Status Check Methods" group in the console
3. Each IP will show its status and the method used, for example:
   ```
   10.167.68.19 (HO_HASAN): ONLINE [Method: tcp-80]
   ```

## Troubleshooting

- **Ping not working**: This is expected in some environments. The application will automatically fall back to other methods.
- **All status checks showing as offline**: Check network connectivity and firewall settings.
- **Application shows blank table**: Check browser console for errors and ensure the server is running.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 