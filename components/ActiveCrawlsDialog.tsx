import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { RefreshCw, Square, Trash2 } from "lucide-react";
import { useState } from "react";

import type { BatchScrape } from "./types";

interface ActiveCrawlsDialogProps {
  isOpen: boolean;
  activeCrawls: BatchScrape[];
  isLoadingActiveCrawls: boolean;
  hasPendingCrawls: boolean;
  onOpenChange: (open: boolean) => void;
  onFetchCrawlContent: (crawlId: string) => void;
  onDeleteCrawl: (crawlId: string) => void;
  onCancelCrawl: (crawlId: string) => void;
  onRefreshCrawls: () => void;
}

export function ActiveCrawlsDialog({
  isOpen,
  activeCrawls,
  isLoadingActiveCrawls,
  hasPendingCrawls,
  onOpenChange,
  onDeleteCrawl,
  onCancelCrawl,
  onRefreshCrawls,
}: ActiveCrawlsDialogProps) {
  const [deletingCrawls, setDeletingCrawls] = useState<Set<string>>(new Set());
  const [cancellingCrawls, setCancellingCrawls] = useState<Set<string>>(
    new Set()
  );

  const handleDeleteCrawl = async (crawlId: string) => {
    setDeletingCrawls((prev) => new Set([...prev, crawlId]));
    try {
      await onDeleteCrawl(crawlId);
    } finally {
      setDeletingCrawls((prev) => {
        const newSet = new Set(prev);
        newSet.delete(crawlId);
        return newSet;
      });
    }
  };

  const handleCancelCrawl = async (crawlId: string) => {
    setCancellingCrawls((prev) => new Set([...prev, crawlId]));
    try {
      await onCancelCrawl(crawlId);
    } finally {
      setCancellingCrawls((prev) => {
        const newSet = new Set(prev);
        newSet.delete(crawlId);
        return newSet;
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              Batch Scrape Management
              {hasPendingCrawls && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                  {
                    activeCrawls.filter(
                      (c) => c.status === "PENDING" || c.status === "SCRAPING"
                    ).length
                  }{" "}
                  Active
                </span>
              )}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshCrawls}
              disabled={isLoadingActiveCrawls}
              className="cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${
                  isLoadingActiveCrawls ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          {isLoadingActiveCrawls ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading batch scrapes...</span>
            </div>
          ) : activeCrawls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No batch scrapes found. Start a batch scrape to see it here.
            </div>
          ) : (
            <div className="space-y-3">
              {activeCrawls.map((batchScrape) => {
                const isDeleting = deletingCrawls.has(batchScrape.id);
                const isCancelling = cancellingCrawls.has(batchScrape.id);
                const isInProgress =
                  batchScrape.status === "PENDING" ||
                  batchScrape.status === "SCRAPING";

                return (
                  <Card
                    key={batchScrape.id}
                    className={`border-2 ${
                      batchScrape.status === "COMPLETED"
                        ? "bg-green-50 border-green-300"
                        : batchScrape.status === "FAILED"
                        ? "bg-red-50 border-red-300"
                        : batchScrape.status === "SCRAPING"
                        ? "bg-blue-50 border-blue-300"
                        : batchScrape.status === "CANCELLED"
                        ? "bg-gray-50 border-gray-300"
                        : "bg-gray-50 border-gray-300"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                Batch Scrape #{batchScrape.id.slice(-8)}
                              </p>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  batchScrape.status === "COMPLETED"
                                    ? "bg-green-100 text-green-800"
                                    : batchScrape.status === "FAILED"
                                    ? "bg-red-100 text-red-800"
                                    : batchScrape.status === "SCRAPING"
                                    ? "bg-blue-100 text-blue-800"
                                    : batchScrape.status === "CANCELLED"
                                    ? "bg-gray-100 text-gray-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {batchScrape.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              URLs:{" "}
                              {batchScrape.urls
                                .map((url: string) => {
                                  try {
                                    return new URL(url).hostname;
                                  } catch (error) {
                                    console.warn(
                                      "Invalid URL in batch scrape:",
                                      url
                                    );
                                    return url.length > 20
                                      ? url.substring(0, 20) + "..."
                                      : url;
                                  }
                                })
                                .join(", ")}
                            </p>
                            <p className="text-xs text-gray-500">
                              Started:{" "}
                              {format(
                                new Date(batchScrape.startedAt),
                                "MMM d, h:mm a"
                              )}
                            </p>
                            {batchScrape.completedAt && (
                              <p className="text-xs text-gray-500">
                                Completed:{" "}
                                {format(
                                  new Date(batchScrape.completedAt),
                                  "MMM d, h:mm a"
                                )}
                              </p>
                            )}
                            {batchScrape.totalPages && (
                              <p className="text-xs text-gray-500">
                                Pages: {batchScrape.pagesScraped || 0}/
                                {batchScrape.totalPages}
                              </p>
                            )}
                            {batchScrape.errorMessage && (
                              <p className="text-xs text-red-600 mt-1">
                                Error: {batchScrape.errorMessage}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {isInProgress && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleCancelCrawl(batchScrape.id)
                                }
                                disabled={isCancelling}
                                className="cursor-pointer"
                              >
                                <Square
                                  className={`w-4 h-4 mr-1 ${
                                    isCancelling ? "animate-spin" : ""
                                  }`}
                                />
                                {isCancelling ? "Cancelling..." : "Cancel"}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCrawl(batchScrape.id)}
                              disabled={isDeleting}
                              className="cursor-pointer text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              <Trash2
                                className={`w-4 h-4 mr-1 ${
                                  isDeleting ? "animate-spin" : ""
                                }`}
                              />
                              {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        </div>

                        {batchScrape.status === "COMPLETED" && (
                          <div className="bg-green-100 text-green-800 p-2 rounded text-xs">
                            ✅ Batch scrape completed successfully!
                            {batchScrape.pagesScraped && (
                              <span>
                                {" "}
                                Processed {batchScrape.pagesScraped} articles.
                              </span>
                            )}
                            <br />
                            📰 Check the "Scraped Articles" section below for
                            the results.
                          </div>
                        )}

                        {batchScrape.status === "SCRAPING" && (
                          <div className="bg-blue-100 text-blue-800 p-2 rounded text-xs">
                            🔄 Processing content with AI... This may take a few
                            minutes.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
