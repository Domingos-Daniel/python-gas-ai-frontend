"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Loader2, ArrowDown, Copy, Share2, Check, FileText, BarChart3, MessageSquare, Download, FileSpreadsheet, Paperclip, X } from "lucide-react";
import { exportChatMessages, exportAnalysisData, exportChartData, downloadFile } from "@/utils/exportUtils";
import MessageContentRenderer from "./MessageContentRenderer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  hasCharts?: boolean;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [useAnalysis, setUseAnalysis] = useState(false);
  const [randomQuestions, setRandomQuestions] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentContext, setDocumentContext] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Array de questões sobre empresas petrolíferas angolanas
  const companyQuestions = [
    "Quais são as principais empresas petrolíferas operando em Angola atualmente?",
    "Qual é a participação da Sonangol no mercado de petróleo angolano?",
    "Como é a estrutura de joint ventures entre a Sonangol e empresas internacionais?",
    "Quais empresas estrangeiras têm maior presença na exploração de petróleo em Angola?",
    "Quais foram as empresas que venceram os últimos licenciamentos de blocos petrolíferos?",
    "Como funciona o regime fiscal para empresas petrolíferas em Angola?",
    "Quais empresas operam nos blocos do pré-sal angolano?",
    "Qual é o papel da ACREP na regulação das empresas petrolíferas?",
    "Como se compara a produção da Chevron com a da TotalEnergies em Angola?",
    "Quais empresas angolanas privadas atuam no setor de petróleo e gás?"
  ];

  // Função para selecionar 3 questões aleatórias
  const selectRandomQuestions = () => {
    const shuffled = [...companyQuestions].sort(() => 0.5 - Math.random());
    setRandomQuestions(shuffled.slice(0, 3));
  };

  // Selecionar questões aleatórias quando o componente monta
  useEffect(() => {
    selectRandomQuestions();
  }, []);

  // Função para enviar questão pré-criada
  const handleQuickQuestion = async (question: string) => {
    if (isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
      
      const endpoint = useAnalysis ? '/analyze' : '/chat';
      const detectedChartTypes = detectChartTypes(userMessage.content);
      
      const payload = useAnalysis 
        ? {
            question: userMessage.content,
            chart_types: detectedChartTypes,
            analysis_type: "comprehensive"
          }
        : {
            question: userMessage.content,
            history: messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            document_context: documentContext
          };

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const data = await response.json();
      const hasCharts = data.answer && /data:image\/(png|jpeg|jpg|gif);base64,/.test(data.answer);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
        hasCharts: hasCharts
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
          title: 'Resposta do Assistente Petrolífero Angolano',
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

  // Funções para exportar dados
  const handleExportChat = async (format: 'xlsx' | 'csv' | 'json' = 'xlsx') => {
    try {
      const chatMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        hasCharts: msg.hasCharts
      }));
      
      const result = exportChatMessages(chatMessages, { format });
      downloadFile(result.content, result.filename, result.mimeType);
    } catch (error) {
      console.error('Erro ao exportar chat:', error);
      alert('Erro ao exportar conversação. Por favor, tente novamente.');
    }
  };

  const handleExportAnalysis = async (content: string, format: 'xlsx' | 'csv' | 'json' = 'xlsx') => {
    try {
      // Extract analysis data from content
      const analysisData = {
        executive_summary: content.substring(0, 500),
        key_insights: content.split('\n').filter(line => line.includes('•') || line.includes('-')).slice(0, 10),
        competitive_analysis: content.includes('competitiv') ? content : '',
        risk_assessment: content.includes('risco') || content.includes('riscos') ? content : '',
        recommendations: content.split('\n').filter(line => line.toLowerCase().includes('recomenda')).slice(0, 5),
        confidence_score: 85
      };
      
      const result = exportAnalysisData(analysisData, { format });
      downloadFile(result.content, result.filename, result.mimeType);
    } catch (error) {
      console.error('Erro ao exportar análise:', error);
      alert('Erro ao exportar análise. Por favor, tente novamente.');
    }
  };

  const handleExportChart = async (content: string, format: 'xlsx' | 'csv' | 'json' = 'xlsx') => {
    try {
      // Extract chart data from content if available
      const chartMatch = content.match(/data:image\/(png|jpeg|jpg|gif);base64,([^"']+)/);
      const chartData = chartMatch ? { image: chartMatch[0] } : { data: 'Chart data not available' };
      
      const result = exportChartData(chartData, 'analysis', { format });
      downloadFile(result.content, result.filename, result.mimeType);
    } catch (error) {
      console.error('Erro ao exportar gráfico:', error);
      alert('Erro ao exportar gráfico. Por favor, tente novamente.');
    }
  };

  // Função para exportar toda a conversação
  const handleExportFullChat = async (format: 'xlsx' | 'csv' | 'json' = 'xlsx') => {
    try {
      if (messages.length === 0) {
        alert('Não há mensagens para exportar.');
        return;
      }
      
      await handleExportChat(format);
    } catch (error) {
      console.error('Erro ao exportar conversação completa:', error);
      alert('Erro ao exportar conversação. Por favor, tente novamente.');
    }
  };

  // Função para detectar tipo de gráfico solicitado na pergunta
  const detectChartTypes = (question: string): string[] => {
    const lowerQuestion = question.toLowerCase();
    
    // Mapeamento de palavras-chave para tipos de gráficos
    const chartKeywords = {
      'line': ['linha', 'linear', 'tendência', 'tendencia', 'evolução', 'evolucao', 'série temporal', 'serie temporal', 'temporal'],
      'bar': ['barra', 'barras', 'coluna', 'colunas', 'comparação', 'comparacao', 'versus', 'vs'],
      'pie': ['pizza', 'torta', 'setor', 'participação', 'participacao', 'percentual', 'proporção', 'proporcao'],
      'donut': ['donut', 'anel', 'rosquinha', 'rosca'],
      'kpi': ['kpi', 'indicador', 'métrica', 'metrica', 'dashboard', 'painel'],
      'production': ['produção', 'producao', 'extracao', 'extração', 'output'],
      'financial': ['financeiro', 'financeira', 'custos', 'receitas', 'lucros', 'despesas']
    };
    
    const detectedTypes: string[] = [];
    
    // Verifica cada tipo de gráfico
    for (const [chartType, keywords] of Object.entries(chartKeywords)) {
      if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
        detectedTypes.push(chartType);
      }
    }
    
    // Se não detectar nenhum tipo específico, mas pedir "gráfico" genérico
    if (detectedTypes.length === 0 && lowerQuestion.includes('gráfico')) {
      return ['bar']; // Padrão para gráfico genérico
    }
    
    // Se detectou tipos, retorna eles, senão retorna os padrões
    return detectedTypes.length > 0 ? detectedTypes : ["pie", "bar"];
  };

  // File upload functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
        'application/vnd.ms-excel', // Excel old
        'application/pdf', // PDF
        'text/plain', // TXT
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word
        'application/msword' // Word old
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert('Por favor, selecione apenas arquivos Excel, PDF, TXT ou Word.');
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('O arquivo é muito grande. O tamanho máximo permitido é 10MB.');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('context', 'oil_sector_angola');
      
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
      
      const response = await fetch(`${apiUrl}/upload-document`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao fazer upload: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Store document context for future questions
      setDocumentContext(data.text_content);
      
      // Add system message about successful upload
      const uploadMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Documento "${selectedFile.name}" carregado com sucesso! Agora posso usar este documento como contexto para responder suas perguntas sobre o setor petrolífero angolano.`,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, uploadMessage]);
      setSelectedFile(null);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Erro ao fazer upload do documento:', error);
      alert('Erro ao fazer upload do documento. Por favor, tente novamente.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;

    // If there's a selected file, upload it first
    if (selectedFile) {
      await handleFileUpload();
      if (!input.trim()) return; // If no text input, return after upload
    }

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
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
      
      // Escolher endpoint baseado no modo selecionado
      const endpoint = useAnalysis ? '/analyze' : '/chat';
      
      // Detectar tipos de gráficos solicitados na pergunta
      const detectedChartTypes = detectChartTypes(userMessage.content);
      
      const payload = useAnalysis 
        ? {
            question: userMessage.content,
            chart_types: detectedChartTypes,
            analysis_type: "comprehensive"
          }
        : {
            question: userMessage.content,
            history: messages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          };

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const data = await response.json();
      
      // Detectar se a resposta contém gráficos
      const hasCharts = data.answer && /data:image\/(png|jpeg|jpg|gif);base64,/.test(data.answer);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
        hasCharts: hasCharts
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
    <div className="container mx-auto px-2 sm:px-4 h-screen flex flex-col max-w-6xl safe-area-inset">
      <div className="flex flex-col flex-1 min-h-0 py-2 sm:py-4">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 min-h-0 relative">
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
                <div className="relative inline-block mb-2 sm:mb-4">
                  {/* Glowing effect behind logo */}
                  <div className="absolute inset-0 w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-emerald-500 rounded-lg sm:rounded-xl blur-lg opacity-50 animate-pulse"></div>
                  
                  {/* Logo */}
                  <div className="relative w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/25">
                    <svg
                      className="w-5 h-5 sm:w-8 sm:h-8 text-white"
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
                
                <h1 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-1 sm:mb-2 tracking-tight px-4">
                  Assistente Petrolífero Angolano
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-tight font-light mb-2 sm:mb-4 px-4">
                  Converse sobre o Sector Petrolífero
                </p>
                
                {/* Feature highlights */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-4 text-[10px] sm:text-xs text-slate-500 px-4">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-400 rounded-full"></div>
                    <span>IA</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-400 rounded-full"></div>
                    <span>Dados</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-400 rounded-full"></div>
                    <span>Rápido</span>
                  </div>
                </div>
                
                {/* Quick suggestions - Secção ultra-compacta */}
                <div className="max-w-2xl px-4">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-200 mb-3 flex items-center gap-2">
                      <span className="text-emerald-400">💡</span>
                      Sugestões
                    </h3>
                    <div className="grid grid-cols-1 gap-1.5">
                      {randomQuestions.map((question, index) => (
                        <div
                          key={index}
                          onClick={() => handleQuickQuestion(question)}
                          className="bg-slate-800/30 border border-slate-700/20 rounded-md p-2 hover:bg-slate-700/30 transition-all duration-200 cursor-pointer group hover:border-emerald-400/40 text-left"
                        >
                          <span className="text-slate-300 text-xs font-medium group-hover:text-white transition-colors leading-tight line-clamp-2">
                            {question}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={selectRandomQuestions}
                      className="mt-2 flex items-center gap-1 px-2 py-1 bg-slate-700/20 hover:bg-slate-600/20 border border-slate-600/10 rounded text-xs text-slate-400 hover:text-white transition-all duration-200"
                    >
                      <span className="text-blue-400 text-xs">🔄</span>
                      <span className="text-xs">Novas</span>
                    </button>
                  </div>
                  
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1">
                      <span className="text-blue-400">📊</span>
                      Análises
                    </h3>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleQuickQuestion("Quais foram os volumes de produção de petróleo em Angola nos últimos 12 meses?")}
                        className="bg-slate-800/30 border border-slate-700/20 rounded p-1.5 hover:bg-slate-700/30 transition-all duration-200 cursor-pointer group hover:border-blue-400/40 text-center"
                      >
                        <div className="text-blue-400 text-xs">📈</div>
                        <span className="text-slate-300 text-xs font-medium group-hover:text-white leading-tight">Dados</span>
                      </button>
                      <button
                        onClick={() => handleQuickQuestion("Mostre a evolução da produção de petróleo angolana nos últimos 5 anos com gráficos")}
                        className="bg-slate-800/30 border border-slate-700/20 rounded p-1.5 hover:bg-slate-700/30 transition-all duration-200 cursor-pointer group hover:border-purple-400/40 text-center"
                      >
                        <div className="text-purple-400 text-xs">📉</div>
                        <span className="text-slate-300 text-xs font-medium group-hover:text-white leading-tight">Gráficos</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 sm:gap-4 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  } animate-in slide-in-from-bottom-4 duration-500`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg relative group ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 text-white shadow-blue-500/25"
                        : "bg-slate-800/90 border border-slate-700/50 text-slate-100 shadow-slate-900/50"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <MessageContentRenderer 
                        content={message.content}
                        className="text-xs sm:text-sm leading-5 sm:leading-6"
                      />
                    ) : (
                      <p className="text-xs sm:text-sm leading-5 sm:leading-6 whitespace-pre-wrap font-medium">
                        {message.content}
                      </p>
                    )}
                    
                    {/* Action buttons for assistant messages */}
                    {message.role === "assistant" && (
                      <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-3 pt-2 border-t border-slate-700/30 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                        {/* Copy with formatting button */}
                        <button
                          onClick={() => handleCopyMessage(message.content, message.id, true)}
                          className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-slate-700/70 hover:bg-slate-600/70 border border-slate-600/30 rounded-md sm:rounded-lg text-xs transition-all duration-200 hover:scale-105 backdrop-blur-sm group/btn"
                          title="Copiar com formatação Markdown"
                        >
                          {copiedMessageId === message.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400 font-medium hidden sm:inline">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <FileText className="h-3 w-3 text-slate-300 group-hover/btn:text-white" />
                              <span className="text-slate-300 group-hover/btn:text-white font-medium hidden sm:inline">Markdown</span>
                            </>
                          )}
                        </button>
                        
                        {/* Copy plain text button */}
                        <button
                          onClick={() => handleCopyMessage(message.content, message.id, false)}
                          className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-slate-700/70 hover:bg-slate-600/70 border border-slate-600/30 rounded-md sm:rounded-lg text-xs transition-all duration-200 hover:scale-105 backdrop-blur-sm group/btn"
                          title="Copiar texto simples"
                        >
                          <Copy className="h-3 w-3 text-slate-300 group-hover/btn:text-white" />
                          <span className="text-slate-300 group-hover/btn:text-white font-medium hidden sm:inline">Texto</span>
                        </button>
                        
                        {/* Share button */}
                        <button
                          onClick={() => handleShareMessage(message.content, true)}
                          className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-slate-700/70 hover:bg-slate-600/70 border border-slate-600/30 rounded-md sm:rounded-lg text-xs transition-all duration-200 hover:scale-105 backdrop-blur-sm group/btn"
                          title="Compartilhar com formatação"
                        >
                          <Share2 className="h-3 w-3 text-slate-300 group-hover/btn:text-white" />
                          <span className="text-slate-300 group-hover/btn:text-white font-medium hidden sm:inline">Compartilhar</span>
                        </button>

                        {/* Export Analysis button */}
                        <button
                          onClick={() => handleExportAnalysis(message.content, 'xlsx')}
                          className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-emerald-700/70 hover:bg-emerald-600/70 border border-emerald-600/30 rounded-md sm:rounded-lg text-xs transition-all duration-200 hover:scale-105 backdrop-blur-sm group/btn"
                          title="Exportar análise para Excel"
                        >
                          <FileSpreadsheet className="h-3 w-3 text-emerald-300 group-hover/btn:text-white" />
                          <span className="text-emerald-300 group-hover/btn:text-white font-medium hidden sm:inline">Excel</span>
                        </button>

                        {/* Export Chart button (if message has charts) */}
                        {message.hasCharts && (
                          <button
                            onClick={() => handleExportChart(message.content, 'xlsx')}
                            className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-purple-700/70 hover:bg-purple-600/70 border border-purple-600/30 rounded-md sm:rounded-lg text-xs transition-all duration-200 hover:scale-105 backdrop-blur-sm group/btn"
                            title="Exportar dados do gráfico"
                          >
                            <BarChart3 className="h-3 w-3 text-purple-300 group-hover/btn:text-white" />
                            <span className="text-purple-300 group-hover/btn:text-white font-medium hidden sm:inline">Gráfico</span>
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Timestamp */}
                    <div className={`mt-1 sm:mt-2 text-xs opacity-60 ${
                      message.role === "user" ? "text-blue-100" : "text-slate-400"
                    }`}>
                      {message.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  
                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-2 sm:gap-4 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="bg-slate-800/90 border border-slate-700/50 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg shadow-slate-900/50">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 font-medium">Analisando informações...</p>
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
        <div className="flex-shrink-0 mt-2 sm:mt-4 relative">
          {/* Toggle entre Chat e Análise */}
            <div className="absolute -top-12 left-0 right-0 flex justify-between items-center px-2">
              <div></div> {/* Espaço vazio à esquerda */}
              
              <div className="bg-slate-800/80 border border-slate-700/50 rounded-lg p-1 flex gap-1 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setUseAnalysis(false)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                    !useAnalysis 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                  title="Chat tradicional sem gráficos"
                >
                  <MessageSquare className="h-3 w-3" />
                  <span className="hidden md:inline">Chat</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setUseAnalysis(true)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                    useAnalysis 
                      ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                  title="Análise com gráficos e visualizações"
                >
                  <BarChart3 className="h-3 w-3" />
                  <span className="hidden md:inline">Análise</span>
                </button>
              </div>
              
              {/* Botão de Exportação Principal */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleExportFullChat('xlsx')}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-2 py-1 rounded text-xs font-medium transition-all duration-200 shadow-lg hover:scale-105 flex items-center gap-1"
                  title="Exportar conversação completa"
                >
                  <Download className="h-3 w-3" />
                  <span className="hidden sm:inline">Exportar</span>
                </button>
              </div>
            </div>
          {/* Glass morphism background */}
          <div className="absolute inset-0 bg-slate-900/80 border border-slate-700/50 rounded-xl sm:rounded-2xl"></div>
          
          <form onSubmit={handleSubmit} className="relative p-3 sm:p-4">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.pdf,.txt,.docx,.doc"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* File preview */}
            {selectedFile && (
              <div className="mb-2 p-2 bg-slate-800/50 border border-slate-700/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-slate-300 truncate">{selectedFile.name}</span>
                  <span className="text-xs text-slate-500">({Math.round(selectedFile.size / 1024)}KB)</span>
                </div>
                <button
                  type="button"
                  onClick={removeSelectedFile}
                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                  disabled={isUploading}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={useAnalysis 
                  ? "Peça uma análise com gráficos sobre o Sector Petrolífero..." 
                  : "Pergunte sobre o Sector Petrolífero angolano..."
                }
                className="min-h-[50px] sm:min-h-[60px] max-h-[100px] sm:max-h-[120px] resize-none pr-20 sm:pr-24 pl-12 sm:pl-14 py-2 sm:py-3 bg-slate-800/50 border-slate-700/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 rounded-lg sm:rounded-xl text-sm placeholder:text-slate-500 text-slate-100 font-medium leading-relaxed shadow-inner"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              
              {/* File upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 sm:bottom-3 left-3 sm:left-4 h-8 w-8 sm:h-9 sm:w-9 p-0 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/30 rounded-md sm:rounded-lg text-slate-400 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={isLoading || isUploading}
                title="Anexar documento (Excel, PDF, TXT, Word)"
              >
                <Paperclip className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
              
              <Button
                type="submit"
                disabled={(!input.trim() && !selectedFile) || isLoading || isUploading}
                className="absolute bottom-2 sm:bottom-3 right-3 sm:right-4 h-8 w-8 sm:h-9 sm:w-9 p-0 bg-gradient-to-br from-blue-500 via-purple-600 to-emerald-500 hover:from-blue-600 hover:via-purple-700 hover:to-emerald-600 border-0 rounded-md sm:rounded-lg shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading || isUploading ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-2 sm:mt-3">
              <p className="text-xs text-slate-500 font-medium">
                <kbd className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 bg-slate-700 rounded text-xs">Enter</kbd> para enviar • <kbd className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 bg-slate-700 rounded text-xs">Shift + Enter</kbd> para nova linha
              </p>
              
              <div className="flex items-center gap-1 sm:gap-2 text-xs text-slate-500">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span>IA Online</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
