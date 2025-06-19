import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";

import type { Url } from "./types";

interface UrlManagementProps {
  urls: Url[];
  newUrl: string;
  newUrlName: string;
  brandInstructions: string;
  isCollapsed: boolean;
  onNewUrlChange: (url: string) => void;
  onNewUrlNameChange: (name: string) => void;
  onBrandInstructionsChange: (instructions: string) => void;
  onSaveBrandInstructions: () => void;
  onAddUrl: () => void;
  onRemoveUrl: (id: string) => void;
  onToggleCollapsed: () => void;
}

export function UrlManagement({
  urls,
  newUrl,
  newUrlName,
  brandInstructions,
  isCollapsed,
  onNewUrlChange,
  onNewUrlNameChange,
  onBrandInstructionsChange,
  onSaveBrandInstructions,
  onAddUrl,
  onRemoveUrl,
  onToggleCollapsed,
}: UrlManagementProps) {
  return (
    <Card className="bg-white border shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Customization</CardTitle>
            <CardDescription>
              Configure your news sources and brand context for AI scoring
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapsed}
            className="cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="space-y-6">
          {/* Brand Instructions Section */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">
              Brand Context for AI Scoring
            </h4>
            <Textarea
              placeholder="Describe your brand and audience for relevance scoring (e.g., 'My brand is about AI automation, focused on building web apps by vibecoding inside cursor')"
              value={brandInstructions}
              onChange={(e) => onBrandInstructionsChange(e.target.value)}
              className="bg-white border min-h-[80px]"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                This helps the AI score how relevant each article is to your
                brand (0-10 scale)
              </p>
              <Button
                onClick={onSaveBrandInstructions}
                size="sm"
                className="cursor-pointer"
              >
                Save Context
              </Button>
            </div>
          </div>

          {/* URL Management Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-700">News Sources</h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Enter news website URL (e.g., https://example.com)"
                value={newUrl}
                onChange={(e) => onNewUrlChange(e.target.value)}
                className="flex-1 bg-white border"
                onKeyPress={(e) => e.key === "Enter" && onAddUrl()}
              />
              <Input
                placeholder="Optional: Website name"
                value={newUrlName}
                onChange={(e) => onNewUrlNameChange(e.target.value)}
                className="sm:w-48 bg-white border"
                onKeyPress={(e) => e.key === "Enter" && onAddUrl()}
              />
              <Button onClick={onAddUrl} className="cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Add URL
              </Button>
            </div>

            {urls.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-xs text-gray-600">
                  Your News Sources ({urls.length}):
                </h5>
                <div className="space-y-2">
                  {urls.map((url) => (
                    <div
                      key={url.id}
                      className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {url.name ||
                            (() => {
                              try {
                                return new URL(url.url).hostname;
                              } catch (error) {
                                console.warn(
                                  "Invalid URL in URL management:",
                                  url.url
                                );
                                return url.url.length > 30
                                  ? url.url.substring(0, 30) + "..."
                                  : url.url;
                              }
                            })()}
                        </p>
                        <p className="text-xs text-gray-600">{url.url}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveUrl(url.id)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
