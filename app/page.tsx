"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, X, ExternalLink, Star, Settings, Trash2 } from "lucide-react";

interface SearchTerm {
  id: string;
  term: string;
  createdAt: string;
  _count?: {
    news: number;
  };
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string | null;
  fetchedAt: string;
  brandScore: number | null;
  searchTerm: {
    term: string;
  };
}

interface BrandPersona {
  id: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function NewsAggregator() {
  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>([]);
  const [newTerm, setNewTerm] = useState("");
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [brandPersona, setBrandPersona] = useState("");
  const [savedBrandPersona, setSavedBrandPersona] = useState("");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedNewsIds, setSelectedNewsIds] = useState<Set<string>>(
    new Set()
  );

  // Load initial data
  useEffect(() => {
    loadSearchTerms();
    loadNews();
    loadBrandPersona();
  }, []);

  const loadSearchTerms = async () => {
    try {
      const response = await fetch("/api/search-terms");
      const data = await response.json();
      setSearchTerms(data);
    } catch (error) {
      console.error("Failed to load search terms:", error);
      toast.error("Failed to load search terms");
    }
  };

  const loadNews = async () => {
    try {
      const response = await fetch("/api/news");
      const data = await response.json();
      setNewsItems(data);
    } catch (error) {
      console.error("Failed to load news:", error);
      toast.error("Failed to load news");
    }
  };

  const loadBrandPersona = async () => {
    try {
      const response = await fetch("/api/brand-persona");
      const data = await response.json();
      setBrandPersona(data.description || "");
      setSavedBrandPersona(data.description || "");
    } catch (error) {
      console.error("Failed to load brand persona:", error);
    }
  };

  const saveBrandPersona = async () => {
    try {
      const response = await fetch("/api/brand-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: brandPersona }),
      });

      if (!response.ok) {
        throw new Error("Failed to save brand persona");
      }

      const data = await response.json();
      setSavedBrandPersona(data.description);
      toast.success("Brand persona saved successfully!");
    } catch (error) {
      console.error("Failed to save brand persona:", error);
      toast.error("Failed to save brand persona");
    }
  };

  const addSearchTerm = async () => {
    if (!newTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    try {
      const response = await fetch("/api/search-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: newTerm.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add search term");
      }

      const newSearchTerm = await response.json();
      setSearchTerms([...searchTerms, newSearchTerm]);
      setNewTerm("");
      toast.success("Search term added successfully");
    } catch (error: unknown) {
      console.error("Failed to add search term:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add search term";
      toast.error(errorMessage);
    }
  };

  const removeSearchTerm = async (id: string) => {
    try {
      const response = await fetch(`/api/search-terms/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove search term");
      }

      setSearchTerms(searchTerms.filter((term) => term.id !== id));
      toast.success("Search term removed successfully");

      // Reload news to reflect the change
      loadNews();
    } catch (error) {
      console.error("Failed to remove search term:", error);
      toast.error("Failed to remove search term");
    }
  };

  const fetchNews = async () => {
    if (searchTerms.length === 0) {
      toast.error("Please add at least one search term first");
      return;
    }

    setIsFetching(true);
    toast.loading("Fetching news...", { id: "fetch-news" });

    try {
      const response = await fetch("/api/cron/fetch-news", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch news");
      }

      const result = await response.json();

      toast.success(
        `Successfully added ${result.totalAdded} new articles!`,
        { id: "fetch-news" }
      );

      // Reload news and search terms to show updated counts
      loadNews();
      loadSearchTerms();
    } catch (error: unknown) {
      console.error("Failed to fetch news:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch news";
      toast.error(errorMessage, {
        id: "fetch-news",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const toggleNewsSelection = (newsId: string) => {
    setSelectedNewsIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(newsId)) {
        newSet.delete(newsId);
      } else {
        newSet.add(newsId);
      }
      return newSet;
    });
  };

  const deleteSelectedNews = async () => {
    if (selectedNewsIds.size === 0) {
      toast.error("No news items selected");
      return;
    }

    try {
      const response = await fetch("/api/news/delete-multiple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedNewsIds) }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete news items");
      }

      toast.success(`Deleted ${selectedNewsIds.size} news items`);
      setSelectedNewsIds(new Set());
      loadNews();
      loadSearchTerms();
    } catch (error) {
      console.error("Failed to delete news items:", error);
      toast.error("Failed to delete news items");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                News Aggregator
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Latest news based on your search terms
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={fetchNews}
                disabled={isFetching || searchTerms.length === 0}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Fetch News"
                )}
              </Button>
              {selectedNewsIds.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={deleteSelectedNews}
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedNewsIds.size})
                </Button>
              )}
              <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Configuration</DialogTitle>
                    <DialogDescription>
                      Manage your brand persona and search terms
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    {/* Brand Persona Section */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Brand Persona
                      </h3>
                      <Textarea
                        placeholder="e.g., 25 to 35 year old male interested in AI for coding"
                        value={brandPersona}
                        onChange={(e) => setBrandPersona(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <Button
                        onClick={saveBrandPersona}
                        disabled={brandPersona === savedBrandPersona}
                        size="sm"
                      >
                        Save Brand Persona
                      </Button>
                    </div>

                    {/* Divider */}
                    <div className="border-t" />

                    {/* Search Terms Section */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Search Terms
                      </h3>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., ai coding"
                          value={newTerm}
                          onChange={(e) => setNewTerm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              addSearchTerm();
                            }
                          }}
                        />
                        <Button onClick={addSearchTerm} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {searchTerms.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No search terms yet. Add one to get started.
                          </p>
                        ) : (
                          searchTerms.map((term) => (
                            <div
                              key={term.id}
                              className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                            >
                              <div>
                                <span className="font-medium">{term.term}</span>
                                {term._count && (
                                  <span className="ml-2 text-sm text-gray-500">
                                    ({term._count.news} articles)
                                  </span>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSearchTerm(term.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* News List */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Latest News ({newsItems.length})
            </h2>
            {newsItems.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No news articles yet. Add search terms and click &quot;Fetch
                  News&quot; to get started.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {newsItems.map((news) => (
                  <Card
                    key={news.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer relative"
                    onClick={() => window.open(news.url, "_blank")}
                  >
                    <div
                      className="absolute top-3 left-3 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedNewsIds.has(news.id)}
                        onCheckedChange={() => toggleNewsSelection(news.id)}
                      />
                    </div>
                    <CardHeader className="pl-10">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base line-clamp-2">
                          {news.title}
                        </CardTitle>
                        <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {news.publishedAt ||
                              formatDistanceToNow(new Date(news.fetchedAt), {
                                addSuffix: true,
                              })}
                          </span>
                          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded">
                            <Star className="h-3 w-3 text-yellow-600 fill-yellow-600" />
                            <span className="text-xs font-semibold text-yellow-900">
                              {news.brandScore !== null &&
                              news.brandScore !== undefined
                                ? news.brandScore.toFixed(1)
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pl-10">
                      <p className="text-sm text-gray-600">{news.summary}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
