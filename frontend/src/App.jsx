import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import SummaryGenerator from './components/SummaryGenerator';
import NameAnimation from './components/NameAnimation';

function App() {
  const [extractedText, setExtractedText] = useState('');
  const [filename, setFilename] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [showAnimation, setShowAnimation] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleTextExtracted = (text, name, detectedLang = 'en') => {
    setExtractedText(text);
    setFilename(name);
    setDetectedLanguage(detectedLang);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
  };

  // Replace "Your Name" with your actual name
  const YOUR_NAME = "Saqib Sayyed";

  return (
    <>
      {/* Name Animation Overlay */}
      {showAnimation && (
        <NameAnimation 
          name={YOUR_NAME} 
          onComplete={handleAnimationComplete}
        />
      )}

      {/* Main App */}
      <div className="app-container" style={{ 
        opacity: showAnimation ? 0 : 1,
        transition: 'opacity 0.5s ease'
      }}>
        <button className="theme-toggle" onClick={toggleTheme}>
          <span className="icon">{isDark ? '☀️' : '🌙'}</span>
          <span>{isDark ? 'Light' : 'Dark'} Mode</span>
        </button>

        <div className="bg-animated"></div>

        <div className="particles">
          {[...Array(20)].map((_, i) => {
            const size = Math.random() * 4 + 2;
            const duration = Math.random() * 20 + 15;
            const delay = Math.random() * 15;
            const left = Math.random() * 100;
            return (
              <div
                key={i}
                className="particle"
                style={{
                  width: size + 'px',
                  height: size + 'px',
                  left: left + '%',
                  animationDuration: duration + 's',
                  animationDelay: delay + 's',
                  opacity: Math.random() * 0.3 + 0.1,
                }}
              />
            );
          })}
        </div>

        <header className="header">
          <div className="header-badge">✨ AI-Powered</div>
          <h1>
            Document Summary
            <span>Assistant</span>
          </h1>
          <p>Upload any PDF or image and get an intelligent summary in seconds</p>
          <p style={{ fontSize: '14px', color: 'var(--text-light)', marginTop: '8px' }}>
            🌐 Supports 20+ languages • 💬 Chat with your document
          </p>
        </header>

        <div className="upload-card">
          <FileUploader onTextExtracted={handleTextExtracted} />
        </div>
        
        {extractedText && (
          <SummaryGenerator 
            text={extractedText} 
            filename={filename}
            detectedLanguage={detectedLanguage}
          />
        )}
      </div>
    </>
  );
}

export default App;