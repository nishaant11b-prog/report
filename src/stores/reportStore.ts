import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
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
  loading: boolean;
  fetchReports: (userId: string) => Promise<void>;
  createReport: (name: string, companyName: string, userId: string) => Promise<string | null>;
  deleteReport: (id: string) => Promise<void>;
  updateReportName: (id: string, name: string) => Promise<void>;
  updateCompanyName: (id: string, name: string) => Promise<void>;

  // Page operations
  addPage: (reportId: string) => Promise<void>;
  removePage: (reportId: string, pageId: string) => Promise<void>;
  updatePageTitle: (reportId: string, pageId: string, title: string) => Promise<void>;

  // Image operations
  addImageToPage: (reportId: string, pageId: string, image: ImageItem) => Promise<void>;
  removeImageFromPage: (reportId: string, pageId: string, imageId: string) => Promise<void>;
  updateImageCaption: (reportId: string, pageId: string, imageId: string, caption: string) => Promise<void>;

  // Table operations
  addTableToPage: (reportId: string, pageId: string) => Promise<void>;
  removeTableFromPage: (reportId: string, pageId: string) => Promise<void>;
  addTableRow: (reportId: string, pageId: string) => Promise<void>;
  removeTableRow: (reportId: string, pageId: string, rowIndex: number) => Promise<void>;
  addTableColumn: (reportId: string, pageId: string) => Promise<void>;
  removeTableColumn: (reportId: string, pageId: string, colIndex: number) => Promise<void>;
  updateTableCell: (reportId: string, pageId: string, rowIndex: number, colIndex: number, value: string) => Promise<void>;
  updateTableColumn: (reportId: string, pageId: string, colIndex: number, value: string) => Promise<void>;
}

async function syncToSupabase(report: Report) {
  const { error } = await supabase
    .from('reports')
    .upsert({
      id: report.id,
      user_id: report.userId,
      name: report.name,
      company_name: report.companyName,
      data: { pages: report.pages },
      updated_at: new Date().toISOString()
    });
  if (error) console.error('Sync failed:', error);
}

export const useReportStore = create<ReportStore>((set, get) => ({
  reports: [],
  loading: false,

  fetchReports: async (userId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Fetch failed:', error);
      set({ loading: false });
      return;
    }

    const reports: Report[] = data.map(r => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      companyName: r.company_name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      pages: r.data.pages
    }));

    set({ reports, loading: false });
  },

  createReport: async (name, companyName, userId) => {
    const report: Report = {
      id: crypto.randomUUID(),
      name, companyName, userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pages: [emptyPage()],
    };
    
    const { error } = await supabase.from('reports').insert({
      id: report.id,
      user_id: userId,
      name: report.name,
      company_name: report.companyName,
      data: { pages: report.pages }
    });

    if (error) {
      console.error('Create failed:', error);
      return null;
    }

    set(s => ({ reports: [...s.reports, report] }));
    return report.id;
  },

  deleteReport: async (id) => {
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (error) {
      console.error('Delete failed:', error);
      return;
    }
    set(s => ({ reports: s.reports.filter(r => r.id !== id) }));
  },

  updateReportName: async (id, name) => {
    set(s => ({
      reports: s.reports.map(r => r.id === id ? { ...r, name, updatedAt: new Date().toISOString() } : r)
    }));
    const report = get().reports.find(r => r.id === id);
    if (report) await syncToSupabase(report);
  },

  updateCompanyName: async (id, companyName) => {
    set(s => ({
      reports: s.reports.map(r => r.id === id ? { ...r, companyName, updatedAt: new Date().toISOString() } : r)
    }));
    const report = get().reports.find(r => r.id === id);
    if (report) await syncToSupabase(report);
  },

  addPage: async (reportId) => {
    set(s => ({
      reports: s.reports.map(r => r.id === reportId ? { 
        ...r, 
        pages: [...r.pages, emptyPage()],
        updatedAt: new Date().toISOString()
      } : r)
    }));
    const report = get().reports.find(r => r.id === reportId);
    if (report) await syncToSupabase(report);
  },

  removePage: async (reportId, pageId) => {
    set(s => ({
      reports: s.reports.map(r => r.id === reportId ? { 
        ...r, 
        pages: r.pages.filter(p => p.id !== pageId),
        updatedAt: new Date().toISOString()
      } : r)
    }));
    const report = get().reports.find(r => r.id === reportId);
    if (report) await syncToSupabase(report);
  },

  updatePageTitle: async (reportId, pageId, title) => {
    set(s => ({
      reports: s.reports.map(r => r.id === reportId ? { 
        ...r, 
        pages: r.pages.map(p => p.id === pageId ? { ...p, title } : p),
        updatedAt: new Date().toISOString()
      } : r)
    }));
    const report = get().reports.find(r => r.id === reportId);
    if (report) await syncToSupabase(report);
  },

  addImageToPage: async (reportId, pageId, image) => {
    set(s => ({
      reports: s.reports.map(r => r.id === reportId ? { 
        ...r, 
        pages: r.pages.map(p => p.id === pageId ? { ...p, images: [...p.images, image] } : p),
        updatedAt: new Date().toISOString()
      } : r)
    }));
    const report = get().reports.find(r => r.id === reportId);
    if (report) await syncToSupabase(report);
  },

  removeImageFromPage: async (reportId, pageId, imageId) => {
    set(s => ({
      reports: s.reports.map(r => r.id === reportId ? { 
        ...r, 
        pages: r.pages.map(p => p.id === pageId ? { ...p, images: p.images.filter(i => i.id !== imageId) } : p),
        updatedAt: new Date().toISOString()
      } : r)
    }));
    const report = get().reports.find(r => r.id === reportId);
    if (report) await syncToSupabase(report);
  },

  updateImageCaption: async (reportId, pageId, imageId, caption) => {
    set(s => ({
      reports: s.reports.map(r => r.id === reportId ? { 
        ...r, 
        pages: r.pages.map(p => p.id === pageId ? { 
          ...p, 
          images: p.images.map(i => i.id === imageId ? { ...i, caption } : i) 
        } : p),
        updatedAt: new Date().toISOString()
      } : r)
    }));
    const report = get().reports.find(r => r.id === reportId);
    if (report) await syncToSupabase(report);
  },

  addTableToPage: async (reportId, pageId) => {
    set(s => ({
      reports: s.reports.map(r => r.id === reportId ? { 
        ...r, 
        pages: r.pages.map(p => p.id === pageId ? { ...p, table: emptyTable() } : p),
        updatedAt: new Date().toISOString()
      } : r)
    }));
    const report = get().reports.find(r => r.id === reportId);
    if (report) await syncToSupabase(report);
  },

  removeTableFromPage: async (reportId, pageId) => {
    set(s => ({
      reports: s.reports.map(r => r.id === reportId ? { 
        ...r, 
        pages: r.pages.map(p => p.id === pageId ? { ...p, table: null } : p),
        updatedAt: new Date().toISOString()
      } : r)
    }));
    const report = get().reports.find(r => r.id === reportId);
    if (report) await syncToSupabase(report);
  },

  addTableRow: async (reportId, pageId) => {
    set(s => ({
      reports: s.reports.map(r => r.id === reportId ? { 
        ...r, 
        pages: r.pages.map(p => {
          if (p.id !== pageId || !p.table) return p;
          return { ...p, table: { ...p.table, rows: [...p.table.rows, new Array(p.table.columns.length).fill('')] } };
        }),
        updatedAt: new Date().toISOString()
      } : r)
    }));
    const report = get().reports.find(r => r.id === reportId);
    if (report) await syncToSupabase(report);
  },

  removeTableRow: async (reportId, pageId, rowIndex) => {
    set(s => ({
      reports: s.reports.map(r => r.id === reportId ? { 
        ...r, 
        pages: r.pages.map(p => {
          if (p.id !== pageId || !p.table) return p;
          return { ...p, table: { ...p.table, rows: p.table.rows.filter((_, i) => i !== rowIndex) } };
        }),
        updatedAt: new Date().toISOString()
      } : r)
    }));
    const report = get().reports.find(r => r.id === reportId);
    if (report) await syncToSupabase(report);
  },

  addTableColumn: async (reportId, pageId) => {
    set(s => ({
      reports: s.reports.map(r => r.id === reportId ? { 
        ...r, 
        pages: r.pages.map(p => {
          if (p.id !== pageId || !p.table) return p;
          return {
            ...p, table: {
              ...p.table,
              columns: [...p.table.columns, `Column ${p.table.columns.length + 1}`],
              rows: p.table.rows.map(row => [...row, '']),
            },
          };
        }),
        updatedAt: new Date().toISOString()
      } : r)
    }));
    const report = get().reports.find(r => r.id === reportId);
    if (report) await syncToSupabase(report);
  },

  removeTableColumn: async (reportId, pageId, colIndex) => {
    set(s => ({
      reports: s.reports.map(r => r.id === reportId ? { 
        ...r, 
        pages: r.pages.map(p => {
          if (p.id !== pageId || !p.table || p.table.columns.length <= 1) return p;
          return {
            ...p, table: {
              ...p.table,
              columns: p.table.columns.filter((_, i) => i !== colIndex),
              rows: p.table.rows.map(row => row.filter((_, i) => i !== colIndex)),
            },
          };
        }),
        updatedAt: new Date().toISOString()
      } : r)
    }));
    const report = get().reports.find(r => r.id === reportId);
    if (report) await syncToSupabase(report);
  },

  updateTableCell: async (reportId, pageId, rowIndex, colIndex, value) => {
    set(s => ({
      reports: s.reports.map(r => r.id === reportId ? { 
        ...r, 
        pages: r.pages.map(p => {
          if (p.id !== pageId || !p.table) return p;
          return {
            ...p, table: {
              ...p.table,
              rows: p.table.rows.map((row, ri) => ri === rowIndex ? row.map((cell, ci) => ci === colIndex ? value : cell) : row),
            },
          };
        }),
        updatedAt: new Date().toISOString()
      } : r)
    }));
    const report = get().reports.find(r => r.id === reportId);
    if (report) await syncToSupabase(report);
  },

  updateTableColumn: async (reportId, pageId, colIndex, value) => {
    set(s => ({
      reports: s.reports.map(r => r.id === reportId ? { 
        ...r, 
        pages: r.pages.map(p => {
          if (p.id !== pageId || !p.table) return p;
          return {
            ...p, table: {
              ...p.table,
              columns: p.table.columns.map((col, i) => i === colIndex ? value : col),
            },
          };
        }),
        updatedAt: new Date().toISOString()
      } : r)
    }));
    const report = get().reports.find(r => r.id === reportId);
    if (report) await syncToSupabase(report);
  },
}));

