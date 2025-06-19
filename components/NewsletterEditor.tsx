import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface NewsletterEditorProps {
  generatedNewsletter: string;
  isGenerating: boolean;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onCopyToClipboard: (text: string) => void;
}

export function NewsletterEditor({
  generatedNewsletter,
  isGenerating,
  onContentChange,
  onSave,
  onCopyToClipboard,
}: NewsletterEditorProps) {
  if (!generatedNewsletter) return null;

  return (
    <Card className="bg-white border shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Generated Newsletter</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => onCopyToClipboard(generatedNewsletter)}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={onSave}
              className="cursor-pointer"
              disabled={isGenerating}
            >
              <Save className="w-4 h-4 mr-2" />
              {isGenerating ? "Saving..." : "Save Newsletter"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Editor:</h4>
            <div className="bg-white border rounded-lg">
              <textarea
                value={generatedNewsletter}
                onChange={(e) => onContentChange(e.target.value)}
                className="w-full h-96 p-4 border-none resize-none focus:outline-none newsletter-editor custom-scrollbar"
                placeholder="Your generated newsletter will appear here..."
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Preview:</h4>
            <div className="bg-gray-50 border rounded-lg p-4 h-96 overflow-y-auto custom-scrollbar">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }: { children: React.ReactNode }) => (
                      <p className="mb-4 leading-relaxed">{children}</p>
                    ),
                    h1: ({ children }: { children: React.ReactNode }) => (
                      <h1 className="text-2xl font-bold mb-4 mt-6">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }: { children: React.ReactNode }) => (
                      <h2 className="text-xl font-semibold mb-3 mt-5">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }: { children: React.ReactNode }) => (
                      <h3 className="text-lg font-medium mb-2 mt-4">
                        {children}
                      </h3>
                    ),
                    ul: ({ children }: { children: React.ReactNode }) => (
                      <ul className="list-disc pl-6 mb-4 space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }: { children: React.ReactNode }) => (
                      <ol className="list-decimal pl-6 mb-4 space-y-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }: { children: React.ReactNode }) => (
                      <li className="leading-relaxed">{children}</li>
                    ),
                    blockquote: ({
                      children,
                    }: {
                      children: React.ReactNode;
                    }) => (
                      <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }: { children: React.ReactNode }) => (
                      <code className="bg-gray-200 px-1 py-0.5 rounded text-sm">
                        {children}
                      </code>
                    ),
                    pre: ({ children }: { children: React.ReactNode }) => (
                      <pre className="bg-gray-200 p-3 rounded mb-4 overflow-x-auto">
                        {children}
                      </pre>
                    ),
                    a: ({
                      href,
                      children,
                    }: {
                      href?: string;
                      children: React.ReactNode;
                    }) => (
                      <a
                        href={href}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    strong: ({ children }: { children: React.ReactNode }) => (
                      <strong className="font-semibold">{children}</strong>
                    ),
                    em: ({ children }: { children: React.ReactNode }) => (
                      <em className="italic">{children}</em>
                    ),
                  }}
                >
                  {generatedNewsletter}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
