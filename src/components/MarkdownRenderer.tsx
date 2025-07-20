import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none text-slate-100 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Headings with gradient effects and spacing
        h1: ({ children }) => (
          <h1 className="text-xl font-bold mb-4 mt-6 bg-gradient-to-r from-blue-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent leading-tight">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold mb-3 mt-5 text-slate-100 border-b border-slate-700/50 pb-2">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-bold mb-2 mt-4 text-slate-200 flex items-center gap-2">
            <span className="w-1 h-4 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full"></span>
            {children}
          </h3>
        ),
        
        // Enhanced paragraph with better spacing
        p: ({ children }) => (
          <p className="mb-4 leading-7 text-slate-100 font-medium tracking-wide">
            {children}
          </p>
        ),
        
        // Strong/Bold with gradient effect
        strong: ({ children }) => (
          <strong className="font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
            {children}
          </strong>
        ),
        
        // Emphasis/Italic with subtle glow
        em: ({ children }) => (
          <em className="italic text-blue-200 font-medium">
            {children}
          </em>
        ),
        
        // Enhanced lists with custom bullets and spacing
        ul: ({ children }) => (
          <ul className="mb-4 space-y-2 pl-4">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 space-y-2 pl-4">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-7 text-slate-100 font-medium flex items-start gap-3 relative">
            <span className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mt-3 flex-shrink-0"></span>
            <span className="flex-1">{children}</span>
          </li>
        ),
        
        // Enhanced code blocks with syntax highlighting feel
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-slate-800/80 text-emerald-300 px-2 py-1 rounded-md text-sm font-mono border border-slate-700/50 font-semibold">
                {children}
              </code>
            );
          }
          return (
            <div className="relative mb-4">
              <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-t-lg flex items-center px-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <pre className="bg-slate-900/90 border border-slate-700/50 pt-10 p-4 rounded-lg overflow-x-auto shadow-lg">
                <code className="text-sm font-mono text-emerald-300 font-medium leading-6">
                  {children}
                </code>
              </pre>
            </div>
          );
        },
        
        // Stunning blockquote with gradient border
        blockquote: ({ children }) => (
          <div className="relative mb-4">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500 rounded-full"></div>
            <blockquote className="pl-6 py-3 bg-slate-800/40 border border-slate-700/30 rounded-r-lg ml-2">
              <div className="text-slate-200 font-medium italic">
                {children}
              </div>
            </blockquote>
          </div>
        ),
        
        // Enhanced links with hover effects
        a: ({ children, href }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 font-semibold underline decoration-blue-500/50 underline-offset-2 hover:decoration-blue-400 transition-all duration-200"
          >
            {children}
          </a>
        ),
        
        // Beautiful tables with alternating rows
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4 rounded-lg border border-slate-700/50 shadow-lg">
            <table className="min-w-full">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800">
            {children}
          </thead>
        ),
        tbody: ({ children }) => <tbody className="divide-y divide-slate-700/50">{children}</tbody>,
        tr: ({ children, ...props }) => {
          // Check if this is a header row
          const isHeader = props.className?.includes('header') || false;
          return (
            <tr className={`${!isHeader ? 'hover:bg-slate-800/30 transition-colors duration-200' : ''}`}>
              {children}
            </tr>
          );
        },
        th: ({ children }) => (
          <th className="px-4 py-3 text-left text-sm font-bold text-slate-100 tracking-wide">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-3 text-sm text-slate-200 font-medium">
            {children}
          </td>
        ),
        
        // Elegant horizontal rule
        hr: () => (
          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
            <div className="px-4">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
          </div>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
