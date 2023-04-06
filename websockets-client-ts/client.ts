/***********************************************
 * NOTE: This is the client side behavior for the
 * server used by the React frontend, an attempt
 * at least...
 * WORK IN PROGRESS
 ***********************************************/
import WebSocket from "ws";

const port = 8000;
const ws = new WebSocket(`ws://localhost:${port}`);

ws.on('open', () => {
    console.log('[Client] Connected.')
    ws.send('Hi, this is from the client');
});
ws.on('message', (data) => {
    console.log(`Received a message from the server: ${data}`);
});