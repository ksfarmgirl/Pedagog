/***********************************************
 * NOTE: This is the client side behavior for the
 * server used by the React frontend, an attempt
 * at least...
 * WORK IN PROGRESS
 * Heavily influenced by Nono Martinez Alonso
 * from https://www.youtube.com/watch?v=Y_gzsO4U7Dw
 ***********************************************/
import WebSocket from "ws";

//port used by server
const port = 8000;

//Websocket to connect to server on port
const ws = new WebSocket(`ws://localhost:${port}`);

//On connection, tells server that the client has connected
ws.on('open', () => {
    console.log('[Client] Connected.'); //tells client they have connected
    ws.send('Hi, this is from the client'); //sends message to server to show that a new client is connected
});

//Handles when a message is received from the server, displays message
ws.on('message', (data) => {
    console.log(`Received a message from the server: ${data}`);
});