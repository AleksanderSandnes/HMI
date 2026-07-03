/** Best-effort file extension from the filename, falling back to the mime type. */
export function extractExtension(file: File): string {
  const dot = file.name.lastIndexOf(".");
  if (dot > 0 && dot < file.name.length - 1) {
    return file.name.slice(dot + 1).toLowerCase();
  }
  return file.type.split("/")[1] || "jpg";
}
