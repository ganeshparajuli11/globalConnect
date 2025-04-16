import { writeFileSync } from 'fs';
import os from 'os';

function getWifiIPv4() {
  const nets = os.networkInterfaces();
  // Iterate over network interface names
  for (const interfaceName of Object.keys(nets)) {
    // Check if the interface name contains "wi-fi" or "wireless"
    if (
      interfaceName.toLowerCase().includes('wi-fi') ||
      interfaceName.toLowerCase().includes('wireless')
    ) {
      // Look through each address on the interface
      for (const net of nets[interfaceName]) {
        // Return the first non‑internal IPv4 address
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  // Fallback in case no Wi‑Fi interface is found
  return '127.0.0.1';
}

const generate = () => {
  const ip = getWifiIPv4();

  const config = `
    const config = {
      API_IP: "${ip}",
      EXPO_PROJECT_ID: "74b46798-df04-48a9-8c07-dea648ae237c"
    };

    export default config;
  `;

  writeFileSync('./config.js', config.trim());
  console.log("✅ Updated config.js with IP:", ip);
};

generate();
