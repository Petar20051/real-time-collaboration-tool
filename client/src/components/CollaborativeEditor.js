import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import '../styles/CollaborativeEditor.css';
import axios from 'axios';
import socket from '../socket';

const CollaborativeEditor = ({ roomId }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [editingUsers, setEditingUsers] = useState([]);
  const editTimeouts = useRef({}); // Store user stop editing timeouts

  useEffect(() => {
    if (!roomId) {
      console.error('❌ Room ID is not provided.');
      return;
    }

    if (!quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            ['image', 'code-block'],
          ],
        },
      });

      // **Detect user typing and trigger "user-start-editing"**
      quillRef.current.on('text-change', async () => {
        const content = quillRef.current.getContents();
        const username = localStorage.getItem('username');
        const token = localStorage.getItem('authToken');

        if (!token) {
          console.error('❌ No authentication token found.');
          return;
        }

        try {
          await axios.post(
            `http://localhost:4000/api/documents/${roomId}`,
            { content },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          socket.emit('document-updated', { roomId, content });

          // **Trigger user-start-editing event**
          socket.emit('user-start-editing', { roomId, username });

          // **Reset timeout before removing user**
          if (editTimeouts.current[username]) {
            clearTimeout(editTimeouts.current[username]);
          }

          // **Trigger user-stop-editing event after 5 seconds of inactivity**
          editTimeouts.current[username] = setTimeout(() => {
            socket.emit('user-stop-editing', { roomId, username });
          }, 5000);
        } catch (error) {
          console.error('❌ Error saving document:', error.response?.data || error.message);
        }
      });

      // **Receive document updates**
      socket.on('document-updated', (content) => {
        quillRef.current.setContents(content);
      });

      // **Listen for editing users updates**
      socket.on('editing-users', (users) => {
        setEditingUsers(users);
      });
    }

    // **Load document on first render**
    const loadDocument = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('❌ No authentication token found.');
          return;
        }

        const response = await axios.get(
          `http://localhost:4000/api/documents/${roomId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data?.content) {
          quillRef.current.setContents(response.data.content);
          console.log('✅ Document loaded successfully.');
        }
      } catch (error) {
        console.error('❌ Error loading document:', error.response?.data || error.message);
      }
    };

    loadDocument();

    return () => {
      socket.off('document-updated');
      socket.off('editing-users');
    };
  }, [roomId]);

  return (
    <div className="editor-container">
      <div ref={editorRef} className="editor"></div>
      <div className="editing-users">
        <h4>Currently Editing:</h4>
        {editingUsers.length > 0 ? (
          <ul>
            {editingUsers.map((user, index) => (
              <li key={index}>{user}</li>
            ))}
          </ul>
        ) : (
          <p>No one is editing right now.</p>
        )}
      </div>
    </div>
  );
};

export default CollaborativeEditor;
