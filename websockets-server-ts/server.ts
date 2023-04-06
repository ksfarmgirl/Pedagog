/************************************************************
NOTE: This is an attempt at creating a server to be used by
the react frontend that communicates with the AREPL backend.
WORK IN PROGRESS
*************************************************************/
import { WebSocketServer } from "ws";

//port for server to listen on
const port = 8000;
const wss = new WebSocketServer({port});

//handles new connections
wss.on('connection', (ws) => {

    //print data for debug purposes, on message
    ws.on('message', (data) => {
        console.log(`Received message from client: ${data}`);
    })

    ws.send('Hello client, you have connected to server.ts')
})

console.log(`Listening at ${port}...`);

