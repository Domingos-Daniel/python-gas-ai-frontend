"use client";

import { useState } from "react";

// Simular a função detectChartTypes do ChatInterface
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

// Simular a função do ChartRenderer para extrair gráficos
const extractCharts = (text: string) => {
  const charts: any[] = [];
  
  // Padrão para detectar gráficos base64
  const base64Pattern = /data:image\/(png|jpeg|jpg|gif);base64,([A-Za-z0-9+/=]+)/g;
  const matches = text.match(base64Pattern);
  
  if (matches) {
    matches.forEach((match, index) => {
      // Detectar tipo de gráfico pelo contexto
      const chartType = detectChartType(text, index);
      const title = extractChartTitle(text, index);
      
      charts.push({
        type: chartType,
        base64: match,
        title,
      });
    });
  }
  
  return charts;
};

const detectChartType = (text: string, chartIndex: number) => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('pie') || lowerText.includes('pizza')) return 'pie';
  if (lowerText.includes('bar') || lowerText.includes('barras')) return 'bar';
  if (lowerText.includes('line') || lowerText.includes('linha')) return 'line';
  if (lowerText.includes('donut') || lowerText.includes('rosquinha')) return 'donut';
  
  return 'bar'; // default
};

const extractChartTitle = (text: string, chartIndex: number) => {
  const lines = text.split('\n');
  let title = `Gráfico ${chartIndex + 1}`;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('data:image')) {
      // Procurar título acima do gráfico
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        const line = lines[j].trim();
        if (line.startsWith('**') && line.endsWith('**')) {
          title = line.replace(/\*\*/g, '');
          break;
        }
        if (line.startsWith('#')) {
          title = line.replace(/#+/g, '').trim();
          break;
        }
      }
      break;
    }
  }
  
  return title;
};

export default function TestFullFlow() {
  const [question, setQuestion] = useState("Análise do setor petrolífero em Angola com gráfico de linha");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  const testFullFlow = async () => {
    setLoading(true);
    try {
      console.log("🧪 Iniciando teste completo...");
      console.log("❓ Pergunta:", question);
      
      // Passo 1: Detectar tipos de gráficos
      const detectedTypes = detectChartTypes(question);
      console.log("📊 Tipos detectados:", detectedTypes);
      
      // Passo 2: Enviar para o backend
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
      
      const payload = {
        question: question,
        chart_types: detectedTypes,
        analysis_type: "comprehensive"
      };
      
      console.log("📤 Enviando payload:", payload);
      
      const response = await fetch(`${apiUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      console.log("📥 Resposta recebida, status:", response.status);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("📄 Dados recebidos, chaves:", Object.keys(data));
      
      // Passo 3: Analisar a resposta
      const hasCharts = data.answer && /data:image\/(png|jpeg|jpg|gif);base64,/.test(data.answer);
      const chartCount = hasCharts ? (data.answer.match(/data:image\/(png|jpeg|jpg|gif);base64,/g) || []).length : 0;
      
      // Passo 4: Extrair gráficos como o ChartRenderer faria
      const extractedCharts = hasCharts ? extractCharts(data.answer) : [];
      
      const analysis = `
🎯 Teste Completo do Fluxo

❓ Pergunta: ${question}
📊 Tipos detectados: ${detectedTypes.join(', ')}

📡 Backend Response:
- Status: ${response.status}
- Tamanho da resposta: ${JSON.stringify(data).length} caracteres
- Contém gráficos: ${hasCharts}
- Número de gráficos: ${chartCount}
- Chaves do objeto: ${Object.keys(data).join(', ')}

🔍 Extração de Gráficos:
- Gráficos extraídos: ${extractedCharts.length}
${extractedCharts.map((chart, i) => `- Gráfico ${i+1}: Tipo=${chart.type}, Título="${chart.title}"`).join('\n')}

📝 Preview da resposta (primeiros 300 chars):
${data.answer ? data.answer.substring(0, 300) + "..." : "Sem resposta"}
      `;
      
      setResult(analysis);
      
      // Salvar dados para debug
      console.log("💾 Dados completos salvos no console");
      console.log("Resposta completa:", data);
      
    } catch (error) {
      console.error("❌ Erro:", error);
      setResult(`❌ Erro no fluxo completo:\n${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🎯 Teste Completo do Fluxo</h1>
        
        <div className="mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pergunta de teste:</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
              placeholder="Digite sua pergunta..."
            />
          </div>
          
          <button 
            onClick={testFullFlow}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium"
          >
            {loading ? "🔄 Executando..." : "🚀 Executar Teste Completo"}
          </button>
        </div>
        
        {result && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">📋 Resultado do Teste</h2>
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}