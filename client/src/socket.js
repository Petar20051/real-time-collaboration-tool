import { io } from 'socket.io-client';

const URL = 'http://localhost:4000'; // Backend server URL
const socket = io(URL);


socket.on('update-cursor', (data) => {
  console.log('🔄 Cursor update received:', data);
});

export default socket;
