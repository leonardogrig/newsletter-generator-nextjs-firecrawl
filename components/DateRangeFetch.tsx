import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SimpleDateInput } from "@/components/ui/simple-date-input";
import { CalendarDays } from "lucide-react";

interface DateRangeFetchProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onFetchNews: () => void;
}

export function DateRangeFetch({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onFetchNews,
}: DateRangeFetchProps) {
  return (
    <Card className="bg-white border shadow-lg">
      <CardContent className="pt-6 flex flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm font-medium">Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <SimpleDateInput
              date={startDate}
              setDate={onStartDateChange}
              placeholder="Start date"
              className="w-[160px]"
            />
            <span className="text-sm text-gray-500">to</span>
            <SimpleDateInput
              date={endDate}
              setDate={onEndDateChange}
              placeholder="End date"
              className="w-[160px]"
            />
          </div>
        </div>
        <Button
          onClick={onFetchNews}
          size="lg"
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          🚀 Batch Scrape + AI
        </Button>
      </CardContent>
    </Card>
  );
}
