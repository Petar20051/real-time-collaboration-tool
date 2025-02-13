import React, { useEffect, useRef, useState, useCallback } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import '../styles/CollaborativeEditor.css';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import socket from '../socket';
import CursorOverlay from './CursorOverlay';



const CollaborativeEditor = ({ roomId }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [editingUsers, setEditingUsers] = useState([]);
  const editTimeouts = useRef({});
  const [isOffline, setIsOffline] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versionName, setVersionName] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [cursors, setCursors] = useState({});
  
   
  const currentDocument = useRef(null);

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
      
      quillRef.current.on('selection-change', async (range) => {
        if (range) {
          const bounds = quillRef.current.getBounds(range.index);
          const userId = getUserIdFromToken();
      
          if (!userId) return;
      
          const username = await fetchUsername(userId);
      
          socket.emit('update-cursor', {
            roomId,
            userId,
            cursor: {
              index: range.index,
              username,
              position: { left: bounds.left, top: bounds.top }
            },
          });
        }
      });
      
      

      
      

      quillRef.current.on('text-change', async () => {
        const content = quillRef.current.getContents();
        const username = localStorage.getItem('username');
        const token = localStorage.getItem('authToken');

        if (!token) {
          console.error('❌ No authentication token found.');
          return;
        }

        if (isOffline) {
          setPendingChanges((prev) => [...prev, content]);
          return;
        }

        try {
          await axios.post(
            `http://localhost:4000/api/documents/${roomId}`,
            { content },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          socket.emit('document-updated', { roomId, content });

          socket.emit('user-start-editing', { roomId, username });

          if (editTimeouts.current[username]) {
            clearTimeout(editTimeouts.current[username]);
          }

          editTimeouts.current[username] = setTimeout(() => {
            socket.emit('user-stop-editing', { roomId, username });
          }, 5000);

          currentDocument.current = content;
        } catch (error) {
          console.error('❌ Error saving document:', error.response?.data || error.message);
        }
      });

      socket.on('document-updated', (content) => {
        quillRef.current.setContents(content);
        currentDocument.current = content;
      });

      

      socket.on('editing-users', (users) => {
        setEditingUsers(users);
      });
    }
     
    const getUserIdFromToken = () => {
      const token = sessionStorage.getItem('authToken'); // ✅ Use correct key name
      if (!token) return null;
    
      try {
        const decoded = jwtDecode(token);
        console.log("✅ Decoded token:", decoded);
        return decoded.id || null;
      } catch (error) {
        console.error("❌ Error decoding token:", error.message);
        return null;
      }
    };
    
    const fetchUsername = async () => {
      const token = sessionStorage.getItem('authToken'); // ✅ Ensure correct key
      if (!token) {
        console.warn("⚠ No token found in sessionStorage.");
        return "Unknown User";
      }
    
      try {
        const response = await axios.get('http://localhost:4000/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
    
        console.log("👤 Fetched username:", response.data.username);
        return response.data.username || "Unknown User";
      } catch (error) {
        console.error("❌ Error fetching username:", error.response?.data || error.message);
        
        if (error.response?.status === 401) {
          console.warn("⚠ Unauthorized request. Clearing token.");
          sessionStorage.removeItem('authToken'); 
        }
        
        return "Unknown User";
      }
    };
    
    

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
          currentDocument.current = response.data.content;
          console.log('✅ Document loaded successfully.');
        }
      } catch (error) {
        console.error('❌ Error loading document:', error.response?.data || error.message);
      }
    };

    

    const loadVersions = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await axios.get(
          `http://localhost:4000/api/documents/${roomId}/versions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setVersions(response.data.reverse());
      } catch (error) {
        console.error('❌ Error fetching versions:', error.response?.data || error.message);
      }
    };

    const loadComments = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await axios.get(
          `http://localhost:4000/api/comments/${roomId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setComments(response.data);
      } catch (error) {
        console.error('❌ Error fetching comments:', error.response?.data || error.message);
      }
    };

    loadDocument();
    loadVersions();
    loadComments();

    socket.on('update-cursor', ({ userId, cursor }) => {
      console.log(`Cursor update received from ${userId}`, cursor); 
      setCursors((prev) => ({
          ...prev,
          [userId]: cursor,
      }));
  });
  
    


    socket.on('new-comment', (comment) => {
      setComments((prevComments) => [...prevComments, comment]);
    });

    return () => {
      socket.off('document-updated');
      socket.off('editing-users');
      socket.off('new-comment');
      socket.off('update-cursor');
    };
  }, [roomId, isOffline]);

  const saveNewVersion = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
  
      const content = quillRef.current.getContents();
      const trimmedVersionName = versionName.trim();
      const finalVersionName = trimmedVersionName || `Version ${versions.length + 1}`;
  
      await axios.post(
        `http://localhost:4000/api/documents/${roomId}/save-version`,
        { content, name: finalVersionName }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      alert('✅ Version saved successfully!');
      setVersionName('');
  
      const response = await axios.get(
        `http://localhost:4000/api/documents/${roomId}/versions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setVersions(response.data.reverse());
    } catch (error) {
      console.error('❌ Error saving version:', error.response?.data || error.message);
    }
  };
  
  const postComment = async () => {
    if (!newComment.trim()) return;
  
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ No authentication token found.');
        return;
      }
  
      socket.emit('add-comment', { roomId, content: newComment, token });
      setNewComment(''); // ✅ Clear input after sending

    } catch (error) {
      console.error('❌ Error posting comment:', error.response?.data || error.message);
    }
  };
  

  const restoreVersion = () => {
    if (selectedVersion) {
      quillRef.current.setContents(selectedVersion.content);
    }
  };

  const syncOfflineChanges = useCallback(() => {
    if (pendingChanges.length > 0) {
      pendingChanges.forEach((content) => {
        socket.emit('document-updated', { roomId, content });
      });
      setPendingChanges([]);
    }
  }, [roomId, pendingChanges]);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
    };

    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineChanges();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [syncOfflineChanges]);

  useEffect(() => {
    const handleCommentDeleted = (deletedCommentId) => {
      setComments((prevComments) => prevComments.filter(comment => comment._id !== deletedCommentId));
    };
  
    socket.on('comment-deleted', handleCommentDeleted);
  
    return () => {
      socket.off('comment-deleted', handleCommentDeleted); // ✅ Ensures cleanup
    };
  }, []);
  

  

  const deleteComment = useCallback((commentId) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('❌ No authentication token found.');
      return;
    }
  
    if (!commentId) {
      console.error('❌ Invalid comment ID.');
      return;
    }
  
    // ✅ Now sending token properly
    socket.emit('delete-comment', { commentId, token });
  }, []);
  
  
  

  return (
    <div className="editor-container">
      {isOffline && <p className="offline-warning">⚠️ You are offline. Changes will sync when you reconnect.</p>}

      <div ref={editorRef} className="editor"></div>
      <CursorOverlay cursors={cursors} />

      <div className="editor-footer">
        <input
          type="text"
          placeholder="Version Name"
          value={versionName}
          onChange={(e) => setVersionName(e.target.value)}
        />
        <button onClick={saveNewVersion} className="save-version-btn">
          Save Version
        </button>

        <h4>Document Version History</h4>
        <select onChange={(e) => setSelectedVersion(JSON.parse(e.target.value))}>
          <option value="" disabled selected hidden >Select a version</option>
          {versions.map((version, index) => (
            <option key={index} value={JSON.stringify(version)}>
              {version.name} - {new Date(version.timestamp).toLocaleString()}
            </option>
          ))}
        </select>
        <button onClick={restoreVersion} disabled={!selectedVersion}>
          Restore Version
        </button>
      </div>
       
      <div className="comment-section">
      <h4>Comments</h4>
      <ul>
  {comments.map((comment) => (
    <li key={comment._id}>
      {comment.content}
      <button onClick={() => deleteComment(comment._id)} className="delete-btn">❌</button> 
    </li>
  ))}
</ul>

    <input
      type="text"
      placeholder="Add a comment"
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
    />
    <button onClick={postComment}>Post</button>
      </div>


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
