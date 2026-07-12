import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const FileUploader = ({ onTextExtracted }) => {
  const [uploading, setUploading] = useState(false);
  const [filename, setFilename] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Please upload a file under 10MB.');
      return;
    }

    setFilename(file.name);
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      onTextExtracted(response.data.text, file.name);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to process document. Please try again.';
      alert(errorMessage);
      setFilename('');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onTextExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: 10485760
  });

  return (
    <div 
      {...getRootProps()} 
      className={`upload-area ${isDragActive ? 'drag-active' : ''}`}
    >
      <input {...getInputProps()} />
      
      {uploading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Processing your document...</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px' }}>{uploadProgress}%</p>
        </div>
      ) : (
        <>
          <div className="upload-icon">📄</div>
          <p className="upload-title">
            {isDragActive ? 'Drop your file here' : 'Drag & drop your document'}
          </p>
          <p className="upload-subtitle">or click to browse (PDF, PNG, JPG) - Max 10MB</p>
          {filename && (
            <div className="file-status">
              <span>✅</span> {filename} uploaded successfully
            </div>
          )}
          <div className="upload-formats">
            <span>📄 PDF</span>
            <span>🖼️ PNG</span>
            <span>📷 JPG</span>
          </div>
        </>
      )}
    </div>
  );
};

export default FileUploader;