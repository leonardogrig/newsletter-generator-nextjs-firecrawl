"use client";

import { subDays } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Import all the modular components
import { DateRangeFetch } from "@/components/DateRangeFetch";
import { NewsItemsList } from "@/components/NewsItemsList";
import { NewsletterEditor } from "@/components/NewsletterEditor";
import { PreviousNewsletters } from "@/components/PreviousNewsletters";
import { UrlManagement } from "@/components/UrlManagement";

// Import types
import type { NewsItem, Newsletter, Url } from "@/components/types";

export default function NewsletterGenerator() {
  // State management
  const [urls, setUrls] = useState<Url[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newUrlName, setNewUrlName] = useState("");
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(
    subDays(new Date(), 7)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNewsletter, setGeneratedNewsletter] = useState("");
  const [isUrlSectionCollapsed, setIsUrlSectionCollapsed] = useState(true);
  const [isScrapedArticlesCollapsed, setIsScrapedArticlesCollapsed] =
    useState(false);

  const [structuringItems, setStructuringItems] = useState<Set<string>>(
    new Set()
  );

  // Load initial data
  useEffect(() => {
    loadUrls();
    loadPreviousNews();
    loadNewsletters();
  }, []);

  // API Functions
  const loadUrls = async () => {
    try {
      const response = await fetch("/api/urls");
      const data = await response.json();
      setUrls(data);
    } catch (error) {
      console.error("Failed to load URLs:", error);
      toast.error("Failed to load URLs");
    }
  };

  const loadPreviousNews = async () => {
    try {
      const response = await fetch("/api/news");
      const data = await response.json();
      setNewsItems(data);
    } catch (error) {
      console.error("Failed to load news:", error);
      toast.error("Failed to load news");
    }
  };

  const loadNewsletters = async () => {
    try {
      const response = await fetch("/api/newsletters");
      const data = await response.json();
      setNewsletters(data);
    } catch (error) {
      console.error("Failed to load newsletters:", error);
      toast.error("Failed to load newsletters");
    }
  };

  // URL Management Functions
  const addUrl = async () => {
    if (!newUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    try {
      new URL(newUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      const response = await fetch("/api/urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, name: newUrlName }),
      });

      if (!response.ok) {
        throw new Error("Failed to add URL");
      }

      const newUrlData = await response.json();
      setUrls([...urls, newUrlData]);
      setNewUrl("");
      setNewUrlName("");
      toast.success("URL added successfully");
    } catch (error) {
      console.error("Failed to add URL:", error);
      toast.error("Failed to add URL");
    }
  };

  const removeUrl = async (id: string) => {
    try {
      const response = await fetch(`/api/urls/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to remove URL");
      }
      setUrls(urls.filter((url) => url.id !== id));
      toast.success("URL removed successfully");
    } catch (error) {
      console.error("Failed to remove URL:", error);
      toast.error("Failed to remove URL");
    }
  };

  // News Fetching Functions
  const fetchNews = async () => {
    if (urls.length === 0) {
      toast.error("Please add some URLs first");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please select valid start and end dates");
      return;
    }

    toast.loading("Starting batch scrape with LLM processing...", {
      id: "fetch-news",
    });

    try {
      const response = await fetch("/api/fetch-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: urls.map((u) => u.url),
          dateRange: { from: startDate, to: endDate },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start batch scrape");
      }

      const result = await response.json();

      toast.success(
        `Successfully processed ${
          result.articleCount || 0
        } articles! Check the scraped articles below.`,
        { id: "fetch-news" }
      );

      // Refresh news items to show the new articles
      loadPreviousNews();
    } catch (error: any) {
      console.error("Failed to start batch scrape:", error);
      toast.error(error.message || "Failed to start batch scrape", {
        id: "fetch-news",
      });
    }
  };

  // News Item Functions
  const structureNewsItem = async (newsId: string) => {
    try {
      setStructuringItems((prev) => new Set([...prev, newsId]));

      const response = await fetch("/api/news/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to structure news item");
      }

      const updatedNewsItem = await response.json();

      setNewsItems((items) =>
        items.map((item) =>
          item.id === newsId ? { ...updatedNewsItem, structured: true } : item
        )
      );

      if (updatedNewsItem.hasValidArticle) {
        toast.success("Article structured and activated!", { duration: 3000 });
      } else {
        toast.warning("No valid article found in this content", {
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error("Failed to structure news item:", error);
      toast.error(error.message || "Failed to structure news item", {
        duration: 3000,
      });
    } finally {
      setStructuringItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(newsId);
        return newSet;
      });
    }
  };

  const removeNewsItem = async (id: string) => {
    try {
      const response = await fetch(`/api/news/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete news item");
      }
      setNewsItems(newsItems.filter((item) => item.id !== id));
      toast.success("News article deleted successfully");
    } catch (error) {
      console.error("Failed to delete news item:", error);
      toast.error("Failed to delete news article");
    }
  };

  // Newsletter Generation Functions
  const generateNewsletter = async () => {
    const selectedItems = newsItems.filter((item) => item.isSelected);
    if (selectedItems.length === 0) {
      toast.error("Please select at least one news item");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newsItems: selectedItems,
          previousNewsletters: newsletters.slice(0, 3), // Include last 3 for context
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate newsletter");
      }

      const data = await response.json();
      setGeneratedNewsletter(data.content);
      toast.success("Newsletter generated successfully!");
    } catch (error) {
      console.error("Failed to generate newsletter:", error);
      toast.error("Failed to generate newsletter");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveFinalNewsletter = async () => {
    if (!generatedNewsletter.trim()) {
      toast.error("No newsletter content to save");
      return;
    }

    try {
      const selectedItems = newsItems.filter((item) => item.isSelected);
      const response = await fetch("/api/newsletters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: generatedNewsletter,
          newsIds: selectedItems.map((item) => item.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save newsletter");
      }

      toast.success("Newsletter saved successfully!");
      setGeneratedNewsletter("");
      loadNewsletters();
    } catch (error) {
      console.error("Failed to save newsletter:", error);
      toast.error("Failed to save newsletter");
    }
  };

  // Utility Functions
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const deleteNewsletter = async (id: string) => {
    try {
      const response = await fetch(`/api/newsletters/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete newsletter");
      }
      setNewsletters(newsletters.filter((newsletter) => newsletter.id !== id));
      toast.success("Newsletter deleted successfully");
    } catch (error) {
      console.error("Failed to delete newsletter:", error);
      toast.error("Failed to delete newsletter");
    }
  };

  const updateNewsItemsOrder = (reorderedItems: NewsItem[]) => {
    setNewsItems(reorderedItems);
  };

  const toggleNewsItemSelection = async (
    itemId: string,
    isSelected: boolean
  ) => {
    setNewsItems((items) =>
      items.map((item) => (item.id === itemId ? { ...item, isSelected } : item))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-6">
            {/* URL Management */}
            <UrlManagement
              urls={urls}
              newUrl={newUrl}
              newUrlName={newUrlName}
              isCollapsed={isUrlSectionCollapsed}
              onNewUrlChange={setNewUrl}
              onNewUrlNameChange={setNewUrlName}
              onAddUrl={addUrl}
              onRemoveUrl={removeUrl}
              onToggleCollapsed={() =>
                setIsUrlSectionCollapsed(!isUrlSectionCollapsed)
              }
            />

            {/* Date Range and Fetch */}
            <DateRangeFetch
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onFetchNews={fetchNews}
            />

            {/* News Items List */}
            <NewsItemsList
              newsItems={newsItems}
              isGenerating={isGenerating}
              structuringItems={structuringItems}
              isCollapsed={isScrapedArticlesCollapsed}
              onNewsItemsChange={updateNewsItemsOrder}
              onRemoveNewsItem={removeNewsItem}
              onStructureNewsItem={structureNewsItem}
              onGenerateNewsletter={generateNewsletter}
              onToggleCollapsed={() =>
                setIsScrapedArticlesCollapsed(!isScrapedArticlesCollapsed)
              }
            />

            {/* Newsletter Editor */}
            <NewsletterEditor
              generatedNewsletter={generatedNewsletter}
              isGenerating={isGenerating}
              onContentChange={setGeneratedNewsletter}
              onSave={saveFinalNewsletter}
              onCopyToClipboard={copyToClipboard}
            />

            {/* Previous Newsletters */}
            <PreviousNewsletters
              newsletters={newsletters}
              onCopyToClipboard={copyToClipboard}
              onDeleteNewsletter={deleteNewsletter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
