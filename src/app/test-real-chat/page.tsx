"use client";

import { useState, useEffect } from "react";

export default function TestRealChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("Mostre uma análise com gráfico do setor petrolífero");
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState<any>(null);
  
  const detectChartTypes = (question: string): string[] => {
    const lowerQuestion = question.toLowerCase();
    
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
    for (const [chartType, keywords] of Object.entries(chartKeywords)) {
      if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
        detectedTypes.push(chartType);
      }
    }
    
    return detectedTypes.length > 0 ? detectedTypes : ["pie", "bar"];
  };
  
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    setLoading(true);
    setDebug(null);
    
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      console.log("🚀 Enviando mensagem...");
      
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
      const detectedChartTypes = detectChartTypes(userMessage.content);
      
      console.log("📊 Tipos detectados:", detectedChartTypes);
      
      const payload = {
        question: userMessage.content,
        chart_types: detectedChartTypes,
        analysis_type: "comprehensive"
      };
      
      console.log("📤 Payload:", payload);
      
      const startTime = Date.now();
      const response = await fetch(`${apiUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      const endTime = Date.now();
      console.log(`⏱️ Tempo de resposta: ${endTime - startTime}ms`);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log("📥 Dados recebidos:", {
        keys: Object.keys(data),
        answerLength: data.answer?.length || 0,
        hasAnswer: !!data.answer
      });
      
      // Debug detalhado
      const hasCharts = data.answer && /data:image\/(png|jpeg|jpg|gif);base64,/.test(data.answer);
      const chartMatches = hasCharts ? data.answer.match(/data:image\/(png|jpeg|jpg|gif);base64,([A-Za-z0-9+/=]+)/g) : null;
      
      const debugInfo = {
        responseTime: endTime - startTime,
        status: response.status,
        detectedTypes: detectedChartTypes,
        hasAnswer: !!data.answer,
        answerLength: data.answer?.length || 0,
        hasCharts,
        chartCount: chartMatches?.length || 0,
        answerPreview: data.answer ? data.answer.substring(0, 200) + "..." : "Sem resposta",
        containsTable: data.answer?.toLowerCase().includes("tabela") || false,
        containsChart: data.answer?.toLowerCase().includes("gráfico") || false,
      };
      
      setDebug(debugInfo);
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        hasCharts: hasCharts
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error("❌ Erro:", error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ Erro: ${error instanceof Error ? error.message : String(error)}`,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">💬 Teste de Chat Real</h1>
        
        <div className="mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Sua pergunta:</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white h-24"
              placeholder="Digite sua pergunta..."
            />
          </div>
          
          <button 
            onClick={sendMessage}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium"
          >
            {loading ? "🔄 Enviando..." : "📤 Enviar Mensagem"}
          </button>
        </div>
        
        {debug && (
          <div className="bg-slate-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">🔍 Debug Info</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>⏱️ Tempo de resposta:</strong> {debug.responseTime}ms</div>
              <div><strong>📡 Status:</strong> {debug.status}</div>
              <div><strong>📊 Tipos detectados:</strong> {debug.detectedTypes.join(', ')}</div>
              <div><strong>📄 Tem resposta:</strong> {debug.hasAnswer ? 'Sim' : 'Não'}</div>
              <div><strong>📏 Tamanho da resposta:</strong> {debug.answerLength} caracteres</div>
              <div><strong>📈 Contém gráficos:</strong> {debug.hasCharts ? 'Sim' : 'Não'}</div>
              <div><strong>📊 Número de gráficos:</strong> {debug.chartCount}</div>
              <div><strong>📋 Contém tabela:</strong> {debug.containsTable ? 'Sim' : 'Não'}</div>
              <div><strong>📈 Contém gráfico:</strong> {debug.containsChart ? 'Sim' : 'Não'}</div>
            </div>
            <div className="mt-4">
              <strong>📝 Preview da resposta:</strong>
              <pre className="bg-slate-700 p-3 rounded mt-2 text-xs whitespace-pre-wrap">{debug.answerPreview}</pre>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">💬 Conversa</h2>
          
          {messages.length === 0 && (
            <div className="text-slate-400 text-center py-8">
              Nenhuma mensagem ainda. Envie uma pergunta para começar.
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.role === "user" 
                  ? "bg-blue-600 ml-auto max-w-[80%]" 
                  : "bg-slate-800 mr-auto max-w-[80%]"
              }`}
            >
              <div className="text-sm mb-2">
                <strong>{message.role === "user" ? "Você" : "Assistente"}</strong>
                {message.hasCharts && (
                  <span className="ml-2 text-green-400">📊 Contém gráficos</span>
                )}
              </div>
              
              <div className="whitespace-pre-wrap text-sm">
                {message.content ? (
                  message.content.length > 500 ? (
                    <>
                      {message.content.substring(0, 500)}...
                      <br />
                      <span className="text-slate-400 text-xs">
                        [Resposta truncada - {message.content.length} caracteres]
                      </span>
                    </>
                  ) : (
                    message.content
                  )
                ) : (
                  <span className="text-slate-400">Sem conteúdo</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}