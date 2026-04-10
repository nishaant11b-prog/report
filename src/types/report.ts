export interface ImageItem {
  id: string;
  url: string;
  caption: string;
}

export interface PageTable {
  columns: string[];
  rows: string[][];
  enabled: boolean;
}

export interface ReportPage {
  id: string;
  title: string;
  images: ImageItem[];
  table: PageTable | null;
}

export interface Report {
  id: string;
  userId: string;
  name: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
  pages: ReportPage[];
}

