import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface CodeBlockProps {
  children: string;
  language?: string;
  className?: string;
  filename?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
}

export function CodeBlock({
  children,
  language = "text",
  className,
  filename,
  showLineNumbers = true,
  maxHeight = "400px",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Extract language from className if provided (react-markdown format)
  const extractedLanguage =
    language || className?.replace("language-", "") || "text";

  return (
    <div className={cn("relative group", className)}>
      {/* Header with filename and copy button */}
      {(filename || true) && (
        <div className="flex items-center justify-between bg-slate-800 text-slate-300 px-4 py-2 text-sm border-b border-slate-700 rounded-t-lg">
          <div className="flex items-center gap-2">
            {filename && (
              <span className="font-medium text-slate-200">{filename}</span>
            )}
            <span className="text-xs bg-slate-700 px-2 py-1 rounded capitalize">
              {extractedLanguage}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      )}

      {/* Code content */}
      <div className="relative">
        <SyntaxHighlighter
          language={extractedLanguage}
          style={oneDark}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            borderRadius: filename ? "0 0 0.5rem 0.5rem" : "0.5rem",
            maxHeight,
            fontSize: "0.875rem",
            lineHeight: "1.5",
          }}
          codeTagProps={{
            style: {
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            },
          }}
        >
          {children.trim()}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

// Export additional smaller inline code component
export function InlineCode({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <code
      className={cn(
        "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-1.5 py-0.5 rounded text-sm font-mono",
        className
      )}
    >
      {children}
    </code>
  );
}
