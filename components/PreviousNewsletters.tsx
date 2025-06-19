import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Copy, Eye, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

import type { Newsletter } from "./types";

interface PreviousNewslettersProps {
  newsletters: Newsletter[];
  onCopyToClipboard: (text: string) => void;
  onDeleteNewsletter: (id: string) => void;
}

export function PreviousNewsletters({
  newsletters,
  onCopyToClipboard,
  onDeleteNewsletter,
}: PreviousNewslettersProps) {
  if (newsletters.length === 0) return null;

  return (
    <Card className="bg-white border shadow-lg">
      <CardHeader>
        <CardTitle>Previous Newsletters</CardTitle>
        <CardDescription>Your previously generated newsletters</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {newsletters.slice(0, 5).map((newsletter) => (
            <Card
              key={newsletter.id}
              className="bg-white border border-gray-200 shadow-sm"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      Newsletter from{" "}
                      {format(
                        new Date(newsletter.generatedAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                    <p className="text-xs text-gray-600">
                      {newsletter.content.substring(0, 100)}...
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto bg-white">
                        <DialogHeader>
                          <DialogTitle className="flex items-center justify-between">
                            <span>
                              Newsletter from{" "}
                              {format(new Date(newsletter.generatedAt), "PPP")}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                onCopyToClipboard(newsletter.content)
                              }
                              className="cursor-pointer"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </Button>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="prose max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({
                                children,
                              }: {
                                children: React.ReactNode;
                              }) => (
                                <p className="mb-4 leading-relaxed">
                                  {children}
                                </p>
                              ),
                              h1: ({
                                children,
                              }: {
                                children: React.ReactNode;
                              }) => (
                                <h1 className="text-2xl font-bold mb-4 mt-6">
                                  {children}
                                </h1>
                              ),
                              h2: ({
                                children,
                              }: {
                                children: React.ReactNode;
                              }) => (
                                <h2 className="text-xl font-semibold mb-3 mt-5">
                                  {children}
                                </h2>
                              ),
                              h3: ({
                                children,
                              }: {
                                children: React.ReactNode;
                              }) => (
                                <h3 className="text-lg font-medium mb-2 mt-4">
                                  {children}
                                </h3>
                              ),
                              ul: ({
                                children,
                              }: {
                                children: React.ReactNode;
                              }) => (
                                <ul className="list-disc pl-6 mb-4 space-y-1">
                                  {children}
                                </ul>
                              ),
                              ol: ({
                                children,
                              }: {
                                children: React.ReactNode;
                              }) => (
                                <ol className="list-decimal pl-6 mb-4 space-y-1">
                                  {children}
                                </ol>
                              ),
                              li: ({
                                children,
                              }: {
                                children: React.ReactNode;
                              }) => (
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
                              code: ({
                                children,
                              }: {
                                children: React.ReactNode;
                              }) => (
                                <code className="bg-gray-200 px-1 py-0.5 rounded text-sm">
                                  {children}
                                </code>
                              ),
                              pre: ({
                                children,
                              }: {
                                children: React.ReactNode;
                              }) => (
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
                              strong: ({
                                children,
                              }: {
                                children: React.ReactNode;
                              }) => (
                                <strong className="font-semibold">
                                  {children}
                                </strong>
                              ),
                              em: ({
                                children,
                              }: {
                                children: React.ReactNode;
                              }) => <em className="italic">{children}</em>,
                            }}
                          >
                            {newsletter.content}
                          </ReactMarkdown>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteNewsletter(newsletter.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
