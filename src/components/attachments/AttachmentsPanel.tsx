import { useEffect, useRef, useState } from 'react';
import { FileText, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/apiClient';
import { opsApi, type Attachment, type AttachmentParentType } from '@/lib/opsApi';
import { isAcceptedAttachment, readFileAsBase64, formatFileSize } from '@/lib/fileUpload';
import { timeAgo } from '@/lib/utils';

export function AttachmentsPanel({ parentType, parentId, canUpload }: { parentType: AttachmentParentType; parentId: string; canUpload: boolean }) {
  const toast = useToast();
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    opsApi.attachments.list(parentType, parentId).then((res) => setItems(res.items)).finally(() => setLoading(false));
  }
  useEffect(load, [parentType, parentId]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const problem = isAcceptedAttachment(file);
      if (problem) { toast({ type: 'error', title: file.name, description: problem }); continue; }
      try {
        const data = await readFileAsBase64(file);
        await opsApi.attachments.upload(parentType, parentId, { filename: file.name, contentType: file.type, data });
      } catch (err) {
        toast({ type: 'error', title: `Could not upload ${file.name}`, description: err instanceof ApiError ? err.message : undefined });
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
    load();
  }

  return (
    <div className="flex flex-col gap-2">
      {loading ? (
        <p className="py-4 text-center text-xs text-slate-400">Loading attachments…</p>
      ) : items.length === 0 ? (
        <EmptyState title="No attachments" description="No files have been attached yet." />
      ) : (
        items.map((a) => (
          <a
            key={a.id}
            href={opsApi.attachments.downloadUrl(a.id)}
            className="flex items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><FileText size={15} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-slate-700">{a.filename}</p>
              <p className="text-xs text-slate-400">{formatFileSize(a.size)} · {a.uploadedByName} · {timeAgo(a.createdAt)}</p>
            </div>
          </a>
        ))
      )}

      {canUpload && (
        <div className="mt-2">
          <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => void handleFiles(e.target.files)} />
          <Button type="button" variant="secondary" size="sm" icon={Paperclip} loading={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? 'Uploading…' : 'Add attachment'}
          </Button>
        </div>
      )}
    </div>
  );
}
