import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Plus, ImageIcon, TableIcon, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReportStore } from '@/stores/reportStore';
import { useAuthStore } from '@/stores/authStore';
import { ReportPreview } from '@/components/report/ReportPreview';
import { LogOut } from 'lucide-react';
import { useCallback } from 'react';
import type { ImageItem } from '@/types/report';

export default function ReportBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useReportStore();
  const { user, logout } = useAuthStore();
  const { reports, fetchReports, loading } = useReportStore();
  const report = reports.find(r => r.id === id);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && reports.length === 0) {
      fetchReports(user.id);
    }
  }, [user, reports.length, fetchReports]);

  const exportPdf = useCallback(async () => {
    if (!report || isExporting) return;
    
    try {
      setIsExporting(true);
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Select the hidden export element instead of the sidebar preview
      const el = document.getElementById('report-export-container');
      if (!el) {
        console.error('Export element not found');
        return;
      }

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const scale = isMobile ? 1.5 : 2; // Scale 3 was causing memory issues on mobile

      const opt = {
        margin: 0,
        filename: `${report.name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: scale, 
          useCORS: true, 
          letterRendering: true, 
          scrollY: 0,
          logging: false,
          imageTimeout: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      await html2pdf().set(opt).from(el).save();
    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('Failed to generate PDF. Please try again with fewer images or on a desktop.');
    } finally {
      setIsExporting(false);
    }
  }, [report, isExporting]);

  if (loading && !report) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">Report not found</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }


  const activePage = report.pages[activePageIndex] || report.pages[0];
  if (!activePage) return null;

  const handleAddImage = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const img: ImageItem = {
          id: Math.random().toString(36).slice(2, 10),
          url: reader.result as string,
          caption: '',
        };
        store.addImageToPage(report.id, activePage.id, img);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddNextPage = () => {
    store.addPage(report.id);
    setActivePageIndex(report.pages.length); // new page will be at this index
  };

  const handleDeletePage = () => {
    if (report.pages.length <= 1) return;
    store.removePage(report.id, activePage.id);
    setActivePageIndex(Math.max(0, activePageIndex - 1));
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Input
          value={report.name}
          onChange={e => store.updateReportName(report.id, e.target.value)}
          className="max-w-xs border-0 bg-transparent text-base font-semibold focus-visible:ring-0"
        />
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-medium text-muted-foreground sm:block">
            {user?.email}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
          <div className="mx-2 h-4 w-[1px] bg-border" />
          <Button size="sm" onClick={exportPdf} disabled={isExporting} className="gap-2">
            <Download className="h-4 w-4" /> 
            {isExporting ? 'Generating...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Page editor */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Page navigation */}
          <div className="mx-auto mb-4 flex max-w-2xl items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="icon" className="h-8 w-8"
                disabled={activePageIndex === 0}
                onClick={() => setActivePageIndex(activePageIndex - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                Page {activePageIndex + 1} of {report.pages.length}
              </span>
              <Button
                variant="outline" size="icon" className="h-8 w-8"
                disabled={activePageIndex >= report.pages.length - 1}
                onClick={() => setActivePageIndex(activePageIndex + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {report.pages.length > 1 && (
                <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={handleDeletePage}>
                  <Trash2 className="h-3 w-3" /> Delete Page
                </Button>
              )}
            </div>
          </div>

          <div className="mx-auto max-w-2xl space-y-4">
            {/* Page Title */}
            <div className="rounded-lg border border-border bg-card p-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Page Title</label>
              <Input
                placeholder="Enter page title..."
                value={activePage.title}
                onChange={e => store.updatePageTitle(report.id, activePage.id, e.target.value)}
                className="text-lg font-semibold"
              />
            </div>

            {/* Images */}
            <div className="rounded-lg border border-border bg-card p-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Images</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {activePage.images.map(img => (
                  <div key={img.id} className="group/img relative overflow-hidden rounded-md border border-border">
                    <img src={img.url} alt={img.caption || 'Report image'} className="aspect-square w-full object-cover" />
                    <button
                      onClick={() => store.removeImageFromPage(report.id, activePage.id, img.id)}
                      className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover/img:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <Input
                      placeholder="Caption..."
                      value={img.caption}
                      onChange={e => store.updateImageCaption(report.id, activePage.id, img.id, e.target.value)}
                      className="rounded-none border-x-0 border-b-0 text-xs"
                    />
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-6 w-6 mb-1" />
                    <span className="text-xs">Add Image</span>
                  </div>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => handleAddImage(e.target.files)}
              />
            </div>

            {/* Table (optional) */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Table (Optional)</label>
                {!activePage.table ? (
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => store.addTableToPage(report.id, activePage.id)}>
                    <TableIcon className="h-3 w-3" /> Add Table
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => store.removeTableFromPage(report.id, activePage.id)}>
                    <Trash2 className="h-3 w-3" /> Remove Table
                  </Button>
                )}
              </div>

              {activePage.table && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        {activePage.table.columns.map((col, ci) => (
                          <th key={ci} className="border border-border bg-muted px-2 py-1">
                            <div className="flex items-center gap-1">
                              <Input
                                value={col}
                                onChange={e => store.updateTableColumn(report.id, activePage.id, ci, e.target.value)}
                                className="h-7 border-0 bg-transparent p-0 text-xs font-semibold focus-visible:ring-0"
                              />
                              {activePage.table!.columns.length > 1 && (
                                <button onClick={() => store.removeTableColumn(report.id, activePage.id, ci)} className="text-muted-foreground hover:text-destructive">
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="w-8 border border-border bg-muted" />
                      </tr>
                    </thead>
                    <tbody>
                      {activePage.table.rows.map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="border border-border px-1 py-0.5">
                              <Input
                                value={cell}
                                onChange={e => store.updateTableCell(report.id, activePage.id, ri, ci, e.target.value)}
                                className="h-7 border-0 bg-transparent p-0 text-xs focus-visible:ring-0"
                              />
                            </td>
                          ))}
                          <td className="border border-border px-1 text-center">
                            <button onClick={() => store.removeTableRow(report.id, activePage.id, ri)} className="text-muted-foreground hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => store.addTableRow(report.id, activePage.id)}>+ Row</Button>
                    <Button variant="outline" size="sm" onClick={() => store.addTableColumn(report.id, activePage.id)}>+ Column</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Add Next Page */}
            <div className="flex justify-center pt-4">
              <Button onClick={handleAddNextPage} className="gap-2 px-8" size="lg">
                <Plus className="h-5 w-5" /> Add Next Page
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="hidden w-[480px] shrink-0 overflow-y-auto border-l border-border bg-muted/30 p-0 xl:block">
          <div className="p-4 border-b border-border bg-white">
             <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Preview</p>
          </div>
          <div className="bg-[#f3f4f6] min-h-full p-10 flex flex-col gap-10">
            <div className="origin-top-left scale-[0.38]" style={{ width: '297mm' }}>
              <div className="shadow-2xl">
                <ReportPreview report={report} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden container for PDF export - always rendered and accessible for html2pdf */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -100, pointerEvents: 'none' }}>
        <ReportPreview report={report} id="report-export-container" />
      </div>
    </div>
  );
}
