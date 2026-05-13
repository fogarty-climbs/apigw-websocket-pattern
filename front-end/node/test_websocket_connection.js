const WebSocket = require('ws');

const WS_URL = 'wss://c3wj3ucjda.execute-api.us-east-1.amazonaws.com/production/';
const CLIENT_NAME = process.argv[2] || 'client-1';
const DISPLAY_NAME = process.argv[3] || CLIENT_NAME;

const URL_WITH_NAME = `${WS_URL}?displayName=${encodeURIComponent(DISPLAY_NAME)}`;

console.log(`[${CLIENT_NAME}] Connecting as "${DISPLAY_NAME}"...`);

const ws = new WebSocket(URL_WITH_NAME);

ws.on('open', () => {
  console.log(`[${CLIENT_NAME}] ✅ Connected`);

  // Request current connections list
  setTimeout(() => {
    const connectionsRequest = JSON.stringify({ type: 'connections' });
    console.log(`[${CLIENT_NAME}] 📤 Requesting connections: ${connectionsRequest}`);
    ws.send(connectionsRequest);
  }, 300);

  // Send a test message
  setTimeout(() => {
    const payload = JSON.stringify({
      type: 'message',
      content: `Hello from ${DISPLAY_NAME}`
    });
    console.log(`[${CLIENT_NAME}] 📤 Sending: ${payload}`);
    ws.send(payload);
  }, 2000);

  // Close after 10 seconds
  setTimeout(() => {
    console.log(`[${CLIENT_NAME}] Closing connection...`);
    ws.close();
  }, 10000);
});

ws.on('message', (data) => {
  try {
    const parsed = JSON.parse(data);
    console.log(`[${CLIENT_NAME}] 📨 Received [${parsed.type}]:`, JSON.stringify(parsed, null, 2));
  } catch {
    console.log(`[${CLIENT_NAME}] 📨 Received (raw):`, data);
  }
});

ws.on('close', (code) => {
  console.log(`[${CLIENT_NAME}] 🔌 Disconnected — code: ${code}`);
});

ws.on('error', (err) => {
  console.error(`[${CLIENT_NAME}] ❌ Error: ${err.message}`);
});