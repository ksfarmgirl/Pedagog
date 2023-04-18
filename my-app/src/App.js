import './App.css';
import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import useWebSocket from 'react-use-websocket';

const WS_URL = 'ws://127.0.0.1:8000';

function isUserEvent(message) {
  let evt = JSON.parse(message.data);
  return evt.type === 'userevent';
}

export default function MultilineTextFields() {
  useWebSocket(WS_URL, {
    onOpen: () => {
      console.log('WebSocket connection established.');
    }
  });

  return (
    <Box
      component="form"
      sx={{
        '& .MuiTextField-root': { m: 1, width: '25ch' },
      }}
      noValidate
      autoComplete="off"
    >
      <div><header>Hello WebSockets!</header></div>
      <div>
        <TextField
          id="outlined-multiline-static"
          label="Code"
          multiline
          rows={4}
          defaultValue="Code something amazing!"
        />
      </div>
    </Box>
  );
}

function MessageFromServer() {
  console.log('server said something to you...');
  const { JsonMessage } = useWebSocket(WS_URL, {
    share: true,
    filter: isUserEvent
  });
  //do somethibg with the jsonMessage
}

function Users() {
  const { JsonMessage } = useWebSocket(WS_URL, {
    share: true,
    filter: isUserEvent
  });
}
