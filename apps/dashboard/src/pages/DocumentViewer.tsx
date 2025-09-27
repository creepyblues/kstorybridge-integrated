import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@kstorybridge/ui";
import { StandardButton } from "@/components/StandardButton";
import {
  ArrowLeft,
  FileText,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  AlertCircle
} from "lucide-react";

interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
}

export default function DocumentViewer() {
  const { filename } = useParams<{ filename: string }>();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toc, setToc] = useState<TableOfContentsItem[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!filename) return;

    const loadDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        let response: Response | null = null;
        let lastError: string = '';

        // Try multiple file paths in order of preference
        const paths = [
          `/docs/${filename}`,                              // Primary: Public docs directory
          `/${filename}`,                                   // Fallback: Root directory
          `/apps/dashboard/${filename}`,                    // Fallback: Dashboard directory
          `${window.location.origin}/docs/${filename}`,    // Absolute docs URL
          `${window.location.origin}/${filename}`          // Absolute root URL
        ];

        for (const path of paths) {
          try {
            response = await fetch(path);
            if (response.ok) {
              break; // Found the file, stop trying
            } else {
              lastError = `HTTP ${response.status} for ${path}`;
            }
          } catch (fetchError) {
            lastError = `Network error for ${path}: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`;
            continue;
          }
        }

        if (!response || !response.ok) {
          throw new Error(`Document not found: ${filename}. Last error: ${lastError}`);
        }

        const text = await response.text();

        // Validate that we got actual content
        if (!text.trim()) {
          throw new Error(`Document is empty: ${filename}`);
        }

        setContent(text);

        // Generate table of contents
        const tocItems = generateTableOfContents(text);
        setToc(tocItems);
      } catch (err) {
        console.error('Document loading error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [filename]);

  const generateTableOfContents = (markdown: string): TableOfContentsItem[] => {
    const lines = markdown.split('\n');
    const tocItems: TableOfContentsItem[] = [];

    // Helper function to generate header ID (matching the one in formatMarkdown)
    const generateHeaderId = (title: string): string => {
      return title.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
    };

    lines.forEach((line) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const title = match[2].trim();
        const id = generateHeaderId(title);

        tocItems.push({ id, title, level });
      }
    });

    return tocItems;
  };

  const formatMarkdown = (markdown: string): string => {
    let html = markdown;
    const processedLines: string[] = [];
    const lines = html.split('\n');
    let inCodeBlock = false;
    let inTable = false;
    let inList = false;
    let listType = '';
    let listLevel = 0;

    // Helper function to generate header ID
    const generateHeaderId = (title: string): string => {
      return title.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
    };

    // Helper function to create table from markdown
    const createTable = (tableLines: string[]): string => {
      if (tableLines.length < 2) return tableLines.join('\n');

      const headers = tableLines[0].split('|').map(h => h.trim()).filter(h => h);
      const rows = tableLines.slice(2).map(row =>
        row.split('|').map(cell => cell.trim()).filter(cell => cell)
      );

      let tableHtml = '<div class="overflow-x-auto mb-6">';
      tableHtml += '<table class="min-w-full border border-gray-300 rounded-lg overflow-hidden">';

      // Table header
      tableHtml += '<thead class="bg-gray-50">';
      tableHtml += '<tr>';
      headers.forEach(header => {
        tableHtml += `<th class="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-300">${header}</th>`;
      });
      tableHtml += '</tr>';
      tableHtml += '</thead>';

      // Table body
      tableHtml += '<tbody class="divide-y divide-gray-200">';
      rows.forEach((row, index) => {
        const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        tableHtml += `<tr class="${rowClass}">`;
        row.forEach(cell => {
          tableHtml += `<td class="px-4 py-3 text-sm text-gray-700">${cell}</td>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody>';
      tableHtml += '</table>';
      tableHtml += '</div>';

      return tableHtml;
    };

    // Helper function to handle code blocks with syntax highlighting
    const createCodeBlock = (language: string, code: string): string => {
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      const languageClass = language ? `language-${language}` : '';
      const languageLabel = language ? `<span class="text-xs text-gray-500 mb-2 block uppercase font-semibold">${language}</span>` : '';

      return `
        <div class="relative bg-gray-900 rounded-lg p-4 mb-6 overflow-hidden">
          ${languageLabel}
          <pre class="text-sm text-gray-100 overflow-x-auto"><code class="${languageClass}">${escapedCode}</code></pre>
          <button class="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors" onclick="navigator.clipboard.writeText(\`${code.replace(/`/g, '\\`')}\`)">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          </button>
        </div>
      `;
    };

    // Helper function to create callout boxes
    const createCallout = (type: string, content: string): string => {
      const styles = {
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        note: 'bg-blue-50 border-blue-200 text-blue-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        success: 'bg-green-50 border-green-200 text-green-800'
      };

      const icons = {
        warning: '⚠️',
        note: 'ℹ️',
        info: 'ℹ️',
        error: '❌',
        success: '✅'
      };

      const style = styles[type.toLowerCase()] || styles.info;
      const icon = icons[type.toLowerCase()] || icons.info;

      return `
        <div class="border-l-4 ${style} p-4 mb-6 rounded-r-lg">
          <div class="flex items-start">
            <span class="text-lg mr-2">${icon}</span>
            <div class="flex-1">
              <strong class="uppercase text-sm font-semibold">${type}</strong>
              <p class="mt-1">${content}</p>
            </div>
          </div>
        </div>
      `;
    };

    let tableLines: string[] = [];
    let currentCodeBlock = '';
    let currentCodeLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Handle code blocks
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          processedLines.push(createCodeBlock(currentCodeLanguage, currentCodeBlock.trim()));
          inCodeBlock = false;
          currentCodeBlock = '';
          currentCodeLanguage = '';
        } else {
          // Start code block
          currentCodeLanguage = trimmed.substring(3).trim();
          inCodeBlock = true;
          currentCodeBlock = '';
        }
        continue;
      }

      if (inCodeBlock) {
        currentCodeBlock += line + '\n';
        continue;
      }

      // Handle tables
      if (trimmed.includes('|') && (trimmed.startsWith('|') || trimmed.split('|').length > 2)) {
        if (!inTable) {
          inTable = true;
          tableLines = [];
        }
        tableLines.push(line);
        continue;
      } else if (inTable) {
        // End of table
        processedLines.push(createTable(tableLines));
        inTable = false;
        tableLines = [];
      }

      // Handle horizontal rules
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        processedLines.push('<hr class="border-gray-300 my-8">');
        continue;
      }

      // Handle headers
      const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();
        const id = generateHeaderId(title);
        const sizeClasses = {
          1: 'text-3xl font-bold mt-10 mb-6',
          2: 'text-2xl font-bold mt-8 mb-5',
          3: 'text-xl font-semibold mt-6 mb-4',
          4: 'text-lg font-semibold mt-5 mb-3',
          5: 'text-base font-semibold mt-4 mb-2',
          6: 'text-sm font-semibold mt-3 mb-2'
        };

        processedLines.push(`<h${level} id="${id}" class="${sizeClasses[level]} text-gray-900">${title}</h${level}>`);
        continue;
      }

      // Handle special callouts
      const calloutMatch = trimmed.match(/^\*\*(WARNING|NOTE|INFO|ERROR|SUCCESS)\*\*:\s*(.+)$/i);
      if (calloutMatch) {
        const type = calloutMatch[1];
        const content = calloutMatch[2];
        processedLines.push(createCallout(type, content));
        continue;
      }

      // Handle blockquotes
      if (trimmed.startsWith('> ')) {
        const content = trimmed.substring(2);
        processedLines.push(`<blockquote class="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">${content}</blockquote>`);
        continue;
      }

      // Handle lists
      const listMatch = trimmed.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
      if (listMatch) {
        const indent = listMatch[1].length;
        const marker = listMatch[2];
        const content = listMatch[3];
        const isOrdered = /\d+\./.test(marker);

        if (!inList) {
          inList = true;
          listType = isOrdered ? 'ol' : 'ul';
          listLevel = indent;
          const listClass = isOrdered ? 'list-decimal list-inside space-y-1 mb-4 ml-4' : 'list-disc list-inside space-y-1 mb-4 ml-4';
          processedLines.push(`<${listType} class="${listClass}">`);
        }

        // Process inline formatting in list content
        let formattedContent = content;
        formattedContent = formattedContent.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
        formattedContent = formattedContent.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
        formattedContent = formattedContent.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
        formattedContent = formattedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline">$1</a>');

        processedLines.push(`<li class="mb-1">${formattedContent}</li>`);
        continue;
      } else if (inList) {
        // End list
        processedLines.push(`</${listType}>`);
        inList = false;
      }

      // Handle regular paragraphs
      if (trimmed) {
        let formattedLine = line;

        // Apply inline formatting
        formattedLine = formattedLine.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
        formattedLine = formattedLine.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>');
        formattedLine = formattedLine.replace(/~~(.+?)~~/g, '<del class="line-through">$1</del>');
        formattedLine = formattedLine.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
        formattedLine = formattedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline transition-colors">$1</a>');

        processedLines.push(`<p class="mb-4 text-gray-700 leading-relaxed">${formattedLine}</p>`);
      } else {
        processedLines.push('<br>');
      }
    }

    // Close any remaining open elements
    if (inList) {
      processedLines.push(`</${listType}>`);
    }
    if (inTable && tableLines.length > 0) {
      processedLines.push(createTable(tableLines));
    }

    return processedLines.join('\n');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard');
    }
  };

  const getDocumentTitle = (): string => {
    if (!filename) return 'Document';

    // Remove .md extension and convert to title case
    return filename
      .replace('.md', '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading document...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Card className="bg-transparent border-gray-300 shadow-none">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Document Not Found</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to="/docs">
              <StandardButton variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Documentation
              </StandardButton>
            </Link>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/docs">
              <StandardButton variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Docs
              </StandardButton>
            </Link>
            <button onClick={copyToClipboard} className="p-2 text-gray-500 hover:text-gray-700">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{getDocumentTitle()}</h1>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {filename}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Table of Contents */}
          {toc.length > 0 && (
            <div className="lg:col-span-1">
              <Card className="bg-transparent border-gray-300 shadow-none sticky top-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                    Table of Contents
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <nav className="space-y-1">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block text-sm hover:text-blue-600 py-1.5 transition-colors border-l-2 border-transparent hover:border-blue-200 ${
                          item.level === 1 ? 'font-semibold text-gray-900 pl-3' :
                          item.level === 2 ? 'font-medium text-gray-700 pl-4' :
                          item.level === 3 ? 'text-gray-600 pl-6' :
                          'text-gray-500 pl-8'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          const element = document.getElementById(item.id);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                      >
                        {item.title}
                      </a>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Document Content */}
          <div className={toc.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <Card className="bg-transparent border-gray-300 shadow-none">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div
                  className="markdown-content prose prose-gray max-w-none"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                    lineHeight: '1.7'
                  }}
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}