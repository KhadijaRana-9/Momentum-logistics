export const ACCEPTED_ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const MAX_ATTACHMENT_MB = 3;

export function isAcceptedAttachment(file: File): string | null {
  if (!ACCEPTED_ATTACHMENT_TYPES.includes(file.type)) return 'Only PDF, JPG, PNG or WEBP files are accepted';
  if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) return `File is too large — max ${MAX_ATTACHMENT_MB}MB`;
  return null;
}

/** Reads a File into a base64 string (no data: prefix) for the JSON upload endpoint. */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(',') ? result.slice(result.indexOf(',') + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
