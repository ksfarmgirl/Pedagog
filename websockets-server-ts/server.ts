/**************************************************************
 * NOTE: This is an attempt at creating a server to be used by
 * the react frontend that communicates with the AREPL backend.
 * WORK IN PROGRESS
 * Heavily influenced by Nono Martinez Alonso
 * from https://www.youtube.com/watch?v=h5B0iOz8vVg
 **************************************************************/
import { WebSocketServer } from "ws";

//port for server to listen on
const port = 8000;
const wss = new WebSocketServer({port});

//handles new connections
wss.on('connection', (ws) => {

    //print data for debug purposes, on message
    ws.on('message', (data) => {
        console.log(`Received message from client: ${data}`); //message received from client is outputted
    });

    //message to send to client letting them know they are connected
    ws.send('Hello client, you have connected to server.ts');
});

//message to show server running on port (8000)
console.log(`Listening at ${port}...`);

