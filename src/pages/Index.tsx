import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useReportStore } from '@/stores/reportStore';

export default function Index() {
  const navigate = useNavigate();
  const { reports, createReport, deleteReport } = useReportStore();
  const [showDialog, setShowDialog] = useState(false);
  const [reportName, setReportName] = useState('');
  const [companyName, setCompanyName] = useState('');

  const handleCreate = () => {
    const name = reportName.trim() || 'Untitled Report';
    const company = companyName.trim() || '';
    const id = createReport(name, company);
    setShowDialog(false);
    setReportName('');
    setCompanyName('');
    navigate(`/report/${id}`);
  };

  const sorted = [...reports].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <FileText className="h-4 w-4" />
            Report Generator
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground">
            Image Catalogue Reports
          </h1>
          <p className="text-lg text-muted-foreground">
            Create structured reports with images and tables — export as professional landscape PDFs.
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <Button size="lg" onClick={() => setShowDialog(true)} className="gap-2 px-8">
            <Plus className="h-5 w-5" /> Create Report
          </Button>
        </div>

        {sorted.length > 0 && (
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Reports</h2>
            <div className="space-y-2">
              {sorted.map(report => (
                <div
                  key={report.id}
                  className="group flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                  onClick={() => navigate(`/report/${report.id}`)}
                >
                  <div>
                    <h3 className="font-medium text-foreground">{report.name}</h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      {report.companyName && <span>{report.companyName}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(report.updatedAt).toLocaleDateString()}
                      </span>
                      <span>{(report.pages || []).length} page{(report.pages || []).length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    onClick={e => { e.stopPropagation(); deleteReport(report.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="e.g. DAKSHIN EXPORTS"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="report">Report Title</Label>
              <Input
                id="report"
                placeholder="e.g. INSPECTION REPORT - ABSTRACT"
                value={reportName}
                onChange={e => setReportName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
