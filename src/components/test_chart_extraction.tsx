"use client";

import { useState } from "react";

export default function TestChartExtraction() {
  const [debugInfo, setDebugInfo] = useState<string>("");
  
  const testExtraction = () => {
    // Simular a resposta que o backend envia
    const mockResponse = `## Análise Contextual de Dados Reais

Análise baseada em dados reais extraídos de fontes oficiais do setor petrolífero angolano

### 📋 Resumo Executivo

Análise baseada em 7 dados reais extraídos de fontes oficiais do setor petrolífero angolano.

### 📊 Visualizações:

**Gráfico 1:** Gráfico line gerado com análise avançada
![Gráfico line](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==)

Mais texto após o gráfico...`;

    // Testar extração de gráficos
    const base64Pattern = /data:image\/(png|jpeg|jpg|gif);base64,([A-Za-z0-9+/=]+)/g;
    const matches = mockResponse.match(base64Pattern);
    
    // Testar detecção de tipo
    const lowerText = mockResponse.toLowerCase();
    const hasLine = lowerText.includes('line');
    const hasLinha = lowerText.includes('linha');
    
    // Testar detecção de título
    const lines = mockResponse.split('\n');
    let title = "Gráfico 1";
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('data:image')) {
        // Procurar título acima do gráfico
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
          const line = lines[j].trim();
          if (line.startsWith('**') && line.endsWith('**')) {
            title = line.replace(/\*\*/g, '');
            break;
          }
        }
        break;
      }
    }
    
    const debug = `
🧪 Teste de Extração de Gráficos

📊 Estatísticas:
- Tamanho do texto: ${mockResponse.length} caracteres
- Contém 'line': ${hasLine}
- Contém 'linha': ${hasLinha}
- Matches base64: ${matches ? matches.length : 0}

📝 Linhas encontradas:
${lines.filter(line => line.includes('Gráfico') || line.includes('data:image')).join('\n')}

🏷️ Título detectado: ${title}

🔍 Matches base64: ${matches ? matches.join('\n').substring(0, 100) + '...' : 'Nenhum'}
    `;
    
    setDebugInfo(debug);
  };
  
  return (
    <div className="p-4 bg-slate-800 text-white rounded-lg">
      <h3 className="text-lg font-bold mb-4">🧪 Teste de Extração de Gráficos</h3>
      <button 
        onClick={testExtraction}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mb-4"
      >
        Executar Teste
      </button>
      {debugInfo && (
        <pre className="bg-slate-900 p-4 rounded text-sm overflow-auto max-h-96">
          {debugInfo}
        </pre>
      )}
    </div>
  );
}