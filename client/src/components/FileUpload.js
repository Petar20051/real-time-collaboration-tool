import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles/FileUpload.css';

const FileUpload = ({ roomId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [sharedFiles, setSharedFiles] = useState([]);
  const token = localStorage.getItem('authToken'); 

 
  const fetchSharedFiles = useCallback(async () => {
    if (!roomId) return;
    
    try {
      const response = await axios.get(
        `http://localhost:4000/api/files/${roomId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSharedFiles(response.data.files);
    } catch (error) {
      console.error('❌ Error fetching shared files:', error.response?.data || error.message);
    }
  }, [roomId, token]);

  useEffect(() => {
    fetchSharedFiles();
  }, [fetchSharedFiles]); 

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await axios.post(
        `http://localhost:4000/api/files/${roomId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('✅ File uploaded successfully!');
      fetchSharedFiles(); 
      setSelectedFile(null);
    } catch (error) {
      console.error('❌ Error uploading file:', error.response?.data || error.message);
    }
  };

  return (
    <div className="file-upload-container">
      <h3>File Sharing</h3>
      <div className="file-upload-controls">
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleFileUpload} className="upload-button">
          Upload
        </button>
      </div>
      <div className="shared-files">
        <h4>Shared Files</h4>
        {sharedFiles.length > 0 ? (
        <ul>
        {sharedFiles.map((file) => (
          <li key={file._id}>
            <a
              href={`http://localhost:4000/api/files/download/${file._id}`} 
              download={file.fileName}
            >
              {file.fileName} ⬇️
            </a>
          </li>
        ))}
      </ul>
      
        ) : (
          <p>No files shared yet.</p>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
