export default interface IFile {
    id?: string; // Optional, as Firestore generates this
    name: string; // File name
    size: number; // File size in bytes
    type: string; // MIME type (e.g., 'image/png')
    uploadDate: Date; // Date the file was uploaded
    displayName: string; // User-provided display name
    tags: string; // Comma-separated tags
    category: string; // Category or custom category
    url: string;
}
  