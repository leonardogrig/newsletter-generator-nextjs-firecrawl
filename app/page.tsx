"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow, formatDistance } from "date-fns";
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
import { Loader2, Plus, X, ExternalLink, Star, Settings, Trash2, FileText, ChevronDown, ArrowUpDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  labels: string[];
  searchTerm: {
    term: string;
  };
}

interface Newsletter {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  newsIds: string[];
  createdAt: string;
}

interface NewsletterSuggestions {
  titles: string[];
  subtitles: string[];
}

export default function NewsAggregator() {
  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>([]);
  const [newTerm, setNewTerm] = useState("");
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [brandPersona, setBrandPersona] = useState("25 to 35 year old males interested in using AI for coding. Entrepreneurs, Solopreneurs, Content creators, Developers.");
  const [savedBrandPersona, setSavedBrandPersona] = useState("");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedNewsIds, setSelectedNewsIds] = useState<Set<string>>(
    new Set()
  );
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState<NewsletterSuggestions | null>(null);
  const [pendingNewsletterId, setPendingNewsletterId] = useState<string | null>(null);
  const [pendingNewsletterContent, setPendingNewsletterContent] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "rating">("date");
  const [isFetchingHN, setIsFetchingHN] = useState(false);
  const [fetchingSummaryFor, setFetchingSummaryFor] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadSearchTerms();
    loadNews();
    loadBrandPersona();
    loadNewsletters();

    // Load last fetch time from localStorage
    const savedFetchTime = localStorage.getItem("lastFetchTime");
    if (savedFetchTime) {
      setLastFetchTime(new Date(savedFetchTime));
    }
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

  const loadNewsletters = async () => {
    try {
      const response = await fetch("/api/newsletter");
      const data = await response.json();
      setNewsletters(data);
    } catch (error) {
      console.error("Failed to load newsletters:", error);
      toast.error("Failed to load newsletters");
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

  const fetchNews = async (selectedTimeRange: string) => {
    if (searchTerms.length === 0) {
      toast.error("Please add at least one search term first");
      return;
    }

    setIsFetching(true);
    toast.loading(`Fetching news from the last ${selectedTimeRange}...`, { id: "fetch-news" });

    try {
      const response = await fetch("/api/cron/fetch-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeRange: selectedTimeRange }),
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

      // Update last fetch time
      const now = new Date();
      setLastFetchTime(now);
      localStorage.setItem("lastFetchTime", now.toISOString());

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

  const fetchHackerNews = async () => {
    setIsFetchingHN(true);
    toast.loading("Fetching Hacker News...", { id: "fetch-hn" });

    try {
      const response = await fetch("/api/cron/fetch-hackernews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch Hacker News");
      }

      const result = await response.json();

      toast.success(
        `Successfully added ${result.totalAdded} Hacker News items!`,
        { id: "fetch-hn" }
      );

      // Reload news and search terms to show updated counts
      loadNews();
      loadSearchTerms();
    } catch (error: unknown) {
      console.error("Failed to fetch Hacker News:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch Hacker News";
      toast.error(errorMessage, {
        id: "fetch-hn",
      });
    } finally {
      setIsFetchingHN(false);
    }
  };

  const fetchSummaryForNews = async (newsId: string) => {
    setFetchingSummaryFor(newsId);
    toast.loading("Fetching summary...", { id: `fetch-summary-${newsId}` });

    try {
      const response = await fetch(`/api/news/${newsId}/fetch-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch summary");
      }

      toast.success("Summary fetched successfully!", {
        id: `fetch-summary-${newsId}`,
      });

      // Reload news to show the updated summary
      loadNews();
    } catch (error: unknown) {
      console.error("Failed to fetch summary:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch summary";
      toast.error(errorMessage, {
        id: `fetch-summary-${newsId}`,
      });
    } finally {
      setFetchingSummaryFor(null);
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

  const checkAllNews = () => {
    const allNewsIds = newsItems.map(news => news.id);
    setSelectedNewsIds(new Set(allNewsIds));
  };

  const uncheckAllNews = () => {
    setSelectedNewsIds(new Set());
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

  const generateNewsletter = async () => {
    if (selectedNewsIds.size === 0) {
      toast.error("No news items selected");
      return;
    }

    setIsGenerating(true);
    toast.loading("Generating newsletter...", { id: "generate-newsletter" });

    try {
      const response = await fetch("/api/newsletter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsIds: Array.from(selectedNewsIds) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate newsletter");
      }

      const result = await response.json();

      toast.success("Newsletter generated! Please select a title and subtitle.", {
        id: "generate-newsletter",
      });

      // Show suggestions modal
      setPendingSuggestions(result.suggestions);
      setPendingNewsletterId(result.newsletter.id);
      setPendingNewsletterContent(result.newsletter.content);
      setSelectedTitle(null);
      setSelectedSubtitle(null);
      setIsNewsletterModalOpen(true);
    } catch (error: unknown) {
      console.error("Failed to generate newsletter:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate newsletter";
      toast.error(errorMessage, {
        id: "generate-newsletter",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveNewsletterTitleAndSubtitle = async () => {
    if (!pendingNewsletterId || !selectedTitle || !selectedSubtitle) {
      toast.error("Please select both a title and subtitle");
      return;
    }

    try {
      const response = await fetch(`/api/newsletter/${pendingNewsletterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedTitle,
          subtitle: selectedSubtitle,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update newsletter");
      }

      toast.success("Newsletter saved successfully!");

      // Clear pending state
      setPendingSuggestions(null);
      setPendingNewsletterId(null);
      setPendingNewsletterContent(null);
      setSelectedTitle(null);
      setSelectedSubtitle(null);

      // Reload newsletters
      loadNewsletters();
    } catch (error) {
      console.error("Failed to save newsletter:", error);
      toast.error("Failed to save newsletter");
    }
  };

  const deleteNewsletter = async (newsletterId: string) => {
    try {
      const response = await fetch(`/api/newsletter/${newsletterId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete newsletter");
      }

      toast.success("Newsletter deleted successfully!");

      // Close modal and clear state
      setSelectedNewsletter(null);
      setIsNewsletterModalOpen(false);

      // Reload newsletters
      loadNewsletters();
    } catch (error) {
      console.error("Failed to delete newsletter:", error);
      toast.error("Failed to delete newsletter");
    }
  };

  // Sort news items based on selected criteria
  const sortedNewsItems = [...newsItems].sort((a, b) => {
    if (sortBy === "rating") {
      const scoreA = a.brandScore ?? -1;
      const scoreB = b.brandScore ?? -1;
      return scoreB - scoreA; // Higher scores first
    } else {
      // Sort by date (fetchedAt)
      return new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime(); // Most recent first
    }
  });

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
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      disabled={isFetching || searchTerms.length === 0}
                    >
                      {isFetching ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          Fetch News
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => fetchNews("1h")}>
                      Last 1 hour
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fetchNews("12h")}>
                      Last 12 hours
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fetchNews("24h")}>
                      Last 24 hours
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fetchNews("48h")}>
                      Last 48 hours
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fetchNews("72h")}>
                      Last 72 hours
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={fetchHackerNews}
                  disabled={isFetchingHN}
                  variant="outline"
                >
                  {isFetchingHN ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    "Fetch Hacker News"
                  )}
                </Button>
                {lastFetchTime && (
                  <span className="text-xs text-gray-500">
                    Last fetched {formatDistance(lastFetchTime, new Date(), { addSuffix: true })}
                  </span>
                )}
              </div>
              {selectedNewsIds.size > 0 && (
                <>
                  <Button
                    onClick={generateNewsletter}
                    disabled={isGenerating}
                    size="sm"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Newsletter ({selectedNewsIds.size})
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={deleteSelectedNews}
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedNewsIds.size})
                  </Button>
                </>
              )}
              <Dialog
                open={isNewsletterModalOpen}
                onOpenChange={(open) => {
                  setIsNewsletterModalOpen(open);
                  if (!open) {
                    setSelectedNewsletter(null);
                    setPendingSuggestions(null);
                    setPendingNewsletterId(null);
                    setPendingNewsletterContent(null);
                    setSelectedTitle(null);
                    setSelectedSubtitle(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <FileText className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white border-gray-200 shadow-xl">
                  <DialogHeader>
                    <DialogTitle>
                      {pendingSuggestions
                        ? "Select Title and Subtitle"
                        : "Newsletters"}
                    </DialogTitle>
                    <DialogDescription>
                      {pendingSuggestions
                        ? "Choose one title and one subtitle for your newsletter"
                        : "View your generated newsletters"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {pendingSuggestions ? (
                      // Suggestions view
                      <div className="space-y-6">
                        {/* Title suggestions */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            Select a Title
                          </h3>
                          <div className="space-y-2">
                            {pendingSuggestions.titles.map((title, index) => (
                              <div
                                key={index}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                  selectedTitle === title
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300 bg-white"
                                }`}
                                onClick={() => setSelectedTitle(title)}
                              >
                                <p className="text-sm text-gray-900">{title}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Subtitle suggestions */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            Select a Subtitle
                          </h3>
                          <div className="space-y-2">
                            {pendingSuggestions.subtitles.map((subtitle, index) => (
                              <div
                                key={index}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                  selectedSubtitle === subtitle
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300 bg-white"
                                }`}
                                onClick={() => setSelectedSubtitle(subtitle)}
                              >
                                <p className="text-sm text-gray-700">{subtitle}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Newsletter content preview */}
                        {pendingNewsletterContent && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                              Newsletter Preview
                            </h3>
                            <div className="bg-white rounded-lg border border-gray-200 p-6 max-h-96 overflow-y-auto">
                              <div className="prose prose-gray max-w-none">
                                <ReactMarkdown
                                  components={{
                                    hr: ({ node, ...props }) => (
                                      <hr className="my-6 border-gray-300" {...props} />
                                    ),
                                    p: ({ node, ...props }) => (
                                      <p className="mb-4 text-gray-700 leading-relaxed" {...props} />
                                    ),
                                    strong: ({ node, ...props }) => (
                                      <strong className="font-semibold text-gray-900" {...props} />
                                    ),
                                  }}
                                >
                                  {pendingNewsletterContent}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={saveNewsletterTitleAndSubtitle}
                          disabled={!selectedTitle || !selectedSubtitle}
                          className="w-full"
                        >
                          Save Newsletter
                        </Button>
                      </div>
                    ) : !selectedNewsletter ? (
                      // Newsletter list view
                      <>
                        {newsletters.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-8">
                            No newsletters generated yet. Select some news items and click &quot;Generate Newsletter&quot; to create one.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {newsletters.map((newsletter) => (
                              <div
                                key={newsletter.id}
                                className="flex items-center justify-between bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => setSelectedNewsletter(newsletter)}
                              >
                                <div>
                                  <h3 className="font-medium text-gray-900">
                                    {newsletter.title}
                                  </h3>
                                  {newsletter.subtitle && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {newsletter.subtitle}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(newsletter.createdAt).toLocaleDateString('en-US', {
                                      month: 'long',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-gray-400" />
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      // Newsletter content view
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedNewsletter(null)}
                          >
                            ← Back to list
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteNewsletter(selectedNewsletter.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <h2 className="text-xl font-semibold mb-2 text-gray-900">
                            {selectedNewsletter.title}
                          </h2>
                          {selectedNewsletter.subtitle && (
                            <p className="text-sm text-gray-600 mb-6">
                              {selectedNewsletter.subtitle}
                            </p>
                          )}
                          <div className="prose prose-gray max-w-none">
                            <ReactMarkdown
                              components={{
                                hr: ({ node, ...props }) => (
                                  <hr className="my-6 border-gray-300" {...props} />
                                ),
                                p: ({ node, ...props }) => (
                                  <p className="mb-4 text-gray-700 leading-relaxed" {...props} />
                                ),
                                strong: ({ node, ...props }) => (
                                  <strong className="font-semibold text-gray-900" {...props} />
                                ),
                              }}
                            >
                              {selectedNewsletter.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Latest News ({newsItems.length})
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkAllNews}
                  disabled={newsItems.length === 0}
                >
                  Check All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={uncheckAllNews}
                  disabled={selectedNewsIds.size === 0}
                >
                  Uncheck All
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Sort by: {sortBy === "date" ? "Date" : "Rating"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSortBy("date")}>
                      Sort by Date
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("rating")}>
                      Sort by Rating
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {newsItems.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No news articles yet. Add search terms and click &quot;Fetch
                  News&quot; to get started.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                {sortedNewsItems.map((news) => (
                  <Card
                    key={news.id}
                    className="hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer relative"
                    onClick={() => toggleNewsSelection(news.id)}
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(news.url, "_blank");
                          }}
                          className="flex-shrink-0"
                        >
                          <ExternalLink className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors mt-1" />
                        </button>
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
                      {news.summary ? (
                        <p className="text-sm text-gray-600 mb-3">{news.summary}</p>
                      ) : (
                        <div className="mb-3">
                          <p className="text-sm text-gray-400 italic mb-2">No summary available</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchSummaryForNews(news.id);
                            }}
                            disabled={fetchingSummaryFor === news.id}
                          >
                            {fetchingSummaryFor === news.id ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Fetching...
                              </>
                            ) : (
                              "Fetch summary?"
                            )}
                          </Button>
                        </div>
                      )}
                      {news.labels && news.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          {news.labels.map((label) => (
                            <span
                              key={label}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                label === "HACKER_NEWS"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
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
