import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Report, ReportPage, ImageItem, PageTable } from '@/types/report';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyTable(): PageTable {
  return { columns: ['Column 1', 'Column 2', 'Column 3'], rows: [['', '', '']], enabled: true };
}

function emptyPage(): ReportPage {
  return { id: uid(), title: '', images: [], table: null };
}

interface ReportStore {
  reports: Report[];
  createReport: (name: string, companyName: string) => string;
  deleteReport: (id: string) => void;
  updateReportName: (id: string, name: string) => void;
  updateCompanyName: (id: string, name: string) => void;

  // Page operations
  addPage: (reportId: string) => void;
  removePage: (reportId: string, pageId: string) => void;
  updatePageTitle: (reportId: string, pageId: string, title: string) => void;

  // Image operations
  addImageToPage: (reportId: string, pageId: string, image: ImageItem) => void;
  removeImageFromPage: (reportId: string, pageId: string, imageId: string) => void;
  updateImageCaption: (reportId: string, pageId: string, imageId: string, caption: string) => void;

  // Table operations
  addTableToPage: (reportId: string, pageId: string) => void;
  removeTableFromPage: (reportId: string, pageId: string) => void;
  addTableRow: (reportId: string, pageId: string) => void;
  removeTableRow: (reportId: string, pageId: string, rowIndex: number) => void;
  addTableColumn: (reportId: string, pageId: string) => void;
  removeTableColumn: (reportId: string, pageId: string, colIndex: number) => void;
  updateTableCell: (reportId: string, pageId: string, rowIndex: number, colIndex: number, value: string) => void;
  updateTableColumn: (reportId: string, pageId: string, colIndex: number, value: string) => void;
}

function updateReport(reports: Report[], reportId: string, updater: (r: Report) => Report): Report[] {
  return reports.map(r => r.id === reportId ? updater({ ...r, updatedAt: new Date().toISOString() }) : r);
}

function updatePage(pages: ReportPage[], pageId: string, updater: (p: ReportPage) => ReportPage): ReportPage[] {
  return pages.map(p => p.id === pageId ? updater(p) : p);
}

export const useReportStore = create<ReportStore>()(
  persist(
    (set) => ({
      reports: [],

      createReport: (name, companyName) => {
        const id = uid();
        const report: Report = {
          id, name, companyName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pages: [emptyPage()],
        };
        set(s => ({ reports: [...s.reports, report] }));
        return id;
      },

      deleteReport: (id) => set(s => ({ reports: s.reports.filter(r => r.id !== id) })),

      updateReportName: (id, name) => set(s => ({
        reports: updateReport(s.reports, id, r => ({ ...r, name })),
      })),

      updateCompanyName: (id, companyName) => set(s => ({
        reports: updateReport(s.reports, id, r => ({ ...r, companyName })),
      })),

      addPage: (reportId) => set(s => ({
        reports: updateReport(s.reports, reportId, r => ({ ...r, pages: [...r.pages, emptyPage()] })),
      })),

      removePage: (reportId, pageId) => set(s => ({
        reports: updateReport(s.reports, reportId, r => ({
          ...r, pages: r.pages.filter(p => p.id !== pageId),
        })),
      })),

      updatePageTitle: (reportId, pageId, title) => set(s => ({
        reports: updateReport(s.reports, reportId, r => ({
          ...r, pages: updatePage(r.pages, pageId, p => ({ ...p, title })),
        })),
      })),

      addImageToPage: (reportId, pageId, image) => set(s => ({
        reports: updateReport(s.reports, reportId, r => ({
          ...r, pages: updatePage(r.pages, pageId, p => ({ ...p, images: [...p.images, image] })),
        })),
      })),

      removeImageFromPage: (reportId, pageId, imageId) => set(s => ({
        reports: updateReport(s.reports, reportId, r => ({
          ...r, pages: updatePage(r.pages, pageId, p => ({ ...p, images: p.images.filter(i => i.id !== imageId) })),
        })),
      })),

      updateImageCaption: (reportId, pageId, imageId, caption) => set(s => ({
        reports: updateReport(s.reports, reportId, r => ({
          ...r, pages: updatePage(r.pages, pageId, p => ({
            ...p, images: p.images.map(i => i.id === imageId ? { ...i, caption } : i),
          })),
        })),
      })),

      addTableToPage: (reportId, pageId) => set(s => ({
        reports: updateReport(s.reports, reportId, r => ({
          ...r, pages: updatePage(r.pages, pageId, p => ({ ...p, table: emptyTable() })),
        })),
      })),

      removeTableFromPage: (reportId, pageId) => set(s => ({
        reports: updateReport(s.reports, reportId, r => ({
          ...r, pages: updatePage(r.pages, pageId, p => ({ ...p, table: null })),
        })),
      })),

      addTableRow: (reportId, pageId) => set(s => ({
        reports: updateReport(s.reports, reportId, r => ({
          ...r, pages: updatePage(r.pages, pageId, p => {
            if (!p.table) return p;
            return { ...p, table: { ...p.table, rows: [...p.table.rows, new Array(p.table.columns.length).fill('')] } };
          }),
        })),
      })),

      removeTableRow: (reportId, pageId, rowIndex) => set(s => ({
        reports: updateReport(s.reports, reportId, r => ({
          ...r, pages: updatePage(r.pages, pageId, p => {
            if (!p.table) return p;
            return { ...p, table: { ...p.table, rows: p.table.rows.filter((_, i) => i !== rowIndex) } };
          }),
        })),
      })),

      addTableColumn: (reportId, pageId) => set(s => ({
        reports: updateReport(s.reports, reportId, r => ({
          ...r, pages: updatePage(r.pages, pageId, p => {
            if (!p.table) return p;
            return {
              ...p, table: {
                ...p.table,
                columns: [...p.table.columns, `Column ${p.table.columns.length + 1}`],
                rows: p.table.rows.map(row => [...row, '']),
              },
            };
          }),
        })),
      })),

      removeTableColumn: (reportId, pageId, colIndex) => set(s => ({
        reports: updateReport(s.reports, reportId, r => ({
          ...r, pages: updatePage(r.pages, pageId, p => {
            if (!p.table || p.table.columns.length <= 1) return p;
            return {
              ...p, table: {
                ...p.table,
                columns: p.table.columns.filter((_, i) => i !== colIndex),
                rows: p.table.rows.map(row => row.filter((_, i) => i !== colIndex)),
              },
            };
          }),
        })),
      })),

      updateTableCell: (reportId, pageId, rowIndex, colIndex, value) => set(s => ({
        reports: updateReport(s.reports, reportId, r => ({
          ...r, pages: updatePage(r.pages, pageId, p => {
            if (!p.table) return p;
            return {
              ...p, table: {
                ...p.table,
                rows: p.table.rows.map((row, ri) => ri === rowIndex ? row.map((cell, ci) => ci === colIndex ? value : cell) : row),
              },
            };
          }),
        })),
      })),

      updateTableColumn: (reportId, pageId, colIndex, value) => set(s => ({
        reports: updateReport(s.reports, reportId, r => ({
          ...r, pages: updatePage(r.pages, pageId, p => {
            if (!p.table) return p;
            return {
              ...p, table: {
                ...p.table,
                columns: p.table.columns.map((col, i) => i === colIndex ? value : col),
              },
            };
          }),
        })),
      })),
    }),
    { name: 'report-store' }
  )
);
