import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingProgressProps {
  isLoading: boolean;
  loadingProgress: number;
  loadingMessage: string;
}

export function LoadingProgress({
  isLoading,
  loadingProgress,
  loadingMessage,
}: LoadingProgressProps) {
  if (!isLoading) return null;

  return (
    <Card className="bg-white border shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          News Crawl in Progress
        </CardTitle>
        <CardDescription>
          This process may take up to 10 minutes. We're crawling your news
          sources and using AI to extract and structure the articles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{loadingMessage}</span>
            <span>{Math.round(loadingProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Loading Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gray-50 border">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
