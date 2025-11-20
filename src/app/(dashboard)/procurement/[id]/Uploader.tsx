"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function Uploader({ caseId }: { caseId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpload() {
    if (!file) {
      setError('Please choose a file to attach.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const key = `${caseId}/${Date.now()}_${file.name}`;
      const signRes = await fetch('/api/uploads/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, contentType: file.type }),
      });
      const { uploadUrl } = await signRes.json();
      // PUT the file to the upload URL (local dev or S3 presign)
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      const url = uploadUrl.startsWith('/api/uploads/local')
        ? `/uploads/${key}`
        : uploadUrl;
      // Use the original filename as the type instead of 'GENERIC'
      await fetch('/api/attachments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, type: file.name, url }),
      });
      setFile(null);
      window.location.reload();
    } catch (e: any) {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.txt"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <Button size="sm" disabled={uploading} onClick={onUpload}>
        {uploading ? 'Uploading…' : 'Attach'}
      </Button>
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}


