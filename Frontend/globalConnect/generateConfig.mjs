#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

function getWifiIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    const lname = name.toLowerCase();
    if (
      lname.includes('wi-fi') ||
      lname.includes('wifi') ||
      lname.includes('wlan') ||
      lname.includes('wireless')
    ) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  return '127.0.0.1';
}

const ip = getWifiIPv4();
const configContents = `const config = {
  API_IP: "${ip}",
  EXPO_PROJECT_ID: "74b46798-df04-48a9-8c07-dea648ae237c"
};

export default config;
`;

// ESM hack to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outPath = path.join(__dirname, 'config.js');
fs.writeFileSync(outPath, configContents.trimStart(), 'utf8');
console.log(`✅ Updated ${outPath} with API_IP=${ip}`);
