import React, { useState, useEffect } from 'react';
import socket from '../socket';
import '../styles/Chat.css';

const Chat = ({ roomId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
   
    socket.on('receive-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('receive-message');
    };
  }, []);

  const sendMessage = () => {
    if (input.trim()) {
      const message = { roomId, content: input }; 

     
      socket.emit('send-message', message);

      
      setInput('');
    }
  };

  return (
    <div className="chat-container">
      
      <div className="chat-body">
        {messages.map((msg, index) => (
          <p key={index} className="chat-message">
            <strong>{msg.username === socket.id ? 'Me' : msg.username}:</strong> {msg.content}
          </p>
        ))}
      </div>
      <div className="chat-input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button onClick={sendMessage} className="chat-send-btn">Send</button>
      </div>
    </div>
  );
};

export default Chat;
