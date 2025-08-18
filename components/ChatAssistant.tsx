

import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, ChatMessageSender } from '../types';
import { UserIcon, AiIcon, SystemIcon } from './icons/ChatIcons';

interface ChatAssistantProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const MessageBox: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.sender === ChatMessageSender.User;
  const isSystem = message.sender === ChatMessageSender.System;

  const containerClasses = `flex items-start gap-3 my-4 ${isUser ? 'justify-end' : ''}`;
  
  const bubbleClasses = `max-w-xl p-4 rounded-xl shadow-lg transition-all backdrop-blur-sm ${
    isUser
      ? 'bg-pink-500/20 text-white shadow-[0_0_15px_rgba(255,0,255,0.3)] border border-pink-400/50'
      : isSystem
      ? 'bg-slate-700/50 text-slate-300 w-full'
      : 'bg-green-500/20 text-slate-200 shadow-[0_0_15px_rgba(0,255,0,0.3)] border border-green-400/50'
  }`;

  const renderText = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const codeContent = part.replace(/```(file|create-file|run-project)[\s\S]*?\n([\s\S]+?)```/g, '$2').replace(/```/g, '').trim();
        return (
          <div key={index} className="bg-black/70 rounded-md my-2 border border-slate-600">
            <pre className="p-4 text-sm text-white overflow-x-auto">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={containerClasses}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shadow-lg">
          {isSystem ? <SystemIcon /> : <AiIcon />}
        </div>
      )}
      <div className={bubbleClasses}>
        <div className="whitespace-pre-wrap">{renderText(message.text)}</div>
      </div>
       {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shadow-lg">
          <UserIcon />
        </div>
      )}
    </div>
  );
};

const ChatAssistant: React.FC<ChatAssistantProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div ref={scrollContainerRef} className="flex-grow overflow-y-auto p-4">
        {messages.map(msg => (
          <MessageBox key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex items-start gap-3 my-4">
             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"><AiIcon /></div>
            <div className="bg-green-500/20 p-4 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,0,0.3)] border border-green-400/50">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="w-2 h-2 bg-green-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-green-300 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-green-500/30 flex-shrink-0">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Transmit your query..."
            disabled={isLoading}
            className="w-full bg-black/40 backdrop-blur-sm border border-slate-500 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:shadow-[0_0_10px_rgba(0,255,0,0.5)] transition-all duration-300"
          />
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;