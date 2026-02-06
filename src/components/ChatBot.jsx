import React, { useState, useEffect, useRef } from "react";
import { IoSend, IoAttach, IoClose, IoDocument, IoImage, IoMusicalNote, IoDocumentText } from "react-icons/io5";
import CONFIG from "../config";
import { getMarketIntelligence } from "../api/marketIntelligence";
import MarketIntelligence from "./MarketIntelligence";
import Spinner from "./Spinner";
import { toast } from "sonner";

function ChatBot() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isReportMode, setIsReportMode] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // File type validation
  const acceptedFileTypes = {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    excel: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/m4a'],
    text: ['text/plain', 'text/csv']
  };

  const getAllAcceptedTypes = () => {
    return [
      ...acceptedFileTypes.images,
      ...acceptedFileTypes.documents,
      ...acceptedFileTypes.excel,
      ...acceptedFileTypes.audio,
      ...acceptedFileTypes.text
    ];
  };

  const getFileIcon = (fileType) => {
    if (acceptedFileTypes.images.includes(fileType)) {
      return <IoImage className="w-5 h-5" />;
    } else if (acceptedFileTypes.documents.includes(fileType) || acceptedFileTypes.excel.includes(fileType)) {
      return <IoDocumentText className="w-5 h-5" />;
    } else if (acceptedFileTypes.audio.includes(fileType)) {
      return <IoMusicalNote className="w-5 h-5" />;
    }
    return <IoDocument className="w-5 h-5" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name}: File size exceeds 50MB limit`);
        return;
      }

      // Check file type
      if (!getAllAcceptedTypes().includes(file.type)) {
        errors.push(`${file.name}: File type not supported`);
        return;
      }

      // Create preview for images
      if (acceptedFileTypes.images.includes(file.type)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachedFiles(prev => prev.map(f => 
            f.file.name === file.name ? { ...f, preview: e.target.result } : f
          ));
        };
        reader.readAsDataURL(file);
      }

      validFiles.push({
        file,
        id: Date.now() + Math.random(),
        preview: null,
        uploaded: false,
        uploadUrl: null
      });
    });

    if (errors.length > 0) {
      toast.error("Some files could not be added:\n" + errors.join("\n"));
    }

    if (validFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...validFiles]);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFile = async (fileObj) => {
    try {
      const formData = new FormData();
      formData.append('file', fileObj.file);

      const response = await fetch(`${CONFIG.API_BASE_URL}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        ...fileObj,
        uploaded: true,
        uploadUrl: data.url,
        docId: data.doc_id,
        filename: data.filename
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const uploadAllFiles = async () => {
    if (attachedFiles.length === 0) return [];

    setUploadingFiles(true);
    const uploadPromises = attachedFiles.map(fileObj => uploadFile(fileObj));
    
    try {
      const uploadedFiles = await Promise.all(uploadPromises);
      return uploadedFiles;
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Some files failed to upload. Please try again.');
      return [];
    } finally {
      setUploadingFiles(false);
    }
  };

  const handlePdfDownload = (reportId) => {
    if (!reportId) return;
    const finalUrl = `${CONFIG.API_BASE_URL}/reports/download/${reportId}`;
    console.log("[PDF Download] Opening:", finalUrl);
    window.open(finalUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setPrompt("");
    setIsReportMode(false);
    setCompanyName("");
    setAttachedFiles([]);
  };

  const onSelectSession = async (id) => {
    setLoading(true);
    setSessionId(id);
    setIsReportMode(false);
    setAttachedFiles([]);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/sessions/${id}`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.session && data.session.messages) {
        setMessages(data.session.messages);
      }
    } catch (err) {
      console.error("Error loading session:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (content) => {
    if (typeof content !== 'string') return content;

    // Split content into lines for processing
    const lines = content.split('\n');
    const elements = [];
    let listItems = [];
    let inList = false;

    const processText = (text) => {
      if (!text) return null;

      const parts = [];

      // Process markdown links [text](url)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let lastIndex = 0;
      let match;
      const linkMatches = [];

      while ((match = linkRegex.exec(text)) !== null) {
        linkMatches.push({
          index: match.index,
          length: match[0].length,
          text: match[1],
          url: match[2]
        });
      }

      // Process bold text **text** or __text__
      const boldRegex = /\*\*([^*]+)\*\*|__([^_]+)__/g;
      const boldMatches = [];
      while ((match = boldRegex.exec(text)) !== null) {
        boldMatches.push({
          index: match.index,
          length: match[0].length,
          text: match[1] || match[2]
        });
      }

      // Combine and sort all matches by index
      const allMatches = [
        ...linkMatches.map(m => ({ ...m, type: 'link' })),
        ...boldMatches.map(m => ({ ...m, type: 'bold' }))
      ].sort((a, b) => a.index - b.index);

      // Remove overlapping matches (prioritize links over bold)
      const filteredMatches = [];
      let currentEnd = 0;
      for (const m of allMatches) {
        if (m.index >= currentEnd) {
          filteredMatches.push(m);
          currentEnd = m.index + m.length;
        }
      }

      // Build parts array
      lastIndex = 0;
      filteredMatches.forEach((m, idx) => {
        if (m.index > lastIndex) {
          parts.push(text.substring(lastIndex, m.index));
        }
        if (m.type === 'link') {
          // Check if this is a report download link
          const isDownloadLink = m.url.includes('/reports/download/');

          if (isDownloadLink) {
            const urlParts = m.url.split('/reports/download/');
            const reportId = urlParts[1];

            parts.push(
              <button
                key={`link-${idx}`}
                onClick={(e) => {
                  e.preventDefault();
                  handlePdfDownload(reportId);
                }}
                className="text-[var(--accent)] underline font-bold hover:brightness-110 inline-block"
              >
                {m.text}
              </button>
            );
          } else {
            parts.push(
              <a
                key={`link-${idx}`}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] underline font-bold hover:brightness-110"
              >
                {m.text}
              </a>
            );
          }
        } else if (m.type === 'bold') {
          parts.push(<strong key={`bold-${idx}`}>{m.text}</strong>);
        }
        lastIndex = m.index + m.length;
      });

      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      return parts.length > 0 ? parts : text;
    };

    lines.forEach((line, lineIdx) => {
      const trimmedLine = line.trim();

      // Handle headers (# Header, ## Header, ### Header)
      if (trimmedLine.match(/^#{1,6}\s+/)) {
        if (inList && listItems.length > 0) {
          elements.push(
            <ul key={`list-${lineIdx}`} className="list-disc list-inside space-y-1 my-2 ml-4">
              {listItems.map((item, idx) => (
                <li key={idx} className="text-sm">{processText(item)}</li>
              ))}
            </ul>
          );
          listItems = [];
          inList = false;
        }

        const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
          const level = Math.min(headerMatch[1].length, 6);
          const headerText = headerMatch[2].trim();
          const className = `font-bold ${level === 1 ? 'text-lg mt-4 mb-2' : level === 2 ? 'text-base mt-3 mb-2' : 'text-sm mt-2 mb-1'}`;

          // Create header element dynamically using React.createElement
          const headerTag = `h${level}`;
          elements.push(
            React.createElement(
              headerTag,
              { key: `header-${lineIdx}`, className },
              processText(headerText)
            )
          );
        }
        return;
      }

      // Handle list items (- item, * item, 1. item)
      if (trimmedLine.match(/^[-*]\s+/) || trimmedLine.match(/^\d+\.\s+/)) {
        const listText = trimmedLine.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
        listItems.push(listText);
        inList = true;
        return;
      }

      // Handle horizontal rule (---)
      if (trimmedLine.match(/^---+$/)) {
        if (inList && listItems.length > 0) {
          elements.push(
            <ul key={`list-${lineIdx}`} className="list-disc list-inside space-y-1 my-2 ml-4">
              {listItems.map((item, idx) => (
                <li key={idx} className="text-sm">{processText(item)}</li>
              ))}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        elements.push(<hr key={`hr-${lineIdx}`} className="my-3 border-[var(--border)]" />);
        return;
      }

      // Regular paragraph or empty line
      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={`list-${lineIdx}`} className="list-disc list-inside space-y-1 my-2 ml-4">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-sm">{processText(item)}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }

      if (trimmedLine) {
        elements.push(
          <p key={`para-${lineIdx}`} className="text-sm my-2 leading-relaxed">
            {processText(trimmedLine)}
          </p>
        );
      } else if (lineIdx > 0 && lines[lineIdx - 1].trim()) {
        // Add spacing for empty lines
        elements.push(<br key={`br-${lineIdx}`} />);
      }
    });

    // Handle remaining list items
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-final`} className="list-disc list-inside space-y-1 my-2 ml-4">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm">{processText(item)}</li>
          ))}
        </ul>
      );
    }

    return elements.length > 0 ? elements : content;
  };

  /**
   * Detect if a message is a market intelligence request
   * Examples: "Market intelligence for AAPL", "intelligence for ZOMATO"
   * @param {string} message - User message
   * @returns {Object|null} Object with ticker if detected, null otherwise
   */
  const detectMarketIntelligenceRequest = (message) => {
    if (!message || typeof message !== 'string') return null;

    const normalized = message.toLowerCase().trim();
    
    // Keywords that indicate market intelligence request (removed market chatter keywords)
    const keywords = [
      'market intelligence',
      'intelligence for'
    ];

    // Check if message contains any of the keywords
    const hasKeyword = keywords.some(keyword => normalized.includes(keyword));
    if (!hasKeyword) return null;

    // Extract ticker - look for patterns like "for AAPL", "for ZOMATO", "for zomato", "for Swiggy"
    // Use original message (not normalized) for ticker extraction to preserve case
    // Match alphanumeric characters (letters and numbers) in any case - explicitly match both cases
    const tickerPatterns = [
      /for\s+([A-Za-z0-9]{1,10})\b/i,  // "for AAPL", "for zomato", "for ZOMATO", "for swiggy" (up to 10 chars for longer tickers)
      /\(([A-Za-z0-9]{1,10})\)/i,        // "(AAPL)", "(ZOMATO)", "(zomato)"
      /\b([A-Za-z0-9]{1,10})\b(?!\s+for)/i, // Standalone ticker (but not followed by "for")
    ];

    for (const pattern of tickerPatterns) {
      const match = message.match(pattern); // Use original message, not normalized
      if (match && match[1]) {
        const ticker = match[1].toUpperCase().trim();
        // Validate ticker (1-10 alphanumeric characters, allowing for longer tickers)
        if (/^[A-Z0-9]{1,10}$/.test(ticker)) {
          return { ticker, detected: true };
        }
      }
    }

    // If keyword found but no ticker, return a flag to prompt user
    return { ticker: null, detected: true, needsTicker: true };
  };

  const sendMessage = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const isModeReport = isReportMode && !textOverride;
    const textToSend = textOverride || (isModeReport ? companyName : prompt);
    
    // Don't send if no message and no files
    if ((!textToSend.trim() && attachedFiles.length === 0) || loading) return;

    // Upload files first if any
    let uploadedFileInfo = [];
    if (attachedFiles.length > 0) {
      uploadedFileInfo = await uploadAllFiles();
      if (uploadedFileInfo.length === 0 && !textToSend.trim()) {
        return; // Don't send if files failed and no message
      }
    }

    const userMessage = {
      role: "user",
      content: isModeReport 
        ? `Generate research report for ${textToSend}` 
        : textToSend,
      attachments: uploadedFileInfo.length > 0 ? uploadedFileInfo.map(f => ({
        filename: f.filename,
        url: f.uploadUrl,
        type: f.file.type
      })) : []
    };
    setMessages((prev) => [...prev, userMessage]);

    // Clear attachments after sending
    setAttachedFiles([]);

    if (isModeReport) {
      setCompanyName("");
      setIsReportMode(false);
    } else {
      setPrompt("");
    }

    setLoading(true);

    // Check if this is a market intelligence request (only for non-report mode)
    if (!isModeReport) {
      const marketIntelligenceDetection = detectMarketIntelligenceRequest(textToSend);
      
        if (marketIntelligenceDetection && marketIntelligenceDetection.detected) {
        if (marketIntelligenceDetection.needsTicker) {
          // Remove thinking message and add error
          setMessages((prev) => prev.concat([{ 
            role: "assistant", 
            content: "I detected a market intelligence request, but couldn't find a ticker symbol. Please specify a ticker, for example: 'Market intelligence for AAPL' or 'Market intelligence for ZOMATO'."
          }]));
          setLoading(false);
          return;
        }

        if (marketIntelligenceDetection.ticker) {
          // Add thinking message
          const thinkingMessage = { 
            role: "assistant", 
            content: `Analyzing market intelligence for ${marketIntelligenceDetection.ticker}...`, 
            isThinking: true 
          };
          setMessages((prev) => [...prev, thinkingMessage]);

          try {
            // Fetch market intelligence
            const intelligenceData = await getMarketIntelligence(marketIntelligenceDetection.ticker);
            
            // Remove thinking message and add market intelligence response
            setMessages((prev) => prev.filter(msg => !msg.isThinking).concat([{ 
              role: "assistant", 
              content: null, // Use null to indicate this is a special message type
              marketIntelligence: intelligenceData,
              ticker: marketIntelligenceDetection.ticker
            }]));

            // Also save to chat session if we have a session ID
            if (sessionId) {
              try {
                await fetch(`${CONFIG.API_BASE_URL}/chat`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  credentials: "include",
                  body: JSON.stringify({
                    message: `Market intelligence analysis for ${marketIntelligenceDetection.ticker}`,
                    session_id: sessionId,
                    top_k: 5
                  })
                });
              } catch (sessionErr) {
                console.warn("Failed to save market intelligence to session:", sessionErr);
              }
            }
          } catch (intelligenceError) {
            console.error("Market intelligence error:", intelligenceError);
            // Remove thinking message and add error
            setMessages((prev) => prev.filter(msg => !msg.isThinking).concat([{ 
              role: "assistant", 
              content: `Error fetching market intelligence: ${intelligenceError.message || "Failed to fetch market intelligence. Please try again."}`
            }]));
          } finally {
            setLoading(false);
          }
          return; // Exit early - market intelligence handled
        }
      }
    }

    // Add thinking/generating message for regular chat/report flow
    const thinkingMessage = { role: "assistant", content: "Thinking...", isThinking: true };
    setMessages((prev) => [...prev, thinkingMessage]);

    try {
      const url = isModeReport ? `${CONFIG.API_BASE_URL}/chat/create-report` : `${CONFIG.API_BASE_URL}/chat`;
      
      // Include attachment info in the message
      const messageWithAttachments = textToSend + (uploadedFileInfo.length > 0 
        ? `\n\n[Attached ${uploadedFileInfo.length} file(s): ${uploadedFileInfo.map(f => f.filename).join(', ')}]`
        : '');

      const body = isModeReport
        ? { company_name: textToSend, session_id: sessionId }
        : { message: messageWithAttachments, session_id: sessionId, top_k: 5 };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      // Check if response is ok before parsing
      if (!response.ok) {
        let errorMessage = "Something went wrong. Please try again.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        // Remove thinking message and add error
        setMessages((prev) => prev.filter(msg => !msg.isThinking).concat([{ role: "assistant", content: `Error: ${errorMessage}` }]));
        return;
      }

      const data = await response.json();

      // Handle report generation response
      if (isModeReport && data.success && data.response) {
        // Remove thinking message and add actual response
        setMessages((prev) => prev.filter(msg => !msg.isThinking).concat([{ role: "assistant", content: data.response }]));
        if (data.session_id) setSessionId(data.session_id);
      }
      // Handle regular chat response
      else if (data.response) {
        // Remove thinking message and add actual response
        setMessages((prev) => prev.filter(msg => !msg.isThinking).concat([{ role: "assistant", content: data.response }]));
        if (data.session_id) setSessionId(data.session_id);
      }
      // Handle error response
      else if (data.error) {
        // Remove thinking message and add error
        setMessages((prev) => prev.filter(msg => !msg.isThinking).concat([{ role: "assistant", content: `Error: ${data.error}` }]));
      } else {
        // Remove thinking message and add error
        setMessages((prev) => prev.filter(msg => !msg.isThinking).concat([{ role: "assistant", content: "Unexpected response format." }]));
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage = err.message || "Something went wrong. Please check your connection.";
      // Remove thinking message and add error
      setMessages((prev) => prev.filter(msg => !msg.isThinking).concat([{ role: "assistant", content: `Error: ${errorMessage}` }]));
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = (isReportMode ? companyName.trim() === "" : prompt.trim() === "") && attachedFiles.length === 0 || loading || uploadingFiles;

  // Handler for generating report from the dedicated input
  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();
    const tickerToSend = companyName.trim();
    if (!tickerToSend || loading || uploadingFiles) return;

    // Upload files first if any
    let uploadedFileInfo = [];
    if (attachedFiles.length > 0) {
      uploadedFileInfo = await uploadAllFiles();
      if (uploadedFileInfo.length === 0 && !tickerToSend.trim()) {
        return; // Don't send if files failed and no message
      }
    }

    const userMessage = {
      role: "user",
      content: `Generate research report for ${tickerToSend}`,
      attachments: uploadedFileInfo.length > 0 ? uploadedFileInfo.map(f => ({
        filename: f.filename,
        url: f.uploadUrl,
        type: f.file.type
      })) : []
    };
    setMessages((prev) => [...prev, userMessage]);

    // Clear attachments and company name after sending
    setAttachedFiles([]);
    setCompanyName("");
    setIsReportMode(false);

    setLoading(true);

    // Add thinking/generating message for report flow
    const thinkingMessage = { role: "assistant", content: "Thinking...", isThinking: true };
    setMessages((prev) => [...prev, thinkingMessage]);

    try {
      const url = `${CONFIG.API_BASE_URL}/chat/create-report`;
      
      const body = { company_name: tickerToSend, session_id: sessionId };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      // Check if response is ok before parsing
      if (!response.ok) {
        let errorMessage = "Something went wrong. Please try again.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        // Remove thinking message and add error
        setMessages((prev) => prev.filter(msg => !msg.isThinking).concat([{ role: "assistant", content: `Error: ${errorMessage}` }]));
        return;
      }

      const data = await response.json();

      // Handle report generation response
      if (data.success && data.response) {
        // Remove thinking message and add actual response
        setMessages((prev) => prev.filter(msg => !msg.isThinking).concat([{ role: "assistant", content: data.response }]));
        if (data.session_id) setSessionId(data.session_id);
      }
      // Handle error response
      else if (data.error) {
        // Remove thinking message and add error
        setMessages((prev) => prev.filter(msg => !msg.isThinking).concat([{ role: "assistant", content: `Error: ${data.error}` }]));
      } else {
        // Remove thinking message and add error
        setMessages((prev) => prev.filter(msg => !msg.isThinking).concat([{ role: "assistant", content: "Unexpected response format." }]));
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage = err.message || "Something went wrong. Please check your connection.";
      // Remove thinking message and add error
      setMessages((prev) => prev.filter(msg => !msg.isThinking).concat([{ role: "assistant", content: `Error: ${errorMessage}` }]));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 h-full bg-[var(--bg)] text-[var(--text)] overflow-hidden">
      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col w-full">
        {/* Messages */}
        <section className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {messages.length === 0 ? (
            /* Welcome Section */
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6 max-w-2xl mx-auto py-6 sm:py-12 px-4">
              <div className="space-y-2 sm:space-y-3">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[var(--text)]">
                  Welcome to <span className="text-[var(--accent)]">SageAlpha</span>
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-[var(--text-muted)] leading-relaxed">
                  Your AI-powered equity research analyst. Get deep insights into company financials, filings, and market trends in seconds.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full pt-4 sm:pt-8">
                <button
                  onClick={() => { sendMessage(null, "Analyze ICICI Bank (ICICI Bank)"); }}
                  className="p-4 rounded-2xl bg-[var(--card-bg)] hover:bg-[var(--hover)] transition text-left space-y-1"
                >
                  <p className="font-bold text-sm text-[var(--text)]">Analyze ICICI Bank (ICICI Bank)</p>
                  <p className="text-xs text-[var(--text-muted)]">Summarize the latest 10-K risks</p>
                </button>
                <button
                  onClick={() => { sendMessage(null, "Compare Retailers: Walmart vs Target"); }}
                  className="p-4 rounded-2xl bg-[var(--card-bg)] hover:bg-[var(--hover)] transition text-left space-y-1"
                >
                  <p className="font-bold text-sm text-[var(--text)]">Compare Retailers</p>
                  <p className="text-xs text-[var(--text-muted)]">Walmart vs Target margin analysis</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full space-y-4 sm:space-y-6 px-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "user" ? (
                    <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 bg-[var(--accent)] text-white">
                      <div className="text-sm whitespace-pre-wrap">
                        {msg.content}
                      </div>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.attachments.map((att, idx) => (
                            <div key={idx} className="bg-white/10 rounded-lg p-2 flex items-center gap-2">
                              {getFileIcon(att.type)}
                              <span className="text-xs truncate">{att.filename}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-[100%]">
                      {msg.isThinking ? (
                        <div className="text-sm flex items-center gap-2 text-[var(--text)] font-semibold antialiased">
                          <span className="font-bold">{msg.content || "Thinking..."}</span>
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-[var(--text)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-[var(--text)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-[var(--text)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      ) : msg.marketIntelligence ? (
                        // Display Market Intelligence component
                        <div className="bg-[var(--card-bg)] rounded-xl p-6">
                          <MarketIntelligence data={msg.marketIntelligence} ticker={msg.ticker} />
                        </div>
                      ) : (
                        <div className="text-sm text-[var(--text)]">
                          {renderMessageContent(msg.content)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        {/* Attached Files Preview */}
          {attachedFiles.length > 0 && (
          <div className="px-4 sm:px-6 pb-2">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-wrap gap-2 p-3 bg-[var(--card-bg)] rounded-xl">
                {attachedFiles.map((fileObj) => (
                  <div
                    key={fileObj.id}
                    className="flex items-center gap-2 bg-[var(--bg)] rounded-lg p-2 relative group"
                  >
                    {fileObj.preview ? (
                      <img
                        src={fileObj.preview}
                        alt={fileObj.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-[var(--hover)] rounded">
                        {getFileIcon(fileObj.file.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{fileObj.file.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{formatFileSize(fileObj.file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(fileObj.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded hover:bg-[var(--hover)] transition-colors"
                    >
                      <IoClose className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generate Report Section */}
        <div className="px-4 sm:px-6 pb-3">
          <form className="mx-auto max-w-4xl" onSubmit={handleGenerateReport}>
            <div className="flex items-center gap-2 rounded-xl bg-[var(--card-bg)] px-3 sm:px-4 py-2.5 border border-[var(--border)]">
              <IoDocumentText className="w-5 h-5 text-[var(--accent)] flex-shrink-0" />
              <input
                type="text"
                placeholder="Enter Ticker to generate equity report"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="
                  flex-1 bg-transparent
                  text-sm text-[var(--text)]
                  placeholder-[var(--text-muted)]
                  outline-none
                "
              />
              <button
                type="submit"
                disabled={companyName.trim() === "" || loading || uploadingFiles}
                className="
                  px-4 py-2 rounded-lg transition-all
                  bg-[var(--accent)] text-white text-sm font-bold
                  hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-2
                "
              >
                {loading && isReportMode ? (
                  <>
                    <Spinner size="sm" className="border-white/30 border-t-white" />
                    <span>Generating...</span>
                  </>
                ) : (
                  "Generate"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Input Area */}
        <footer className="pb-4 sm:pb-8 px-4 sm:px-6">
          <form className="mx-auto max-w-4xl relative" onSubmit={sendMessage}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={getAllAcceptedTypes().join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex items-center gap-2 rounded-2xl bg-[var(--card-bg)] px-3 sm:px-4 py-2.5 sm:py-3 group relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded-md hover:bg-[var(--hover)] transition-colors"
                title="Attach files (Images, PDFs, Excel, Audio)"
              >
                <IoAttach className="w-5 h-5" />
              </button>

              <input
                type="text"
                placeholder="Message SageAlpha..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="
                  flex-1 bg-transparent
                  text-sm text-[var(--text)]
                  placeholder-[var(--text-muted)]
                  outline-none
                "
              />

              <button
                type="submit"
                disabled={isDisabled}
                className={`
                  h-8 w-8 rounded-full flex items-center justify-center transition-all
                  ${isDisabled ? "bg-[var(--hover)] text-[var(--text-muted)]" : "bg-[var(--accent)] text-white hover:scale-105 active:scale-95"}
                `}
              >
                {loading || uploadingFiles ? (
                  <Spinner size="sm" className="border-white/30 border-t-white" />
                ) : (
                  <IoSend className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-center text-[var(--text-muted)] mt-2">
              SageAlpha.ai may produce inaccurate information. Always verify important financial data.
            </p>
          </form>
        </footer>
      </main>
    </div>
  );
}

export default ChatBot;