// DOM elements
const ipTableBody = document.getElementById('ip-table-body');
const lastUpdatedElement = document.getElementById('last-updated');
const refreshButton = document.getElementById('refresh-btn');
const addIpForm = document.getElementById('add-ip-form');
const locationInput = document.getElementById('location');
const ipAddressInput = document.getElementById('ip-address');

// Constants
const REFRESH_INTERVAL = 30000; // 30 seconds
const STORAGE_KEY = 'ip_monitor_data';
const API_BASE_URL = window.location.origin; // Get base URL dynamically

// IP data structure
let ipData = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded, initializing app');
    console.log(`Using API base URL: ${API_BASE_URL}`);
    initializeApp();
});

// Main initialization function
async function initializeApp() {
    console.log('Initializing application');
    try {
        // Always fetch fresh data from server on init
        await fetchIpData();
        
        // Setup event listeners
        refreshButton.addEventListener('click', () => {
            updateIpStatuses();
        });
        
        addIpForm.addEventListener('submit', handleAddIp);
        
        // Set up event delegation for delete buttons
        ipTableBody.addEventListener('click', handleTableActions);
        
        // Set up periodic refresh
        setInterval(updateIpStatuses, REFRESH_INTERVAL);
    } catch (error) {
        console.error('Error initializing app:', error);
        displayErrorMessage('Failed to initialize application: ' + error.message);
    }
}

// Fetch IP data from server
async function fetchIpData() {
    console.log('Fetching IP data from server');
    try {
        // First try to load from localStorage (for custom added IPs)
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            ipData = JSON.parse(storedData);
            console.log('Loaded data from localStorage:', ipData);
            renderIpTable(ipData);
            await updateIpStatuses();
            return;
        }
        
        // If no stored data, fetch from server
        const url = `${API_BASE_URL}/api/ips`;
        console.log(`Fetching from URL: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        
        ipData = await response.json();
        console.log('Received IP data:', ipData);
        
        // Initialize status as unknown for all IPs
        ipData = ipData.map(item => ({
            ...item,
            status: 'unknown'
        }));
        
        // Save to localStorage
        saveToLocalStorage();
        
        // Render table and update statuses
        renderIpTable(ipData);
        await updateIpStatuses();
    } catch (error) {
        console.error('Error fetching IP data:', error);
        displayErrorMessage('Failed to load IP data: ' + error.message);
    }
}

// Save current IP data to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ipData));
        console.log('Saved data to localStorage');
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// Handle adding a new IP
function handleAddIp(event) {
    event.preventDefault();
    
    const location = locationInput.value.trim();
    const ip = ipAddressInput.value.trim();
    
    // Validate IP format
    const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
        displayErrorMessage('Please enter a valid IP address in format xxx.xxx.xxx.xxx');
        return;
    }
    
    // Check if IP already exists
    const ipExists = ipData.some(item => item.ip === ip);
    if (ipExists) {
        displayErrorMessage(`IP address ${ip} already exists in the list`);
        return;
    }
    
    // Add the new IP
    const newIp = {
        location: location,
        ip: ip,
        status: 'unknown',
        method: 'pending'
    };
    
    ipData.push(newIp);
    saveToLocalStorage();
    
    // Re-render the table and check status
    renderIpTable(ipData);
    
    // Check the status of the new IP
    checkIpStatus(ip).then(response => {
        const updatedItem = ipData.find(item => item.ip === ip);
        if (updatedItem) {
            updatedItem.status = response.status;
            updatedItem.method = response.method;
            saveToLocalStorage();
            updateStatusDisplay(ipData);
            
            // Log the method used
            console.log(`New IP ${ip} (${location}): ${response.status.toUpperCase()} [Method: ${response.method}]`);
        }
    });
    
    // Clear the form
    addIpForm.reset();
    
    // Show success message
    displaySuccessMessage(`Added new IP: ${ip} (${location})`);
}

// Handle table actions (delete button)
function handleTableActions(event) {
    const target = event.target;
    
    // Check if clicked on delete button or its icon
    if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
        const row = target.closest('tr');
        const ip = row.dataset.ip;
        
        if (ip) {
            deleteIp(ip);
        }
    }
}

// Delete an IP from the list
function deleteIp(ip) {
    // Filter out the IP to delete
    ipData = ipData.filter(item => item.ip !== ip);
    
    // Save to localStorage and re-render
    saveToLocalStorage();
    renderIpTable(ipData);
    
    // Show success message
    displaySuccessMessage(`Removed IP: ${ip}`);
}

// Render the IP table
function renderIpTable(data) {
    console.log('Rendering IP table with data:', data);
    ipTableBody.innerHTML = '';
    
    if (data.length === 0) {
        console.warn('No IP data available to display');
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="4">No IP data available</td>';
        ipTableBody.appendChild(emptyRow);
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.id = `ip-row-${item.ip.replace(/\./g, '-')}`;
        row.dataset.ip = item.ip;
        
        row.innerHTML = `
            <td>${item.location}</td>
            <td>${item.ip}</td>
            <td class="status-cell">
                <span class="status-indicator status-${item.status || 'unknown'}">${getStatusText(item.status)}</span>
            </td>
            <td>
                <button class="action-btn delete-btn" title="Delete IP">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        ipTableBody.appendChild(row);
    });
}

// Get readable status text
function getStatusText(status) {
    switch(status) {
        case 'online': return 'Online';
        case 'offline': return 'Offline';
        default: return 'Unknown';
    }
}

// Update the status of all IP addresses
async function updateIpStatuses() {
    console.log('Updating IP statuses');
    
    // Update status with "Updating..."
    lastUpdatedElement.textContent = 'Updating...';
    
    try {
        // Use the bulk status endpoint to get all statuses at once
        const url = `${API_BASE_URL}/api/status-all`;
        console.log(`Fetching from URL: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        
        // Get updated data with real statuses
        const updatedData = await response.json();
        console.log('Received updated status data:', updatedData);
        
        // Log the methods used for each IP check
        console.group('IP Status Check Methods');
        updatedData.forEach(item => {
            console.log(`${item.ip} (${item.location}): ${item.status.toUpperCase()} [Method: ${item.method || 'unknown'}]`);
        });
        console.groupEnd();
        
        // Merge the server data with any manually added IPs
        const updatedIps = new Map(updatedData.map(item => [item.ip, item]));
        ipData = ipData.map(item => {
            if (updatedIps.has(item.ip)) {
                return {
                    ...item,
                    status: updatedIps.get(item.ip).status,
                    method: updatedIps.get(item.ip).method // Store the method for future reference
                };
            }
            return item;
        });
        
        // Check any IPs not in the server response
        const customIps = ipData.filter(item => !updatedIps.has(item.ip));
        if (customIps.length > 0) {
            for (const item of customIps) {
                const response = await checkIpStatus(item.ip);
                item.status = response.status;
                item.method = response.method; // Store the method
                console.log(`Custom IP ${item.ip}: ${item.status.toUpperCase()} [Method: ${item.method || 'unknown'}]`);
            }
        }
        
        // Save to localStorage
        saveToLocalStorage();
        
        // Update the UI
        updateStatusDisplay(ipData);
        
        // Update last updated time
        const now = new Date();
        lastUpdatedElement.textContent = `Last updated: ${formatDateTime(now)}`;
    } catch (error) {
        console.error('Error updating IP statuses:', error);
        
        // If bulk endpoint fails, try individual checks
        console.log('Attempting individual IP status checks');
        const updatePromises = ipData.map(async (item) => {
            const response = await checkIpStatus(item.ip);
            return {
                ...item,
                status: response.status,
                method: response.method // Store the method
            };
        });
        
        // Wait for all status checks to complete
        const updatedData = await Promise.all(updatePromises);
        
        // Log individual check methods
        console.group('Individual IP Status Check Methods');
        updatedData.forEach(item => {
            console.log(`${item.ip} (${item.location}): ${item.status.toUpperCase()} [Method: ${item.method || 'unknown'}]`);
        });
        console.groupEnd();
        
        // Update the data and save to localStorage
        ipData = updatedData;
        saveToLocalStorage();
        
        // Update the UI
        updateStatusDisplay(ipData);
        
        // Update last updated time
        const now = new Date();
        lastUpdatedElement.textContent = `Last updated: ${formatDateTime(now)}`;
    }
}

// Format date and time for display
function formatDateTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Update the status display in the table
function updateStatusDisplay(data) {
    console.log('Updating status display in the table');
    data.forEach(item => {
        const rowId = `ip-row-${item.ip.replace(/\./g, '-')}`;
        const row = document.getElementById(rowId);
        
        if (row) {
            const statusCell = row.querySelector('.status-cell');
            statusCell.innerHTML = `
                <span class="status-indicator status-${item.status}">${getStatusText(item.status)}</span>
            `;
        }
    });
}

// Check the status of a single IP address
async function checkIpStatus(ip) {
    console.log(`Checking status for IP: ${ip}`);
    try {
        // Use server-side endpoint for real ping
        const url = `${API_BASE_URL}/api/status/${ip}`;
        console.log(`Fetching from URL: ${url}`);
        
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            console.log(`IP ${ip} status: ${data.status} [Method: ${data.method || 'unknown'}]`);
            return {
                status: data.status,
                method: data.method || 'unknown'
            };
        } else {
            console.error(`Error response from server for IP ${ip}:`, response.status);
            return {
                status: 'unknown',
                method: 'error'
            };
        }
    } catch (error) {
        console.error(`Error checking IP ${ip}:`, error);
        return {
            status: 'unknown',
            method: 'error'
        };
    }
}

// Display error message
function displayErrorMessage(message) {
    console.error('Displaying error message:', message);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Add to the top of the main content
    const mainContent = document.querySelector('main');
    mainContent.insertBefore(errorDiv, mainContent.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Display success message
function displaySuccessMessage(message) {
    console.log('Displaying success message:', message);
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Add to the top of the main content
    const mainContent = document.querySelector('main');
    mainContent.insertBefore(successDiv, mainContent.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}
