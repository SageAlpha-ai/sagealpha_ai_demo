import React, { useState, useEffect, useRef } from "react";
import { IoClose, IoDocument, IoImage, IoMusicalNote, IoDocumentText, IoSend, IoAttach } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import CONFIG from "../config";
import { getMarketIntelligence } from "../api/marketIntelligence";
import MarketIntelligence from "./MarketIntelligence";
import Spinner from "./Spinner";
import { toast } from "sonner";
import EmailModal from "./EmailModal";
import { getDemoHeaders } from "../utils/demoId";

/**
 * Reusable chat UI component for all assistant types.
 * Self-contained — manages its own state, API calls, and rendering.
 *
 * @param {string} assistant - Assistant type identifier (e.g. "sagealpha")
 */
function AssistantChat({ assistant = "sagealpha", showChatInput = true }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isUsageLimitReached, setIsUsageLimitReached] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [usageCount, setUsageCount] = useState(0);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

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
      if (file.size > maxSize) {
        errors.push(`${file.name}: File size exceeds 50MB limit`);
        return;
      }
      if (!getAllAcceptedTypes().includes(file.type)) {
        errors.push(`${file.name}: File type not supported`);
        return;
      }
      if (acceptedFileTypes.images.includes(file.type)) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setAttachedFiles(prev => prev.map(f =>
            f.file.name === file.name ? { ...f, preview: ev.target.result } : f
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
    try {
      const uploadedFiles = await Promise.all(attachedFiles.map(f => uploadFile(f)));
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
    setSelectedReportId(reportId);
    setEmailModalOpen(true);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch usage status
  const fetchUsageStatus = async () => {
    try {
      const demoHeaders = getDemoHeaders();
      const response = await fetch(`${CONFIG.API_BASE_URL}/usage/status`, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...demoHeaders },
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        const chatUsage = data.chat?.usageCount || 0;
        setUsageCount(chatUsage);
        setIsUsageLimitReached(chatUsage >= 5);
      }
    } catch (error) {
      console.error("Error fetching usage status:", error);
    }
  };

  useEffect(() => {
    fetchUsageStatus();
  }, []);

  // ── Market Intelligence detection ──
  const detectMarketIntelligenceRequest = (message) => {
    if (!message || typeof message !== 'string') return null;
    const normalized = message.toLowerCase().trim();
    const keywords = ['market intelligence', 'intelligence for'];
    const hasKeyword = keywords.some(k => normalized.includes(k));
    if (!hasKeyword) return null;

    const tickerPatterns = [
      /for\s+([A-Za-z0-9]{1,10})\b/i,
      /\(([A-Za-z0-9]{1,10})\)/i,
      /\b([A-Za-z0-9]{1,10})\b(?!\s+for)/i,
    ];
    for (const pattern of tickerPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const ticker = match[1].toUpperCase().trim();
        if (/^[A-Z0-9]{1,10}$/.test(ticker)) {
          return { ticker, detected: true };
        }
      }
    }
    return { ticker: null, detected: true, needsTicker: true };
  };

  // ── Send message ──
  const sendMessage = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || prompt;
    if ((!textToSend.trim() && attachedFiles.length === 0) || loading) return;

    let uploadedFileInfo = [];
    if (attachedFiles.length > 0) {
      uploadedFileInfo = await uploadAllFiles();
      if (uploadedFileInfo.length === 0 && !textToSend.trim()) return;
    }

    const userMessage = {
      role: "user",
      content: textToSend,
      attachments: uploadedFileInfo.length > 0 ? uploadedFileInfo.map(f => ({
        filename: f.filename, url: f.uploadUrl, type: f.file.type
      })) : []
    };
    setMessages(prev => [...prev, userMessage]);
    setAttachedFiles([]);
    setPrompt("");
    setLoading(true);

    // Market intelligence check
    const miDetection = detectMarketIntelligenceRequest(textToSend);
    if (miDetection && miDetection.detected) {
      if (miDetection.needsTicker) {
        setMessages(prev => prev.concat([{
          role: "assistant",
          content: "I detected a market intelligence request, but couldn't find a ticker symbol. Please specify a ticker, for example: 'Market intelligence for AAPL' or 'Market intelligence for ZOMATO'."
        }]));
        setLoading(false);
        return;
      }
      if (miDetection.ticker) {
        const thinkingMsg = { role: "assistant", content: `Analyzing market intelligence for ${miDetection.ticker}...`, isThinking: true };
        setMessages(prev => [...prev, thinkingMsg]);
        try {
          const intelligenceData = await getMarketIntelligence(miDetection.ticker);
          setMessages(prev => prev.filter(m => !m.isThinking).concat([{
            role: "assistant", content: null,
            marketIntelligence: intelligenceData, ticker: miDetection.ticker
          }]));
          if (sessionId) {
            try {
              await fetch(`${CONFIG.API_BASE_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ message: `Market intelligence analysis for ${miDetection.ticker}`, session_id: sessionId, top_k: 5 })
              });
            } catch (e) { console.warn("Failed to save MI to session:", e); }
          }
        } catch (err) {
          console.error("Market intelligence error:", err);
          setMessages(prev => prev.filter(m => !m.isThinking).concat([{
            role: "assistant",
            content: `Error fetching market intelligence: ${err.message || "Failed to fetch. Please try again."}`
          }]));
        } finally { setLoading(false); }
        return;
      }
    }

    // Regular chat flow
    setMessages(prev => [...prev, { role: "assistant", content: "Thinking...", isThinking: true }]);

    try {
      const messageWithAttachments = textToSend + (uploadedFileInfo.length > 0
        ? `\n\n[Attached ${uploadedFileInfo.length} file(s): ${uploadedFileInfo.map(f => f.filename).join(', ')}]`
        : '');
      const body = { message: messageWithAttachments, session_id: sessionId, top_k: 5 };
      const demoHeaders = getDemoHeaders();
      const response = await fetch(`${CONFIG.API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...demoHeaders },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = "Something went wrong. Please try again.";
        try {
          const errorData = await response.json();
          if (errorData.code === "USAGE_LIMIT_REACHED") {
            setIsUsageLimitReached(true);
            setUsageCount(5);
            setMessages(prev => prev.filter(m => !m.isThinking).concat([{
              role: "assistant",
              content: "You've reached the free usage limit. Upgrade to continue using SageAlpha services.",
              isUsageLimit: true
            }]));
            return;
          }
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (_) { errorMessage = response.statusText || errorMessage; }
        setMessages(prev => prev.filter(m => !m.isThinking).concat([{ role: "assistant", content: `Error: ${errorMessage}` }]));
        return;
      }

      const data = await response.json();
      if (data.code === "USAGE_LIMIT_REACHED") {
        setIsUsageLimitReached(true);
        setUsageCount(5);
        setMessages(prev => prev.filter(m => !m.isThinking).concat([{
          role: "assistant",
          content: "You've reached the free usage limit. Upgrade to continue using SageAlpha services.",
          isUsageLimit: true
        }]));
        return;
      }
      if (data.response) {
        setMessages(prev => prev.filter(m => !m.isThinking).concat([{ role: "assistant", content: data.response }]));
        if (data.session_id) setSessionId(data.session_id);
        fetchUsageStatus();
      } else if (data.error) {
        setMessages(prev => prev.filter(m => !m.isThinking).concat([{ role: "assistant", content: `Error: ${data.error}` }]));
      } else {
        setMessages(prev => prev.filter(m => !m.isThinking).concat([{ role: "assistant", content: "Unexpected response format." }]));
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => prev.filter(m => !m.isThinking).concat([{
        role: "assistant", content: `Error: ${err.message || "Something went wrong. Please check your connection."}`
      }]));
    } finally { setLoading(false); }
  };

  // ── Generate Report ──
  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();
    const tickerToSend = companyName.trim();
    if (!tickerToSend || loading || uploadingFiles) return;

    let uploadedFileInfo = [];
    if (attachedFiles.length > 0) {
      uploadedFileInfo = await uploadAllFiles();
      if (uploadedFileInfo.length === 0 && !tickerToSend) return;
    }

    const userMessage = {
      role: "user",
      content: `Generate research report for ${tickerToSend}`,
      attachments: uploadedFileInfo.length > 0 ? uploadedFileInfo.map(f => ({
        filename: f.filename, url: f.uploadUrl, type: f.file.type
      })) : []
    };
    setMessages(prev => [...prev, userMessage]);
    setAttachedFiles([]);
    setCompanyName("");
    setLoading(true);

    setMessages(prev => [...prev, { role: "assistant", content: "Thinking...", isThinking: true }]);

    try {
      const body = { company_name: tickerToSend, session_id: sessionId };
      const demoHeaders = getDemoHeaders();
      const response = await fetch(`${CONFIG.API_BASE_URL}/chat/create-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...demoHeaders },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = "Something went wrong. Please try again.";
        try {
          const errorData = await response.json();
          if (errorData.code === "USAGE_LIMIT_REACHED") {
            setIsUsageLimitReached(true);
            setUsageCount(5);
            setMessages(prev => prev.filter(m => !m.isThinking).concat([{
              role: "assistant",
              content: "You've reached the free usage limit. Upgrade to continue using SageAlpha services.",
              isUsageLimit: true
            }]));
            return;
          }
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (_) { errorMessage = response.statusText || errorMessage; }
        setMessages(prev => prev.filter(m => !m.isThinking).concat([{ role: "assistant", content: `Error: ${errorMessage}` }]));
        return;
      }

      const data = await response.json();
      if (data.code === "USAGE_LIMIT_REACHED") {
        setIsUsageLimitReached(true);
        setUsageCount(5);
        setMessages(prev => prev.filter(m => !m.isThinking).concat([{
          role: "assistant",
          content: "You've reached the free usage limit. Upgrade to continue using SageAlpha services.",
          isUsageLimit: true
        }]));
        return;
      }
      if (data.success && data.response) {
        setMessages(prev => prev.filter(m => !m.isThinking).concat([{ role: "assistant", content: data.response }]));
        if (data.session_id) setSessionId(data.session_id);
        fetchUsageStatus();
      } else if (data.error) {
        setMessages(prev => prev.filter(m => !m.isThinking).concat([{ role: "assistant", content: `Error: ${data.error}` }]));
      } else {
        setMessages(prev => prev.filter(m => !m.isThinking).concat([{ role: "assistant", content: "Unexpected response format." }]));
      }
    } catch (err) {
      console.error("Report error:", err);
      setMessages(prev => prev.filter(m => !m.isThinking).concat([{
        role: "assistant", content: `Error: ${err.message || "Something went wrong."}`
      }]));
    } finally { setLoading(false); }
  };

  // ── Render markdown-like message content ──
  const renderMessageContent = (content) => {
    if (typeof content !== 'string') return content;
    const lines = content.split('\n');
    const elements = [];
    let listItems = [];
    let inList = false;

    const processText = (text) => {
      if (!text) return null;
      const parts = [];
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let lastIndex = 0;
      let match;
      const linkMatches = [];
      while ((match = linkRegex.exec(text)) !== null) {
        linkMatches.push({ index: match.index, length: match[0].length, text: match[1], url: match[2] });
      }
      const boldRegex = /\*\*([^*]+)\*\*|__([^_]+)__/g;
      const boldMatches = [];
      while ((match = boldRegex.exec(text)) !== null) {
        boldMatches.push({ index: match.index, length: match[0].length, text: match[1] || match[2] });
      }
      const allMatches = [
        ...linkMatches.map(m => ({ ...m, type: 'link' })),
        ...boldMatches.map(m => ({ ...m, type: 'bold' }))
      ].sort((a, b) => a.index - b.index);
      const filteredMatches = [];
      let currentEnd = 0;
      for (const m of allMatches) {
        if (m.index >= currentEnd) { filteredMatches.push(m); currentEnd = m.index + m.length; }
      }
      lastIndex = 0;
      filteredMatches.forEach((m, idx) => {
        if (m.index > lastIndex) parts.push(text.substring(lastIndex, m.index));
        if (m.type === 'link') {
          const isDownloadLink = m.url.includes('/reports/download/');
          if (isDownloadLink) {
            const reportId = m.url.split('/reports/download/')[1];
            parts.push(
              <button key={`link-${idx}`} onClick={(e) => { e.preventDefault(); handlePdfDownload(reportId); }}
                className="text-[var(--accent)] underline font-bold hover:brightness-110 inline-block">{m.text}</button>
            );
          } else {
            parts.push(
              <a key={`link-${idx}`} href={m.url} target="_blank" rel="noopener noreferrer"
                className="text-[var(--accent)] underline font-bold hover:brightness-110">{m.text}</a>
            );
          }
        } else if (m.type === 'bold') {
          parts.push(<strong key={`bold-${idx}`}>{m.text}</strong>);
        }
        lastIndex = m.index + m.length;
      });
      if (lastIndex < text.length) parts.push(text.substring(lastIndex));
      return parts.length > 0 ? parts : text;
    };

    lines.forEach((line, lineIdx) => {
      const trimmedLine = line.trim();
      if (trimmedLine.match(/^#{1,6}\s+/)) {
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`list-${lineIdx}`} className="list-disc list-inside space-y-1 my-2 ml-4">{listItems.map((item, idx) => <li key={idx} className="text-sm">{processText(item)}</li>)}</ul>);
          listItems = []; inList = false;
        }
        const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
          const level = Math.min(headerMatch[1].length, 6);
          const headerText = headerMatch[2].trim();
          const className = `font-bold ${level === 1 ? 'text-lg mt-4 mb-2' : level === 2 ? 'text-base mt-3 mb-2' : 'text-sm mt-2 mb-1'}`;
          elements.push(React.createElement(`h${level}`, { key: `header-${lineIdx}`, className }, processText(headerText)));
        }
        return;
      }
      if (trimmedLine.match(/^[-*]\s+/) || trimmedLine.match(/^\d+\.\s+/)) {
        const listText = trimmedLine.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
        listItems.push(listText); inList = true; return;
      }
      if (trimmedLine.match(/^---+$/)) {
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`list-${lineIdx}`} className="list-disc list-inside space-y-1 my-2 ml-4">{listItems.map((item, idx) => <li key={idx} className="text-sm">{processText(item)}</li>)}</ul>);
          listItems = []; inList = false;
        }
        elements.push(<hr key={`hr-${lineIdx}`} className="my-3 border-[var(--border)]" />);
        return;
      }
      if (inList && listItems.length > 0) {
        elements.push(<ul key={`list-${lineIdx}`} className="list-disc list-inside space-y-1 my-2 ml-4">{listItems.map((item, idx) => <li key={idx} className="text-sm">{processText(item)}</li>)}</ul>);
        listItems = []; inList = false;
      }
      if (trimmedLine) {
        elements.push(<p key={`para-${lineIdx}`} className="text-sm my-2 leading-relaxed">{processText(trimmedLine)}</p>);
      } else if (lineIdx > 0 && lines[lineIdx - 1].trim()) {
        elements.push(<br key={`br-${lineIdx}`} />);
      }
    });
    if (inList && listItems.length > 0) {
      elements.push(<ul key="list-final" className="list-disc list-inside space-y-1 my-2 ml-4">{listItems.map((item, idx) => <li key={idx} className="text-sm">{processText(item)}</li>)}</ul>);
    }
    return elements.length > 0 ? elements : content;
  };

  const isDisabled = (prompt.trim() === "" && attachedFiles.length === 0) || loading || uploadingFiles || isUsageLimitReached;

  return (
    <div className="flex flex-1 h-full bg-[var(--bg)] text-[var(--text)] overflow-hidden">
      <main className="flex flex-1 flex-col w-full">
        {/* Messages */}
        <section className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6 max-w-2xl mx-auto py-6 sm:py-12 px-4">
              <div className="space-y-2 sm:space-y-3">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[var(--text)]">
                  Welcome to <span className="text-[var(--accent)]">SageAlpha</span> Demo
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-[var(--text-muted)] leading-relaxed">
                  You're exploring a demo version of SageAlpha AI with limited features enabled.
                  This preview lets you experience how our AI-powered equity research works in real time.
                </p>
                <p className="text-sm sm:text-base md:text-lg text-[var(--text-muted)] leading-relaxed">
                  To unlock the full SageAlpha experience — including advanced tools, deeper insights,
                  and unrestricted usage — visit{" "}
                  <a href="https://sagealpha.ai" target="_blank" rel="noopener noreferrer"
                    className="text-[var(--accent)] font-medium hover:underline">sagealpha.ai</a>.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full space-y-4 sm:space-y-6 px-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "user" ? (
                    <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 bg-[var(--accent)] text-white">
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
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

        {/* Attached Files Preview (only when chat input is shown) */}
        {showChatInput && attachedFiles.length > 0 && (
          <div className="px-4 sm:px-6 pb-2">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-wrap gap-2 p-3 bg-[var(--card-bg)] rounded-xl">
                {attachedFiles.map((fileObj) => (
                  <div key={fileObj.id} className="flex items-center gap-2 bg-[var(--bg)] rounded-lg p-2 relative group">
                    {fileObj.preview ? (
                      <img src={fileObj.preview} alt={fileObj.file.name} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-[var(--hover)] rounded">
                        {getFileIcon(fileObj.file.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{fileObj.file.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{formatFileSize(fileObj.file.size)}</p>
                    </div>
                    <button type="button" onClick={() => removeFile(fileObj.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded hover:bg-[var(--hover)] transition-colors">
                      <IoClose className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Message Input (only when showChatInput is true) */}
        {showChatInput && (
          <div className="px-4 sm:px-6 pb-2">
            <form className="mx-auto max-w-4xl" onSubmit={sendMessage}>
              {/* Hidden file input */}
              <input ref={fileInputRef} type="file" multiple accept={getAllAcceptedTypes().join(',')}
                onChange={handleFileSelect} className="hidden" />

              <div className="flex items-center gap-2 rounded-2xl bg-[var(--card-bg)] px-3 sm:px-4 py-2.5 sm:py-3 border border-[var(--border)]">
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  disabled={isUsageLimitReached}
                  className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded-md hover:bg-[var(--hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Attach files (Images, PDFs, Excel, Audio)">
                  <IoAttach className="w-5 h-5" />
                </button>
                <input type="text" placeholder="Message SageAlpha..." value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isUsageLimitReached}
                  className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none disabled:opacity-50 disabled:cursor-not-allowed" />
                <button type="submit" disabled={isDisabled}
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${isDisabled ? "bg-[var(--hover)] text-[var(--text-muted)]" : "bg-[var(--accent)] text-white hover:scale-105 active:scale-95"}`}>
                  {loading || uploadingFiles ? (
                    <Spinner size="sm" className="border-white/30 border-t-white" />
                  ) : (
                    <IoSend className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Generate Report Section */}
        <div className="px-4 sm:px-6 pb-3">
          <form className="mx-auto max-w-4xl" onSubmit={handleGenerateReport}>
            <div className="flex items-center gap-2 rounded-xl bg-[var(--card-bg)] px-3 sm:px-4 py-2.5 border border-[var(--border)] relative">
              <IoDocumentText className="w-5 h-5 text-[var(--accent)] flex-shrink-0" />
              <input type="text" placeholder="Enter Ticker to generate Equity"
                value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                disabled={isUsageLimitReached}
                className="flex-1 bg-transparent text-xs sm:text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none disabled:opacity-50 disabled:cursor-not-allowed" />
              <button type="submit"
                disabled={companyName.trim() === "" || loading || uploadingFiles || isUsageLimitReached}
                className="px-4 py-2 rounded-lg transition-all bg-[var(--accent)] text-white text-sm font-bold hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {loading ? (
                  <><Spinner size="sm" className="border-white/30 border-t-white" /><span>Generating...</span></>
                ) : "Generate"}
              </button>
            </div>
          </form>
        </div>

        {/* Usage Limit Message */}
        {isUsageLimitReached && (
          <div className="px-4 sm:px-6 pb-4">
            <div className="mx-auto max-w-4xl">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-sm text-red-600 font-medium flex-1">
                  You've reached the free usage limit. Upgrade to continue using SageAlpha services.
                </p>
                <button onClick={() => navigate("/plans")}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap">
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Email Modal */}
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => { setEmailModalOpen(false); setSelectedReportId(null); }}
        reportId={selectedReportId}
      />
    </div>
  );
}

export default AssistantChat;
