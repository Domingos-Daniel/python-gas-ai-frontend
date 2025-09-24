"use client";

import { useState } from "react";

// Simular a função extractCharts do ChartRenderer
const extractCharts = (text: string) => {
  console.log("🔍 Iniciando extração de gráficos...");
  console.log("📄 Texto recebido (primeiros 200 chars):", text.substring(0, 200));
  
  const charts: any[] = [];
  
  // Padrão para detectar gráficos base64
  const base64Pattern = /data:image\/(png|jpeg|jpg|gif);base64,([A-Za-z0-9+/=]+)/g;
  const matches = text.match(base64Pattern);
  
  console.log("🎯 Matches encontrados:", matches?.length || 0);
  
  if (matches) {
    matches.forEach((match, index) => {
      console.log(`📊 Processando gráfico ${index + 1}...`);
      
      // Detectar tipo de gráfico pelo contexto
      const chartType = detectChartType(text, index);
      const title = extractChartTitle(text, index);
      
      console.log(`  Tipo detectado: ${chartType}`);
      console.log(`  Título extraído: ${title}`);
      
      charts.push({
        type: chartType,
        base64: match,
        title,
      });
    });
  }
  
  console.log("✅ Extração concluída. Gráficos encontrados:", charts.length);
  return charts;
};

// Detectar tipo de gráfico pelo contexto
const detectChartType = (text: string, chartIndex: number): string => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('pie') || lowerText.includes('pizza')) return 'pie';
  if (lowerText.includes('bar') || lowerText.includes('barras')) return 'bar';
  if (lowerText.includes('line') || lowerText.includes('linha')) return 'line';
  if (lowerText.includes('donut') || lowerText.includes('rosquinha')) return 'donut';
  
  return 'bar'; // default
};

// Extrair título do gráfico
const extractChartTitle = (text: string, chartIndex: number): string => {
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

// Função para limpar o conteúdo de imagens base64 do texto
const cleanContent = (text: string): string => {
  return text.replace(/!\[.*?\]\(data:image\/[^;]+;base64,[^)]+\)/g, '')
             .replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '');
};

export default function TestExtraction() {
  const [backendResponse, setBackendResponse] = useState<string>("");
  const [results, setResults] = useState<any>(null);
  
  const testExtraction = () => {
    console.log("🚀 Iniciando teste de extração...");
    
    // Testar com uma resposta simulada do backend
    const simulatedResponse = `Aqui está a análise do setor petrolífero:

**Gráfico de Produção Anual**

A produção tem mostrado uma tendência crescente...

data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAAHgCAIAAAC6s0q1AAAgAElEQVR4nO3dd3xUVf4/8M+5d2Yy6T0kJKEFCL0jHUSk9y4i

Os dados mostram um aumento significativo na produção...`;
    
    // Se tiver uma resposta real do backend, usar essa
    const testContent = backendResponse || simulatedResponse;
    
    console.log("📝 Conteúdo do teste:", testContent.substring(0, 300) + "...");
    
    // Testar detecção de gráficos
    const hasCharts = /data:image\/(png|jpeg|jpg|gif);base64,/.test(testContent);
    console.log("🔍 Tem gráficos?", hasCharts);
    
    // Extrair gráficos
    const extractedCharts = extractCharts(testContent);
    
    // Limpar conteúdo
    const cleanedContent = cleanContent(testContent);
    
    setResults({
      hasCharts,
      extractedChartCount: extractedCharts.length,
      cleanedContent: cleanedContent.substring(0, 200) + "...",
      charts: extractedCharts.map((chart, i) => ({
        index: i + 1,
        type: chart.type,
        title: chart.title,
        base64Preview: chart.base64.substring(0, 50) + "..."
      }))
    });
  };
  
  const testWithRealBackend = async () => {
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
      const response = await fetch(`${apiUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: "Análise com gráfico de barras do setor petrolífero",
          chart_types: ["bar"],
          analysis_type: "comprehensive"
        }),
      });
      
      const data = await response.json();
      setBackendResponse(data.answer);
      console.log("✅ Resposta real do backend obtida!");
      
    } catch (error) {
      console.error("❌ Erro ao obter resposta do backend:", error);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Teste de Extração de Gráficos</h1>
        
        <div className="mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Resposta do Backend (opcional):</label>
            <textarea
              value={backendResponse}
              onChange={(e) => setBackendResponse(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white h-32"
              placeholder="Cole aqui uma resposta real do backend ou deixe vazio para usar simulação..."
            />
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={testExtraction}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
            >
              🧪 Testar Extração
            </button>
            
            <button 
              onClick={testWithRealBackend}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium"
            >
              🌐 Obter Resposta Real
            </button>
          </div>
        </div>
        
        {results && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">📋 Resultados da Extração</h2>
              <div className="space-y-2 text-sm">
                <div><strong>🔍 Detectou gráficos:</strong> {results.hasCharts ? 'Sim' : 'Não'}</div>
                <div><strong>📊 Gráficos extraídos:</strong> {results.extractedChartCount}</div>
                <div><strong>📝 Conteúdo limpo:</strong></div>
                <pre className="bg-slate-700 p-3 rounded text-xs mt-2">{results.cleanedContent}</pre>
              </div>
            </div>
            
            {results.charts.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">📊 Gráficos Extraídos</h2>
                <div className="space-y-4">
                  {results.charts.map((chart) => (
                    <div key={chart.index} className="border border-slate-700 rounded-lg p-4">
                      <div className="text-sm space-y-1">
                        <div><strong>Índice:</strong> {chart.index}</div>
                        <div><strong>Tipo:</strong> {chart.type}</div>
                        <div><strong>Título:</strong> {chart.title}</div>
                        <div><strong>Preview Base64:</strong> {chart.base64Preview}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">🎯 Diagnóstico</h2>
              <div className="text-sm space-y-2">
                {!results.hasCharts && (
                  <div className="text-yellow-400">⚠️ O conteúdo não contém gráficos base64</div>
                )}
                {results.hasCharts && results.extractedChartCount === 0 && (
                  <div className="text-red-400">❌ Detectou gráficos mas falhou na extração</div>
                )}
                {results.extractedChartCount > 0 && (
                  <div className="text-green-400">✅ Extração bem-sucedida!</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}