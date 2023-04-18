const { WebSocket, WebSocketServer } = require('ws');
const http = require('http');
const uuidv = require('uuid').v4;

//spinning http server and websocket server
const server = http.createServer();
const wsServer = new WebSocketServer({ server });
const port = 8000;
server.listen(port, () => {
    console.log(`WebSocket server is running on port ${port}`);
});

//maintain active clients
const clients = {};
//maintain active users????
const users = {};

//Event types
const typesDef = {
    USER_EVENT: 'userevent'
}

function broadcastMessage(json) {
    //send message to all connected clients
    const data = JSON.stringify(json);
    for(let userId in clients) {
        let client = clients[userId];
        if(client.readyState == WebSocket.OPEN) {
            client.send(data);
        }
    };
}

function handleMessage(message, userId) {
    const dataFromClient = JSON.parse(message.toString());
    const json = { type: dataFromClient.type };
    if(dataFromClient.type === typesDef.USER_EVENT) {
        users[userId] = dataFromClient;
        //do stuff with user
    }
    broadcastMessage(json);
}

//delete client from active lists
function handleDisconnect(userId) {
    console.log(`${userId} disconnected.`);
    const json = { type: typesDef.USER_EVENT };
    json.data = { users };
    delete clients[userId];
    delete users[userId];
    broadcastMessage(json);
}

//new client connection request received
wsServer.on('connection', function(connection) {
    //generate unique Id for every user
    const userId = uuidv4();
    console.log('Recieved a new connection');

    //store the new connection and handle messages and what not
    clients[userId] = connection;
    console.log(`${userId} connected.`);
    connection.on('message', (message) => handleMessage(message, userId));
    //user disconnected
    connection.on('close', () => handleDisconnect(userId));
});