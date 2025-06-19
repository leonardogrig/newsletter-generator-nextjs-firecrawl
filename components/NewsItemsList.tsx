import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

import { NewsItemCard } from "./SortableNewsItem";
import type { NewsItem } from "./types";

interface NewsItemsListProps {
  newsItems: NewsItem[];
  isGenerating: boolean;
  structuringItems: Set<string>;
  isCollapsed: boolean;
  onNewsItemsChange: (items: NewsItem[]) => void;
  onRemoveNewsItem: (id: string) => void;
  onStructureNewsItem: (id: string) => void;
  onGenerateNewsletter: () => void;
  onToggleCollapsed: () => void;
}

export function NewsItemsList({
  newsItems,
  isGenerating,
  structuringItems,
  isCollapsed,
  onNewsItemsChange,
  onRemoveNewsItem,
  onStructureNewsItem,
  onGenerateNewsletter,
  onToggleCollapsed,
}: NewsItemsListProps) {
  // Sort news items by priority: active items first, then by date
  const sortedNewsItems = [...newsItems].sort((a, b) => {
    // First priority: Active/selected items come first
    if (a.isSelected && !b.isSelected) return -1;
    if (!a.isSelected && b.isSelected) return 1;

    // Within each group (active/inactive), sort by date
    // Use publishedAt if available, then extractedDate, then scrapedAt
    const getDateForSorting = (item: NewsItem) => {
      if (item.publishedAt) return new Date(item.publishedAt);
      if (item.extractedDate) return new Date(item.extractedDate);
      return new Date(item.scrapedAt);
    };

    const dateA = getDateForSorting(a);
    const dateB = getDateForSorting(b);

    // Sort in descending order (most recent first)
    return dateB.getTime() - dateA.getTime();
  });

  const activeItemsCount = newsItems.filter((item) => item.isSelected).length;

  return (
    <Card className="bg-white border shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapsed}
              className="p-1 h-8 w-8"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2">
                Scraped Articles
                {newsItems.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {newsItems.length} total
                  </span>
                )}
                {activeItemsCount > 0 && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    {activeItemsCount} active
                  </span>
                )}
              </CardTitle>
              {!isCollapsed && (
                <CardDescription>
                  Click "Structure" to process articles with AI and activate
                  them for newsletter generation. Active articles appear first.
                </CardDescription>
              )}
            </div>
          </div>
          {activeItemsCount > 0 && (
            <Button
              onClick={onGenerateNewsletter}
              disabled={isGenerating}
              className="cursor-pointer"
            >
              {isGenerating ? "Generating..." : "Generate Newsletter"}
            </Button>
          )}
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          {newsItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No articles found yet.</p>
              <p className="text-sm">
                Start by fetching news from your sources above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedNewsItems.map((news) => (
                <NewsItemCard
                  key={news.id}
                  news={news}
                  onRemove={onRemoveNewsItem}
                  onStructure={onStructureNewsItem}
                  isStructuring={structuringItems.has(news.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
