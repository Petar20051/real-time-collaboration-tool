import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import socket from '../socket';
import axios from 'axios';

const CollaborativeEditor = ({ roomId }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    const quill = new Quill(editorRef.current, {
      theme: 'snow',
    });

    // Fetch existing document content
    const loadDocument = async () => {
      try {
        const response = await axios.get(`/api/documents/${roomId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        quill.setContents(response.data.content); // Set document content
      } catch (err) {
        console.error('Error loading document:', err);
      }
    };

    loadDocument();

    // Join the room
    socket.emit('join-room', roomId);

    quill.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user') {
        socket.emit('send-changes', delta, roomId);
      }
    });

    socket.on('receive-changes', (delta) => {
      quill.updateContents(delta);
    });

    // Periodically save the document
    const saveInterval = setInterval(async () => {
      try {
        const content = quill.getContents();
        await axios.post(
          `/api/documents/${roomId}`,
          { content },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );
      } catch (err) {
        console.error('Error saving document:', err);
      }
    }, 2000);

    return () => {
      socket.off('receive-changes');
      clearInterval(saveInterval);
    };
  }, [roomId]);

  return <div ref={editorRef} style={{ height: '500px', margin: '20px auto', border: '1px solid #ccc' }} />;
};

export default CollaborativeEditor;
