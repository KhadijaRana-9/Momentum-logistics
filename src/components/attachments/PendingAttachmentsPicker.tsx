import { useRef, useState } from 'react';
import { Paperclip, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { isAcceptedAttachment, readFileAsBase64, formatFileSize } from '@/lib/fileUpload';

export interface PendingFile {
  file: File;
  filename: string;
  contentType: string;
  data: string;
}

/**
 * File picker for a create-form where the parent record doesn't exist yet.
 * Files are read into memory (base64) immediately but only actually uploaded
 * by the caller once the parent has been saved and has a real id.
 */
export function PendingAttachmentsPicker({ files, onChange }: { files: PendingFile[]; onChange: (files: PendingFile[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    const next: PendingFile[] = [...files];
    for (const file of Array.from(fileList)) {
      const problem = isAcceptedAttachment(file);
      if (problem) { setError(problem); continue; }
      const data = await readFileAsBase64(file);
      next.push({ file, filename: file.name, contentType: file.type, data });
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-4 py-5 text-center">
        <Upload size={18} className="mx-auto text-slate-400" />
        <div className="flex-1 text-left">
          <p className="text-[13px] font-medium text-slate-600">Attach PO, loading instructions, permits...</p>
          <p className="text-xs text-slate-400">PDF, JPG, PNG or WEBP — up to 3MB each. Uploaded once you save this request.</p>
        </div>
        <Button type="button" variant="secondary" size="sm" icon={Paperclip} onClick={() => inputRef.current?.click()}>Browse</Button>
        <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => void handleFiles(e.target.files)} />
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
      {files.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {files.map((f, i) => (
            <li key={`${f.filename}-${i}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px]">
              <Paperclip size={13} className="shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate text-slate-700">{f.filename}</span>
              <span className="shrink-0 text-slate-400">{formatFileSize(f.file.size)}</span>
              <button type="button" onClick={() => onChange(files.filter((_, idx) => idx !== i))} className="shrink-0 text-slate-400 hover:text-rose-600">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
