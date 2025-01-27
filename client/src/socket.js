// client/src/socket.js

import { io } from 'socket.io-client';

const URL = 'http://localhost:4000'; // Backend server URL
const socket = io(URL);

export default socket;
