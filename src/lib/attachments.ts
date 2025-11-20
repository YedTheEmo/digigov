type AttachmentLike = {
  type?: string | null;
  url?: string | null;
};

const LEGACY_LABELS = new Set(['GENERIC', 'FILE', 'DOCUMENT', 'ATTACHMENT']);

function extractFileName(url: string | null | undefined) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed, trimmed.startsWith('http') ? undefined : 'https://placeholder.local');
    const pathname = parsed.pathname || '';
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return null;
    const raw = segments[segments.length - 1];
    return decodeURIComponent(raw);
  } catch {
    const fallbackSegments = trimmed.split('/').filter(Boolean);
    if (fallbackSegments.length === 0) return null;
    return fallbackSegments[fallbackSegments.length - 1];
  }
}

function stripGeneratedPrefix(filename: string | null) {
  if (!filename) return null;
  return filename.replace(/^[0-9]+_/, '');
}

export function getAttachmentDisplayName(attachment: AttachmentLike) {
  const rawLabel = attachment?.type?.trim() || '';
  if (rawLabel && !LEGACY_LABELS.has(rawLabel.toUpperCase())) {
    return rawLabel;
  }

  const extracted = stripGeneratedPrefix(extractFileName(attachment?.url));
  if (extracted) {
    return extracted;
  }

  if (rawLabel) {
    return rawLabel;
  }

  return 'Attachment';
}




