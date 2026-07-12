import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SummaryGenerator = ({ text, filename, detectedLanguage }) => {
  const [summary, setSummary] = useState('');
  const [length, setLength] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wordCount, setWordCount] = useState(0);
  
  // Chat states
  const [chatMode, setChatMode] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId] = useState(() => Date.now().toString());
  
  // Language states
  const [languages, setLanguages] = useState({});
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [sourceLanguage, setSourceLanguage] = useState(detectedLanguage || 'en');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  
  // Fetch languages on mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await axios.get(`${API_URL}/languages`);
        setLanguages(response.data.languages);
      } catch (error) {
        console.error('Failed to fetch languages:', error);
      }
    };
    fetchLanguages();
  }, []);

  // Load chat history
  useEffect(() => {
    if (chatMode && text) {
      loadChatHistory();
    }
  }, [chatMode]);

  const loadChatHistory = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${API_URL}/chat/history/${sessionId}`);
      setChatHistory(response.data.history || []);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const generateSummary = async () => {
    if (!text) {
      setError('No text to summarize');
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');
    setWordCount(0);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${API_URL}/summarize`, {
        text: text,
        length: length,
        language: targetLanguage
      });
      
      setSummary(response.data.summary);
      setWordCount(response.data.word_count || 0);
      setSourceLanguage(response.data.source_language || 'en');
      
      // Show language info
      if (response.data.source_language_name) {
        console.log(`📄 Detected: ${response.data.source_language_name} → ${response.data.target_language_name}`);
      }
    } catch (error) {
      console.error('Summary error:', error);
      let errorMessage = 'Failed to generate summary. Please try again.';
      
      if (error.response) {
        if (error.response.status === 429) {
          errorMessage = '⏳ Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setChatLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${API_URL}/chat`, {
        text: text,
        question: question,
        session_id: sessionId,
        language: targetLanguage
      });
      
      setChatHistory([...chatHistory, {
        question: question,
        answer: response.data.answer
      }]);
      setQuestion('');
      
      // Scroll to bottom of chat
      setTimeout(() => {
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
      
    } catch (error) {
      console.error('Chat error:', error);
      let errorMessage = 'Failed to get answer. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      setError(errorMessage);
    } finally {
      setChatLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      await axios.delete(`${API_URL}/chat/history/${sessionId}`);
      setChatHistory([]);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const copyToClipboard = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    alert('✅ Summary copied to clipboard!');
  };

  const downloadSummary = () => {
    if (!summary) return;
    const element = document.createElement('a');
    const file = new Blob([summary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `summary-${filename || 'document'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getLengthLabel = (length) => {
    const labels = {
      short: '📄 Short (2-3 sentences)',
      medium: '📄 Medium (2-3 paragraphs)',
      long: '📄 Long (Comprehensive)'
    };
    return labels[length] || length;
  };

  return (
    <div className="summary-card">
      <div className="summary-header">
        <h2 className="summary-title">
          <span className="emoji">📝</span> Document Summary
        </h2>
        {filename && (
          <span className="summary-filename">{filename}</span>
        )}
      </div>

      {text && (
        <div className="text-stats">
          <span>
            Extracted text: <strong>{text.length.toLocaleString()} characters</strong>
            <span style={{ marginLeft: '16px', opacity: 0.5 }}>|</span>
            <span style={{ marginLeft: '16px' }}>
              Words: <strong>{text.split(/\s+/).length.toLocaleString()}</strong>
            </span>
            {sourceLanguage && sourceLanguage !== 'en' && (
              <>
                <span style={{ marginLeft: '16px', opacity: 0.5 }}>|</span>
                <span style={{ marginLeft: '16px' }}>
                  🌐 Detected: <strong>{languages[sourceLanguage] || sourceLanguage}</strong>
                </span>
              </>
            )}
          </span>
        </div>
      )}

      {/* Language Selector */}
      <div style={{ marginBottom: '16px' }}>
        <button 
          onClick={() => setShowLanguageSelector(!showLanguageSelector)}
          className="language-toggle"
          style={{
            padding: '6px 14px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          🌐 {languages[targetLanguage] || 'English'}
        </button>
        
        {showLanguageSelector && (
          <div className="language-selector" style={{
            marginTop: '8px',
            padding: '12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            maxHeight: '200px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '6px'
          }}>
            {Object.entries(languages).map(([code, name]) => (
              <button
                key={code}
                onClick={() => {
                  setTargetLanguage(code);
                  setShowLanguageSelector(false);
                }}
                style={{
                  padding: '4px 10px',
                  background: targetLanguage === code ? 'var(--accent-color)' : 'var(--bg-secondary)',
                  color: targetLanguage === code ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s'
                }}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary Controls */}
      <div className="controls">
        <div style={{ flex: 1, minWidth: '200px' }}>
          <select
            value={length}
            onChange={(e) => setLength(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="short">📄 Short (2-3 sentences)</option>
            <option value="medium">📄 Medium (2-3 paragraphs)</option>
            <option value="long">📄 Long (Comprehensive)</option>
          </select>
        </div>

        <button
          onClick={generateSummary}
          disabled={loading || !text}
        >
          {loading ? '⏳ Generating...' : '🚀 Generate Summary'}
        </button>
      </div>

      {/* Toggle Chat Mode */}
      {text && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setChatMode(!chatMode)}
            style={{
              padding: '8px 16px',
              background: chatMode ? 'var(--accent-color)' : 'var(--bg-secondary)',
              color: chatMode ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s'
            }}
          >
            {chatMode ? '💬 Hide Chat' : '💬 Chat with Document'}
          </button>
        </div>
      )}

      {error && (
        <div className="error-box">
          <p className="error-title">❌ Error</p>
          <p className="error-message">{error}</p>
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Creating your {length} summary...</p>
          <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
            In {languages[targetLanguage] || 'English'}
          </p>
        </div>
      )}

      {summary && !loading && (
        <div className="summary-output">
          <div className="output-header">
            <div>
              <h3>{getLengthLabel(length)} Summary</h3>
              {wordCount > 0 && (
                <span style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-light)',
                  marginLeft: '8px'
                }}>
                  ({wordCount} words)
                </span>
              )}
              {targetLanguage && (
                <span style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-light)',
                  marginLeft: '8px'
                }}>
                  🌐 {languages[targetLanguage] || 'English'}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="copy-btn" onClick={copyToClipboard}>
                📋 Copy
              </button>
              <button className="copy-btn" onClick={downloadSummary}>
                💾 Download
              </button>
            </div>
          </div>
          <div className="summary-content">
            {summary}
          </div>
        </div>
      )}

      {/* Chat Section */}
      {chatMode && text && (
        <div className="chat-section" style={{
          marginTop: '24px',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px'
        }}>
          <div className="chat-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{ color: 'var(--text-primary)' }}>
              💬 Chat with Document
              <span style={{ 
                fontSize: '12px', 
                color: 'var(--text-light)',
                marginLeft: '12px',
                fontWeight: 'normal'
              }}>
                Ask questions about the content
              </span>
            </h3>
            {chatHistory.length > 0 && (
              <button
                onClick={clearChat}
                style={{
                  padding: '4px 12px',
                  background: 'var(--error-bg)',
                  color: 'var(--error-text)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Clear History
              </button>
            )}
          </div>

          {/* Chat History */}
          <div 
            id="chat-container"
            className="chat-history"
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '12px',
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              marginBottom: '12px',
              minHeight: chatHistory.length === 0 ? '100px' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {chatHistory.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: 'var(--text-light)',
                padding: '20px',
                fontSize: '14px'
              }}>
                💡 Ask a question about your document to get started!
              </div>
            ) : (
              chatHistory.map((chat, idx) => (
                <div key={idx}>
                  <div style={{
                    background: 'var(--accent-color)',
                    color: 'white',
                    padding: '10px 14px',
                    borderRadius: '12px 12px 12px 4px',
                    maxWidth: '80%',
                    alignSelf: 'flex-start',
                    marginBottom: '6px'
                  }}>
                    <strong>❓ You:</strong> {chat.question}
                  </div>
                  <div style={{
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '12px 12px 4px 12px',
                    maxWidth: '80%',
                    alignSelf: 'flex-end',
                    border: '1px solid var(--border-color)',
                    marginLeft: 'auto'
                  }}>
                    <strong>🤖 Assistant:</strong> {chat.answer}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chat Input */}
          <div className="chat-input" style={{
            display: 'flex',
            gap: '10px'
          }}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
              placeholder="Ask a question about your document..."
              style={{
                flex: 1,
                padding: '10px 16px',
                border: '1px solid var(--input-border)',
                borderRadius: '12px',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              disabled={chatLoading}
            />
            <button
              onClick={askQuestion}
              disabled={chatLoading || !question.trim()}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, var(--accent-color), #f093fb)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s',
                opacity: chatLoading || !question.trim() ? 0.5 : 1
              }}
            >
              {chatLoading ? '⏳ Thinking...' : 'Send 💬'}
            </button>
          </div>
          
          <div style={{
            fontSize: '11px',
            color: 'var(--text-light)',
            marginTop: '8px',
            textAlign: 'center'
          }}>
            💡 Questions will be answered based on the document content only
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryGenerator;