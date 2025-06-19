import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { FileText, X } from "lucide-react";
import { useState } from "react";

import type { NewsItem } from "./types";

interface NewsItemCardProps {
  news: NewsItem;
  onRemove: (id: string) => void;
  onStructure: (id: string) => void;
  isStructuring: boolean;
}

export function NewsItemCard({
  news,
  onRemove,
  onStructure,
  isStructuring,
}: NewsItemCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate character count
  const characterCount = (news.fullContent || news.summary).length;

  // Check if this item is structured (has the structured flag or is selected)
  const isStructured = (news as any).structured || news.isSelected;
  const isActive = news.isSelected;

  // Helper function to get time ago text
  const getTimeAgoText = (date: string | Date): string => {
    try {
      const publishDate = new Date(date);
      const now = new Date();
      const diffInDays = Math.floor(
        (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffInDays === 0) {
        return "today";
      } else if (diffInDays === 1) {
        return "1 day ago";
      } else {
        return `${diffInDays} days ago`;
      }
    } catch {
      return "";
    }
  };

  // Safe function to get hostname from URL
  const getHostnameFromUrl = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch (error) {
      console.warn("Invalid URL:", url, error);
      return url.length > 30 ? url.substring(0, 30) + "..." : url;
    }
  };

  // Handle delete with loading state
  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isDeleting) return; // Prevent double clicks

    setIsDeleting(true);
    try {
      await onRemove(news.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card
      className={`transition-all news-card border-2 hover:shadow-md ${
        isActive
          ? "bg-green-50 border-green-300"
          : isStructuring
          ? "bg-gray-50 border-gray-300"
          : "bg-white border-gray-200"
      }`}
    >
      <CardContent className="p-4">
        {isStructuring ? (
          // Enhanced loading state with animation
          <div className="space-y-3 relative">
            <div className="absolute inset-0 bg-white/50 rounded-lg flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600 font-medium">
                  Processing...
                </span>
              </div>
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-2">
              {isActive && (
                <div className="mb-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    ✓ Active for Newsletter
                  </span>
                </div>
              )}
              <h3 className="font-semibold text-sm mb-2 break-words line-clamp-2 leading-tight">
                <a
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  {news.title}
                </a>
              </h3>
              <p className="text-xs text-gray-600 mb-2 break-words line-clamp-3 leading-relaxed">
                {isStructured
                  ? news.summary ||
                    "No summary available - click Structure to generate"
                  : "Content not processed yet - click Structure to analyze and generate summary"}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span className="truncate min-w-0 flex-1 mr-2">
                  {news.sourceUrl && news.sourceUrl !== ""
                    ? news.sourceUrl
                    : getHostnameFromUrl(news.url)}
                </span>
                {(news.publishedAt || news.extractedDate) && (
                  <div className="whitespace-nowrap text-right">
                    <div className="text-gray-500">
                      {news.publishedAt
                        ? format(new Date(news.publishedAt), "MMM d")
                        : news.extractedDate
                        ? format(new Date(news.extractedDate), "MMM d") + " *"
                        : ""}
                    </div>
                    <div className="text-red-500 font-medium text-xs">
                      {news.publishedAt
                        ? getTimeAgoText(news.publishedAt)
                        : news.extractedDate
                        ? getTimeAgoText(news.extractedDate)
                        : ""}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
                  {characterCount.toLocaleString()} chars
                </span>
                {!isStructured && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs whitespace-nowrap">
                    Needs Structure
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {isStructured && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        View Full
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
                      <DialogHeader>
                        <DialogTitle className="text-left break-words">
                          {news.title}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600">
                          <p>
                            <strong>Source:</strong>{" "}
                            {news.sourceUrl && news.sourceUrl !== ""
                              ? news.sourceUrl
                              : getHostnameFromUrl(news.url)}
                          </p>
                          {news.publishedAt && (
                            <p>
                              <strong>Published:</strong>{" "}
                              {format(new Date(news.publishedAt), "PPP")}
                            </p>
                          )}
                          {!news.publishedAt && news.extractedDate && (
                            <p>
                              <strong>Extracted Date:</strong>{" "}
                              {format(new Date(news.extractedDate), "PPP")}{" "}
                              <em>(extracted from content)</em>
                            </p>
                          )}
                          <p className="break-all">
                            <strong>URL:</strong>{" "}
                            <a
                              href={news.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {news.url}
                            </a>
                          </p>
                          <p>
                            <strong>Character count:</strong>{" "}
                            {characterCount.toLocaleString()}
                          </p>
                        </div>
                        <div className="prose max-w-none">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                            {/* Show summary if available and structured, otherwise show full content */}
                            {news.summary && news.summary !== "" && isStructured
                              ? news.summary
                              : news.fullContent ||
                                news.summary ||
                                "No content available"}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {!isStructured && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStructure(news.id)}
                    className="cursor-pointer"
                    disabled={isStructuring}
                  >
                    {isStructuring ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-1"></div>
                        Processing...
                      </>
                    ) : (
                      "Structure"
                    )}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 ml-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700 p-2 cursor-pointer h-8 w-8"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                ) : (
                  <X className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
