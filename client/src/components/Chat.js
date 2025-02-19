import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import '../styles/Chat.css';

const Chat = ({ roomId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null); 

  useEffect(() => {
    
    socket.on('receive-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      scrollToBottom(); 
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
      scrollToBottom(); 
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100); 
  };

  return (
    <div className="chat-container">
      <div className="chat-body">
        {messages.map((msg, index) => (
          <p key={index} className="chat-message">
            <strong>{msg.username === socket.id ? 'Me' : msg.username}:</strong> {msg.content}
          </p>
        ))}
        <div ref={chatEndRef} /> 
      </div>
      <div className="chat-input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
          onKeyPress={(e) => e.key === "Enter" && sendMessage()} 
        />
        <button onClick={sendMessage} className="chat-send-btn">Send</button>
      </div>
    </div>
  );
};

export default Chat;
