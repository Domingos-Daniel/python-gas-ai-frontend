"use client";

import { useState } from "react";

export default function DebugFlow() {
  const [question, setQuestion] = useState("Mostre uma análise do setor petrolífero com gráfico");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debugFlow = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      console.log("🐛 DEBUG FLUXO INICIADO");
      console.log("❓ Pergunta:", question);
      
      // Passo 1: Detectar tipos de gráficos (copiado do ChatInterface)
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
      
      if (detectedTypes.length === 0 && lowerQuestion.includes('gráfico')) {
        detectedTypes.push('bar');
      }
      
      console.log("📊 Tipos detectados:", detectedTypes);
      
      // Passo 2: Preparar payload
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
      const payload = {
        question: question,
        chart_types: detectedTypes,
        analysis_type: "comprehensive"
      };
      
      console.log("📤 Payload preparado:", payload);
      
      // Passo 3: Enviar requisição
      console.log("🌐 Enviando para:", `${apiUrl}/analyze`);
      
      const response = await fetch(`${apiUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      console.log("📥 Resposta recebida, status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erro da resposta:", errorText);
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("📄 Dados recebidos:", {
        keys: Object.keys(data),
        answerLength: data.answer?.length || 0,
        hasAnswer: !!data.answer,
        answerType: typeof data.answer
      });
      
      // Passo 4: Analisar resposta
      const hasCharts = data.answer && /data:image\/(png|jpeg|jpg|gif);base64,/.test(data.answer);
      const chartMatches = hasCharts ? data.answer.match(/data:image\/(png|jpeg|jpg|gif);base64,([A-Za-z0-9+/=]+)/g) : null;
      
      console.log("📈 Análise de gráficos:", {
        hasCharts,
        chartCount: chartMatches?.length || 0,
        chartMatches: chartMatches?.length || 0
      });
      
      // Passo 5: Procurar menções a gráficos no texto
      const chartMentions = [];
      if (data.answer) {
        const mentions = data.answer.match(/gráfico\s+(de\s+)?(\w+)/gi) || [];
        chartMentions.push(...mentions);
      }
      
      // Passo 6: Verificar se é JSON válido
      let isValidJson = false;
      try {
        JSON.stringify(data);
        isValidJson = true;
      } catch (e) {
        console.error("❌ JSON inválido");
      }
      
      const debugResults = {
        question,
        detectedTypes,
        apiUrl,
        responseStatus: response.status,
        hasAnswer: !!data.answer,
        answerLength: data.answer?.length || 0,
        hasCharts,
        chartCount: chartMatches?.length || 0,
        chartMentions,
        isValidJson,
        answerPreview: data.answer ? data.answer.substring(0, 500) + "..." : "Sem resposta",
        fullData: data
      };
      
      console.log("✅ DEBUG COMPLETO:", debugResults);
      setResults(debugResults);
      
    } catch (err) {
      console.error("❌ Erro no debug:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🐛 Debug do Fluxo de Gráficos</h1>
        
        <div className="mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pergunta para testar:</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white h-24"
              placeholder="Digite sua pergunta..."
            />
          </div>
          
          <button 
            onClick={debugFlow}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium"
          >
            {loading ? "🔄 Debugando..." : "🐛 Iniciar Debug"}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">❌ Erro</h2>
            <pre className="text-sm">{error}</pre>
          </div>
        )}
        
        {results && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">📋 Resultados do Debug</h2>
              <div className="space-y-2 text-sm">
                <div><strong>❓ Pergunta:</strong> {results.question}</div>
                <div><strong>📊 Tipos detectados:</strong> {results.detectedTypes.join(', ') || 'Nenhum'}</div>
                <div><strong>🌐 API URL:</strong> {results.apiUrl}</div>
                <div><strong>📡 Status da resposta:</strong> {results.responseStatus}</div>
                <div><strong>📄 Tem resposta:</strong> {results.hasAnswer ? 'Sim' : 'Não'}</div>
                <div><strong>📏 Tamanho da resposta:</strong> {results.answerLength} caracteres</div>
                <div><strong>📈 Contém gráficos:</strong> {results.hasCharts ? 'Sim' : 'Não'}</div>
                <div><strong>📊 Número de gráficos:</strong> {results.chartCount}</div>
                <div><strong>🔍 Menções a gráficos:</strong> {results.chartMentions.join(', ') || 'Nenhuma'}</div>
                <div><strong>✅ JSON válido:</strong> {results.isValidJson ? 'Sim' : 'Não'}</div>
              </div>
            </div>
            
            {results.answerPreview && (
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">📝 Preview da Resposta</h2>
                <pre className="text-sm whitespace-pre-wrap">{results.answerPreview}</pre>
              </div>
            )}
            
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">🔍 Análise do Problema</h2>
              <div className="space-y-2 text-sm">
                {!results.hasAnswer && (
                  <div className="text-red-400">❌ O backend não retornou nenhuma resposta</div>
                )}
                {results.hasAnswer && !results.hasCharts && (
                  <div className="text-yellow-400">⚠️ A resposta não contém gráficos base64</div>
                )}
                {results.hasAnswer && results.hasCharts && results.chartCount === 0 && (
                  <div className="text-yellow-400">⚠️ Detectou gráficos mas não conseguiu extrair</div>
                )}
                {results.chartCount > 0 && (
                  <div className="text-green-400">✅ Gráficos detectados e extraídos com sucesso!</div>
                )}
                {results.detectedTypes.length === 0 && (
                  <div className="text-yellow-400">⚠️ Nenhum tipo de gráfico foi detectado na pergunta</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}