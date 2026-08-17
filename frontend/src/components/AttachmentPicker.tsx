import React, { useState } from 'react';
import { FileUp, FileText, Image as ImageIcon, X, Loader2, Paperclip } from 'lucide-react';
import { api } from '../api/client';
import type { AttachmentKind, StoredAttachment } from '../types';

interface AttachmentPickerProps {
  label: string;
  hint?: string;
  kind: AttachmentKind;
  value: StoredAttachment[];
  onChange: (next: StoredAttachment[]) => void;
  uploadedBy?: string;
  accept?: string;
}

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  label,
  hint,
  kind,
  value,
  onChange,
  uploadedBy,
  accept = 'application/pdf,image/jpeg,image/png,image/webp',
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setBusy(true);
    setError('');
    try {
      const uploaded: StoredAttachment[] = [];
      for (const file of Array.from(fileList)) {
        const saved = await api.uploadFile(file, kind, uploadedBy);
        uploaded.push({
          id: saved.id,
          fileName: saved.fileName,
          mimeType: saved.mimeType,
          size: saved.size,
          uploadedAt: saved.uploadedAt,
          uploadedBy: saved.uploadedBy,
          kind: (saved.kind as AttachmentKind) || kind,
        });
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block font-semibold text-slate-700 mb-1">{label}</label>
      {hint && <p className="text-[11px] text-slate-500 -mt-1">{hint}</p>}
      <label className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer">
        {busy ? <Loader2 className="w-4 h-4 animate-spin text-emerald-700" /> : <FileUp className="w-4 h-4 text-emerald-700" />}
        <span className="text-xs font-semibold text-emerald-800">
          {busy ? 'Uploading…' : 'Upload PDF or image'}
        </span>
        <input
          type="file"
          accept={accept}
          multiple
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </label>
      {error && <p className="text-[11px] text-rose-700">{error}</p>}
      {value.length > 0 && (
        <div className="space-y-1.5">
          {value.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200"
            >
              <a
                href={api.fileUrl(file.id)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 min-w-0 text-emerald-800 hover:underline"
              >
                {file.mimeType.startsWith('image/') ? (
                  <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="truncate">{file.fileName}</span>
              </a>
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item.id !== file.id))}
                className="p-1 text-slate-400 hover:text-rose-600"
                aria-label="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function AttachmentLinks({ files }: { files?: StoredAttachment[] }) {
  if (!files?.length) return null;
  return (
    <div className="space-y-1">
      {files.map((file) => (
        <a
          key={file.id}
          href={api.fileUrl(file.id)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium hover:underline"
        >
          <Paperclip className="w-3 h-3" />
          <span className="truncate">{file.fileName}</span>
        </a>
      ))}
    </div>
  );
}
