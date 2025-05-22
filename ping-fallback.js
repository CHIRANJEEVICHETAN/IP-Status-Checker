const http = require('http');
const dns = require('dns');
const net = require('net');

/**
 * Alternative to ping that works in restricted environments like Render
 * @param {string} ip - IP address to check
 * @returns {Promise<{alive: boolean, method: string}>} Status result
 */
async function checkStatus(ip) {
  console.log(`Checking status for IP: ${ip} using fallback methods`);
  
  // Try TCP connection to common ports
  const ports = [80, 443, 22, 21];
  for (const port of ports) {
    try {
      const isOpen = await checkTcpPort(ip, port);
      if (isOpen) {
        console.log(`IP ${ip} is ONLINE (TCP port ${port} is open)`);
        return { alive: true, method: `tcp-${port}` };
      }
    } catch (err) {
      // Continue with next port
    }
  }
  
  // Try HTTP request (if applicable for web servers)
  try {
    const isReachable = await checkHttp(ip);
    if (isReachable) {
      console.log(`IP ${ip} is ONLINE (HTTP request successful)`);
      return { alive: true, method: 'http' };
    }
  } catch (err) {
    // Continue to next check
  }
  
  // Try DNS resolution (less reliable but sometimes works)
  try {
    await checkDns(ip);
    console.log(`IP ${ip} is ONLINE (DNS resolution successful)`);
    return { alive: true, method: 'dns' };
  } catch (err) {
    // Final check failed
  }
  
  // If all checks fail, consider the host offline
  console.log(`IP ${ip} is OFFLINE (all checks failed)`);
  return { alive: false, method: 'all_failed' };
}

/**
 * Check if TCP port is open
 */
function checkTcpPort(host, port) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const timeout = 2000;
    
    socket.setTimeout(timeout);
    
    const onError = (err) => {
      socket.destroy();
      reject(err);
    };
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('Connection timeout'));
    });
    
    socket.on('error', onError);
    
    socket.connect(port, host);
  });
}

/**
 * Check if HTTP request succeeds
 */
function checkHttp(host) {
  return new Promise((resolve, reject) => {
    const request = http.get(`http://${host}`, {
      timeout: 2000
    }, (res) => {
      res.destroy();
      resolve(true);
    });
    
    request.on('error', (err) => {
      request.destroy();
      reject(err);
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('HTTP request timeout'));
    });
  });
}

/**
 * Try DNS resolution
 */
function checkDns(ip) {
  return new Promise((resolve, reject) => {
    dns.reverse(ip, (err, hostnames) => {
      if (err) {
        reject(err);
      } else {
        resolve(hostnames);
      }
    });
  });
}

module.exports = { checkStatus };
