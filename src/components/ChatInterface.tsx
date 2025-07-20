"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Loader2, ArrowDown, Copy, Share2, Check, FileText } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll automático para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Detectar se o usuário está no bottom
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && messages.length > 0);
    }
  };

  // Scroll automático quando há novas mensagens
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // Scroll automático durante loading
  useEffect(() => {
    if (isLoading) {
      scrollToBottom();
    }
  }, [isLoading]);

  // Função para copiar texto (com opção de manter formatação)
  const handleCopyMessage = async (content: string, messageId: string, preserveFormatting = true) => {
    try {
      const textToCopy = preserveFormatting ? content : content.replace(/[*_`#\[\]()]/g, '');
      await navigator.clipboard.writeText(textToCopy);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  // Função para compartilhar (com opção de manter formatação)
  const handleShareMessage = async (content: string, preserveFormatting = true) => {
    try {
      const textToShare = preserveFormatting ? content : content.replace(/[*_`#\[\]()]/g, '');
      if (navigator.share) {
        await navigator.share({
          title: 'Resposta do Assistente de Energia Angola',
          text: textToShare,
        });
      } else {
        // Fallback para navegadores que não suportam Web Share API
        await navigator.clipboard.writeText(textToShare);
        alert('Conteúdo copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage.content,
          history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Verifique se o servidor está funcionando.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 h-screen flex flex-col max-w-6xl">
      <div className="flex flex-col flex-1 min-h-0 py-4">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0 relative">
          <div 
            ref={messagesContainerRef}
            className="h-full overflow-y-auto"
            onScroll={handleScroll}
          >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center relative">
              {/* Background decoration */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full blur-2xl"></div>
              </div>
              
              {/* Main content */}
              <div className="relative z-10">
                <div className="relative inline-block mb-8">
                  {/* Glowing effect behind logo */}
                  <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-600 to-emerald-500 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
                  
                  {/* Logo */}
                  <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-600 to-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
                
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-4 tracking-tight">
                  Assistente de Energia Angola
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-light mb-8">
                  Converse sobre o setor energético angolano com informações das principais empresas
                </p>
                
                {/* Feature highlights */}
                <div className="flex items-center justify-center gap-8 mb-8 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>IA Avançada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Dados Reais</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span>Respostas Instantâneas</span>
                  </div>
                </div>
                
                {/* Quick suggestions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-700/50 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-blue-400 text-sm">📊</span>
                      </div>
                      <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">Dados de produção</span>
                    </div>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-700/50 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-emerald-400 text-sm">🏢</span>
                      </div>
                      <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">Sobre empresas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-4 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  } animate-in slide-in-from-bottom-4 duration-500`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-lg relative group ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 text-white shadow-blue-500/25"
                        : "bg-slate-800/90 border border-slate-700/50 text-slate-100 shadow-slate-900/50"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <MarkdownRenderer 
                        content={message.content}
                        className="text-sm leading-6"
                      />
                    ) : (
                      <p className="text-sm leading-6 whitespace-pre-wrap font-medium">
                        {message.content}
                      </p>
                    )}
                    
                    {/* Action buttons for assistant messages */}
                    {message.role === "assistant" && (
                      <div className="absolute -right-2 top-2 flex flex-col gap-1">
                        {/* Copy with formatting button */}
                        <button
                          onClick={() => handleCopyMessage(message.content, message.id, true)}
                          className="w-8 h-8 bg-slate-700/90 hover:bg-slate-600/90 border border-slate-600/50 rounded-lg flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm group"
                          title="Copiar com formatação Markdown"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <FileText className="h-4 w-4 text-slate-300 group-hover:text-white" />
                          )}
                        </button>
                        
                        {/* Copy plain text button */}
                        <button
                          onClick={() => handleCopyMessage(message.content, message.id, false)}
                          className="w-8 h-8 bg-slate-700/90 hover:bg-slate-600/90 border border-slate-600/50 rounded-lg flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm group"
                          title="Copiar texto simples"
                        >
                          <Copy className="h-4 w-4 text-slate-300 group-hover:text-white" />
                        </button>
                        
                        {/* Share button */}
                        <button
                          onClick={() => handleShareMessage(message.content, true)}
                          className="w-8 h-8 bg-slate-700/90 hover:bg-slate-600/90 border border-slate-600/50 rounded-lg flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm group"
                          title="Compartilhar com formatação"
                        >
                          <Share2 className="h-4 w-4 text-slate-300 group-hover:text-white" />
                        </button>
                      </div>
                    )}
                    
                    {/* Timestamp */}
                    <div className={`mt-2 text-xs opacity-60 ${
                      message.role === "user" ? "text-blue-100" : "text-slate-400"
                    }`}>
                      {message.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  
                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-4 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-slate-800/90 border border-slate-700/50 rounded-2xl px-4 py-3 shadow-lg shadow-slate-900/50">
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <p className="text-sm text-slate-300 font-medium">Analisando informações...</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Marcador para scroll automático */}
              <div ref={messagesEndRef} />
            </div>
          )}
          </div>

          {/* Botão Scroll to Bottom */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 w-10 h-10 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600/50 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm"
              aria-label="Scroll to bottom"
            >
              <ArrowDown className="h-4 w-4 text-slate-300" />
            </button>
          )}
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="flex-shrink-0 mt-4 relative">
          {/* Glass morphism background */}
          <div className="absolute inset-0 bg-slate-900/80 border border-slate-700/50 rounded-2xl"></div>
          
          <form onSubmit={handleSubmit} className="relative p-4">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte sobre o setor energético angolano..."
                className="min-h-[60px] max-h-[120px] resize-none pr-14 pl-4 py-3 bg-slate-800/50 border-slate-700/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm placeholder:text-slate-500 text-slate-100 font-medium leading-relaxed shadow-inner"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute bottom-3 right-3 h-10 w-10 p-0 bg-gradient-to-br from-blue-500 via-purple-600 to-emerald-500 hover:from-blue-600 hover:via-purple-700 hover:to-emerald-600 border-0 rounded-lg shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-slate-500 font-medium">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Enter</kbd> para enviar • <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Shift + Enter</kbd> para nova linha
              </p>
              
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span>IA Online</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
