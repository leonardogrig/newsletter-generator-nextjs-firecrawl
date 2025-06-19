import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectItem } from "@/components/ui/select";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { NewsItemCard } from "./SortableNewsItem";
import type { NewsItem } from "./types";

type SortOption = "date-desc" | "date-asc" | "score-desc" | "score-asc";

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
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  // Sort news items based on selected option
  const getSortedNewsItems = () => {
    const sorted = [...newsItems].sort((a, b) => {
      // First priority: Active/selected items come first
      if (a.isSelected && !b.isSelected) return -1;
      if (!a.isSelected && b.isSelected) return 1;

      // Within each group (active/inactive), sort by selected criteria
      switch (sortBy) {
        case "date-desc": {
          const getDateForSorting = (item: NewsItem) => {
            if (item.publishedAt) return new Date(item.publishedAt);
            if (item.extractedDate) return new Date(item.extractedDate);
            return new Date(item.scrapedAt);
          };
          const dateA = getDateForSorting(a);
          const dateB = getDateForSorting(b);
          return dateB.getTime() - dateA.getTime(); // Most recent first
        }
        case "date-asc": {
          const getDateForSorting = (item: NewsItem) => {
            if (item.publishedAt) return new Date(item.publishedAt);
            if (item.extractedDate) return new Date(item.extractedDate);
            return new Date(item.scrapedAt);
          };
          const dateA = getDateForSorting(a);
          const dateB = getDateForSorting(b);
          return dateA.getTime() - dateB.getTime(); // Oldest first
        }
        case "score-desc": {
          const scoreA = a.brandScore ?? -1;
          const scoreB = b.brandScore ?? -1;
          return scoreB - scoreA; // Highest score first
        }
        case "score-asc": {
          const scoreA = a.brandScore ?? 11; // Put null scores at the end
          const scoreB = b.brandScore ?? 11;
          return scoreA - scoreB; // Lowest score first
        }
        default:
          return 0;
      }
    });

    return sorted;
  };

  const sortedNewsItems = getSortedNewsItems();
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
          <div className="flex items-center gap-3">
            {!isCollapsed && newsItems.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as SortOption)}
                  className="w-48"
                >
                  <SelectItem value="date-desc">
                    Date (Recent to Old)
                  </SelectItem>
                  <SelectItem value="date-asc">Date (Old to Recent)</SelectItem>
                  <SelectItem value="score-desc">
                    Score (High to Low)
                  </SelectItem>
                  <SelectItem value="score-asc">Score (Low to High)</SelectItem>
                </Select>
              </div>
            )}
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
