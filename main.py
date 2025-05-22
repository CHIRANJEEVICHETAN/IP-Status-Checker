import subprocess
import platform

# IP addresses from the image
ip_list = [
    "10.219.161.15",
    "10.166.52.22",
    "10.166.50.22",
    "10.166.54.20",
    "10.167.68.19",
    "10.167.70.17",
    "10.166.52.20",
    "10.166.52.21",
    "10.219.161.14"
]

# Determine ping command based on OS
param = "-n" if platform.system().lower() == "windows" else "-c"

def check_ip(ip):
    try:
        result = subprocess.run(["ping", param, "1", ip], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return "ONLINE" if result.returncode == 0 else "OFFLINE"
    except Exception as e:
        return f"ERROR: {str(e)}"

# Print status of each IP
for ip in ip_list:
    status = check_ip(ip)
    print(f"{ip} is {status}")
