/**
 * AuditRunModal
 *
 * Batch audit runner. The user picks a scope (all / never-audited / stale),
 * then this modal orchestrates per-title audit calls with a concurrency
 * pool and live progress. UPSERTs happen inside the edge function — closing
 * the modal partway through keeps any already-completed audits.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Icon } from '@iconify/react';
import { auditService, type AuditMode, type BatchProgress } from '@/services/auditService';
import type { Title } from '@/services/titlesService';

interface AuditRunModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titles: Title[]; // in-memory title list from AdminTitles, used for name lookup
  onCompleted?: () => void;
}

const MODE_LABELS: Record<AuditMode, string> = {
  all: 'All titles (re-audit everything)',
  'never-audited': 'Never audited only',
  stale: 'Stale (audit older than 7 days)',
};

export function AuditRunModal({ open, onOpenChange, titles, onCompleted }: AuditRunModalProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<AuditMode>('never-audited');
  const [phase, setPhase] = useState<'configure' | 'running' | 'done' | 'cancelled'>('configure');
  const [progress, setProgress] = useState<BatchProgress>({ done: 0, total: 0, errors: 0 });
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const nameLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of titles) {
      map.set(t.title_id, t.title_name_en || t.title_name_kr || t.title_id.slice(0, 8));
    }
    return (id: string) => map.get(id);
  }, [titles]);

  // Reset when modal reopens
  useEffect(() => {
    if (open) {
      setPhase('configure');
      setProgress({ done: 0, total: 0, errors: 0 });
      setStartedAt(null);
      abortRef.current = null;
    } else {
      abortRef.current?.abort();
    }
  }, [open]);

  const percent =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  const eta = useMemo(() => {
    if (!startedAt || progress.done === 0 || phase !== 'running') return null;
    const elapsed = (Date.now() - startedAt) / 1000;
    const perItem = elapsed / progress.done;
    const remaining = (progress.total - progress.done) * perItem;
    if (!isFinite(remaining)) return null;
    const m = Math.floor(remaining / 60);
    const s = Math.floor(remaining % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }, [startedAt, progress, phase]);

  const handleStart = async () => {
    try {
      const ids = await auditService.getTitleIdsForMode(mode);

      if (ids.length === 0) {
        toast({
          title: 'Nothing to audit',
          description:
            mode === 'never-audited'
              ? 'All titles with URLs already have an audit row.'
              : 'No titles match this scope.',
        });
        return;
      }

      abortRef.current = new AbortController();
      setPhase('running');
      setStartedAt(Date.now());
      setProgress({ done: 0, total: ids.length, errors: 0 });

      const final = await auditService.batchAudit(
        ids,
        nameLookup,
        (p) => setProgress(p),
        abortRef.current.signal,
        5,
      );

      if (abortRef.current?.signal.aborted) {
        setPhase('cancelled');
      } else {
        setPhase('done');
        toast({
          title: 'Audit complete',
          description: `${final.done} title${final.done === 1 ? '' : 's'} audited (${final.errors} error${final.errors === 1 ? '' : 's'})`,
        });
        onCompleted?.();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Audit failed';
      toast({ title: 'Audit failed', description: message, variant: 'destructive' });
      setPhase('configure');
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setPhase('cancelled');
    onCompleted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="solar:shield-check-bold-duotone" className="h-5 w-5 text-hanok-teal" />
            Run Title Audit
          </DialogTitle>
        </DialogHeader>

        {phase === 'configure' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Scrapes each title's source URL to verify the stored name and cover image
              match what's on the platform. Updates the audit report in this page.
            </p>

            <div className="space-y-2">
              {(Object.keys(MODE_LABELS) as AuditMode[]).map((m) => (
                <label
                  key={m}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    mode === m ? 'border-hanok-teal bg-hanok-teal/5' : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="audit-mode"
                    value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                    className="mt-0.5"
                  />
                  <span className="text-sm">{MODE_LABELS[m]}</span>
                </label>
              ))}
            </div>

            <div className="text-xs text-gray-500">
              ~2–3 seconds per title at concurrency 5. You can close this modal and
              come back; any titles already audited will persist.
            </div>
          </div>
        )}

        {(phase === 'running' || phase === 'done' || phase === 'cancelled') && (
          <div className="space-y-4 py-2">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>
                  {progress.done} / {progress.total} audited
                  {progress.errors > 0 && (
                    <span className="text-red-500 ml-2">· {progress.errors} errors</span>
                  )}
                </span>
                <span>{percent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-hanok-teal to-teal-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {phase === 'running' && progress.currentTitleName && (
              <div className="text-sm text-gray-700">
                <span className="text-gray-500">Auditing:</span>{' '}
                <span className="font-medium">{progress.currentTitleName}</span>
              </div>
            )}

            {phase === 'running' && eta && (
              <div className="text-xs text-gray-500">Estimated time remaining: {eta}</div>
            )}

            {phase === 'done' && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <Icon icon="solar:check-circle-bold-duotone" className="h-5 w-5" />
                Audit complete.
              </div>
            )}

            {phase === 'cancelled' && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Icon icon="solar:stop-circle-bold-duotone" className="h-5 w-5" />
                Cancelled. Audits completed up to this point have been saved.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {phase === 'configure' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleStart} className="bg-hanok-teal hover:bg-hanok-teal/90">
                Start Audit
              </Button>
            </>
          )}
          {phase === 'running' && (
            <Button variant="outline" onClick={handleCancel}>
              Cancel run
            </Button>
          )}
          {(phase === 'done' || phase === 'cancelled') && (
            <Button onClick={() => onOpenChange(false)} className="bg-hanok-teal hover:bg-hanok-teal/90">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AuditRunModal;
