import { writeFileSync } from 'fs';
import { internalIpV4 } from 'internal-ip';

const generate = async () => {
  const ip = await internalIpV4();

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
