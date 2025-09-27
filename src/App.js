import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [apiKey, setApiKey] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const apiInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Detect if running in PWA mode
  useEffect(() => {
    const isInStandaloneMode = () => {
      return ('standalone' in window.navigator) && (window.navigator.standalone);
    };
    
    setIsPWA(isInStandaloneMode());
    
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Focus input when needed
  useEffect(() => {
    if (inputRef.current && apiKey) {
      // Small delay to ensure focus works in PWA mode
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [messages, apiKey]);

  // Focus API input when in PWA mode
  useEffect(() => {
    if (isPWA && !apiKey && apiInputRef.current) {
      setTimeout(() => {
        apiInputRef.current.focus();
      }, 300);
    }
  }, [isPWA, apiKey]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      setTimeout(() => {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }, 100);
    }
  }, [messages, isLoading]);

  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
    }
  };

  const handleResetApiKey = () => {
    setApiKey('');
    localStorage.removeItem('gemini_api_key');
    // Focus API input after reset in PWA mode
    if (isPWA && apiInputRef.current) {
      setTimeout(() => {
        apiInputRef.current.focus();
      }, 100);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const messagesForApi = [...messages, userMessage];
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messagesForApi.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          })),
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const responseText = data.candidates[0].content.parts[0].text;

      const aiMessage = {
        text: responseText,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      
      const errorMessage = {
        text: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        sender: 'ai',
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Special handler for API input in PWA mode
  const handleApiInputChange = (e) => {
    setApiKey(e.target.value);
  };

  if (!apiKey) {
    return (
      <div className="api-container">
        <div className="api-card">
          <div className="logo">AI</div>
          <h1>AI Asisten</h1>
          <p>Masukkan kunci API Gemini untuk memulai</p>
          <form onSubmit={handleApiKeySubmit}>
            <input
              ref={apiInputRef}
              type="password"
              value={apiKey}
              onChange={handleApiInputChange}
              placeholder="Masukkan kunci API Gemini"
              className="api-input"
              required
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <button type="submit" className="api-button">Mulai</button>
          </form>
          <div className="help-text">
            Dapatkan kunci API di <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
          </div>
          {isPWA && (
            <div className="pwa-notice">
              <p>Anda membuka aplikasi dari Home Screen. Jika input tidak berfungsi, coba buka melalui browser Safari.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fixed Header */}
      <div className="chat-header">
        <div className="header-title">
          <div className="logo">AI</div>
          <h2>AI Asisten</h2>
        </div>
        <div className="header-actions">
          <button onClick={handleClearChat} className="icon-button" title="Hapus Percakapan">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            </svg>
          </button>
          <button onClick={handleResetApiKey} className="icon-button" title="Ganti Kunci API">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Messages Container */}
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
            </svg>
            <h3>Halo, saya AI Asisten Anda</h3>
            <p>Apa yang bisa saya bantu hari ini?</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}-message`}>
              <div className="message-content">
                <div className={`avatar ${msg.sender}-avatar`}>
                  {msg.sender === 'user' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  ) : 'AI'}
                </div>
                <div className={`bubble ${msg.isError ? 'error' : ''}`}>
                  <div className="bubble-text">{msg.text}</div>
                  <div className="bubble-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message ai-message">
            <div className="message-content">
              <div className="avatar ai-avatar">AI</div>
              <div className="bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Footer */}
      <div className="input-container">
        <div className="input-group">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan Anda..."
            className="message-input"
            rows={1}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="send-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <p className="input-info">Tekan Enter untuk mengirim, Shift+Enter untuk baris baru</p>
      </div>
    </>
  );
};

export default App;
