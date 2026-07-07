import React, { useState, useRef, useEffect } from 'react';
import { ProjectSchema } from '../types';
import { Mic, Send, Bot, User, MicOff, PanelRightClose } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface ChatPanelProps {
  schema: ProjectSchema;
  onChange: (schema: ProjectSchema) => void;
  onCollapse: () => void;
}

export function ChatPanel({ schema, onChange, onCollapse }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<{type: string, id: string}[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    // Initialize Speech Recognition if supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInput(prev => prev ? prev + ' ' + finalTranscript : finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    let messageText = input;
    if (attachments.length > 0) {
      const attachmentText = attachments.map(a => `[Attached ${a.type}: ${a.id}]`).join(' ');
      messageText = input ? `${messageText}\n\n${attachmentText}` : attachmentText;
    }

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: messageText }] };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          currentSchema: schema,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      if (data.newSchema) {
        onChange(data.newSchema);
      }

      setMessages([
        ...newMessages,
        { role: 'model', parts: [{ text: data.text }] }
      ]);
    } catch (error) {
      console.error(error);
      setMessages([
        ...newMessages,
        { role: 'model', parts: [{ text: 'Sorry, I encountered an error. Please try again.' }] }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('text/plain')) {
      setIsDraggingOver(true);
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const data = e.dataTransfer.getData('text/plain');
    if (data.startsWith('resource:')) {
      const parts = data.split(':');
      if (parts.length === 3) {
        setAttachments(prev => [...prev, { type: parts[1], id: parts[2] }]);
      }
    }
  };

  return (
    <div 
      className={`flex flex-col h-full bg-slate-950 relative transition-colors ${isDraggingOver ? 'bg-slate-900 ring-2 ring-inset ring-emerald-500/50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 text-xs mt-4">
            Ask me to build or modify animations! <br/> e.g. "Add a rotating cube"
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/30' 
                : 'bg-slate-800/50 text-slate-200 border border-slate-700'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-70">
                {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                <span className="text-[10px] uppercase tracking-wider">{msg.role}</span>
              </div>
              <div className="whitespace-pre-wrap">{msg.parts.map(p => p.text).join('')}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3">
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {attachments.map((att, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300">
                <span className="font-mono text-[10px] uppercase text-emerald-400">{att.type}</span>
                <span>{att.type.substring(0, 3).toUpperCase()}{att.id}</span>
                <button 
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                  className="ml-1 text-slate-500 hover:text-red-400"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleRecording}
            className={`p-2 rounded-full transition-colors ${
              isRecording 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' 
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-emerald-400 hover:border-emerald-500/50'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type or speak a request..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          
          <button
            onClick={handleSend}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className="p-2 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
