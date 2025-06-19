export interface Url {
  id: string;
  url: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  fullContent?: string;
  url: string;
  sourceUrl: string;
  publishedAt?: Date | null;
  scrapedAt: Date;
  isSelected: boolean;
  structured: boolean;
  extractedDate?: string | null;
  breadcrumb?: string;
  category?: string;
}

export interface Newsletter {
  id: string;
  title?: string;
  content: string;
  generatedAt: string;
  savedAt?: string;
}
