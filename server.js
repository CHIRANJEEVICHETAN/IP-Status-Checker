const express = require('express');
const path = require('path');
const ping = require('ping');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing for POST requests
app.use(express.json());

// Sample IP data extracted from main.py
const ipData = [
  { ip: "10.219.161.15", location: "PI_PUNE" },
  { ip: "10.166.52.22", location: "SO_SHOP5" },
  { ip: "10.166.50.22", location: "AO_ADMIN2" },
  { ip: "10.166.54.20", location: "EI_ESS" },
  { ip: "10.167.68.19", location: "HO_HASAN" },
  { ip: "10.167.70.17", location: "MM_CHENNAI1" },
  { ip: "10.166.52.20", location: "SI_SHOP1" },
  { ip: "10.166.52.21", location: "SI_SHOP3" },
  { ip: "10.219.161.14", location: "PO_PUNE" },
  { ip: "10.166.52.30", location: "SO_SHOP4" },
  { ip: "10.166.52.31", location: "SI_SHOP2" },
  { ip: "10.166.50.21", location: "AI_ADMIN2" },
  { ip: "10.166.54.21", location: "EO_ESS" },
  { ip: "10.166.52.32", location: "SO_SHOP6" },
  { ip: "10.167.68.20", location: "HI_HASAN" },
  { ip: "10.219.160.1", location: "IndoreWH" },
  { ip: "10.219.160.65", location: "Pune WH" },
  { ip: "10.219.160.129", location: "Rewari WH" },
  { ip: "10.219.160.193", location: "Gujarat WH" }
];

console.log(`Current directory: ${__dirname}`);

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Serve static files from src directory
app.use(express.static(path.join(__dirname, 'src')));

// Serve index.html for the root URL
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'src', 'index.html');
  console.log(`Serving index.html from: ${indexPath}`);
  res.sendFile(indexPath);
});

// API endpoint to get all IPs with locations
app.get('/api/ips', (req, res) => {
  console.log('API endpoint /api/ips called');
  res.json(ipData);
});

// API endpoint to check IP status (REAL ping)
app.get('/api/status/:ip', async (req, res) => {
  try {
    const ip = req.params.ip;
    console.log(`Pinging IP: ${ip}`);
    
    // Using ping library to do an actual ping
    const result = await ping.promise.probe(ip, { 
      timeout: 2,
      extra: ['-c', '1']  // Send just 1 packet
    });
    
    console.log(`IP ${ip} status: ${result.alive ? 'online' : 'offline'}`);
    res.json({ 
      ip, 
      status: result.alive ? 'online' : 'offline',
      time: result.time,
      alive: result.alive
    });
  } catch (err) {
    console.error(`Error pinging IP ${req.params.ip}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// API endpoint to check status of all IPs at once
app.get('/api/status-all', async (req, res) => {
  try {
    console.log('API endpoint /api/status-all called');
    
    const results = await Promise.all(ipData.map(async (item) => {
      const result = await ping.promise.probe(item.ip, { timeout: 2 });
      return {
        ...item,
        status: result.alive ? 'online' : 'offline',
        time: result.time,
        alive: result.alive
      };
    }));
    
    res.json(results);
  } catch (err) {
    console.error('Error checking all IPs:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints: 
  - GET /api/ips
  - GET /api/status/:ip
  - GET /api/status-all`);
}); 