"use client";

import { useState } from "react";

export default function TestBackendConnection() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  const testBackend = async () => {
    setLoading(true);
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
      
      const payload = {
        question: "Análise do setor petrolífero em Angola com gráfico de linha",
        chart_types: ["line"],
        analysis_type: "comprehensive"
      };
      
      console.log("🧪 Testando backend:", apiUrl);
      console.log("📤 Payload:", payload);
      
      const response = await fetch(`${apiUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      console.log("📥 Status:", response.status);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Análise da resposta
      const hasCharts = data.answer && /data:image\/(png|jpeg|jpg|gif);base64,/.test(data.answer);
      const chartCount = hasCharts ? (data.answer.match(/data:image\/(png|jpeg|jpg|gif);base64,/g) || []).length : 0;
      
      const analysis = `
✅ Conexão com backend bem-sucedida!

📊 Estatísticas da resposta:
- Status: ${response.status}
- Tamanho da resposta: ${JSON.stringify(data).length} caracteres
- Contém gráficos: ${hasCharts}
- Número de gráficos: ${chartCount}

🔍 Primeiros 500 caracteres da resposta:
${data.answer ? data.answer.substring(0, 500) + "..." : "Sem resposta"}

📄 Estrutura do objeto:
${JSON.stringify(Object.keys(data), null, 2)}
      `;
      
      setResult(analysis);
      
    } catch (error) {
      console.error("❌ Erro:", error);
      setResult(`❌ Erro ao conectar com backend:\n${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔗 Teste de Conexão com Backend</h1>
        
        <div className="mb-8">
          <button 
            onClick={testBackend}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium"
          >
            {loading ? "🔄 Testando..." : "🧪 Testar Conexão"}
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