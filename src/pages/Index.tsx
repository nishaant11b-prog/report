import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useReportStore } from '@/stores/reportStore';
import { useAuthStore } from '@/stores/authStore';
import { LogOut } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { reports, fetchReports, createReport, deleteReport, loading } = useReportStore();
  const { user, logout } = useAuthStore();
  const [showDialog, setShowDialog] = useState(false);
  const [reportName, setReportName] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (user) {
      fetchReports(user.id);
    }
  }, [user, fetchReports]);

  const handleCreate = async () => {
    if (!user) return;
    const name = reportName.trim() || 'Untitled Report';
    const company = companyName.trim() || '';
    const id = await createReport(name, company, user.id);
    if (id) {
      setShowDialog(false);
      setReportName('');
      setCompanyName('');
      navigate(`/report/${id}`);
    }
  };

  const userReports = reports.filter(r => r.userId === user?.id);
  const sorted = [...userReports].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="relative mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {user?.email}
              </h1>
              <p className="text-sm text-muted-foreground">
                Your personal Report Dashboard
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="gap-2 border-border/50 bg-background/50 hover:bg-destructive/5 hover:text-destructive">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>

        <div className="mb-12 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent p-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
             New Features
          </div>
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
            Image Catalogue Reports
          </h2>
          <p className="mx-auto max-w-md text-muted-foreground">
            Create structured reports with images and tables — export as professional landscape PDFs for your business needs.
          </p>
        </div>


        <div className="mb-8 flex justify-center">
          <Button size="lg" onClick={() => setShowDialog(true)} className="gap-2 px-8">
            <Plus className="h-5 w-5" /> Create Report
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : sorted.length > 0 ? (
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
        ) : null}

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
