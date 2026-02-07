"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  X,
  FileText,
  ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface FileUploadProps {
  /** Accepted file types (e.g. "image/*" or "image/*,.pdf") */
  accept?: string;
  /** Max file size in MB */
  maxSizeMB?: number;
  /** Folder path prefix for the uploaded file */
  folder?: string;
  /** Called with the uploaded blob URL on success */
  onUpload: (url: string) => void;
  /** Called when the file is removed */
  onRemove?: () => void;
  /** Currently set URL (shows preview if present) */
  currentUrl?: string | null;
  /** Label shown above the drop zone */
  label?: string;
  /** Extra description text */
  description?: string;
  /** Restrict to images only */
  imageOnly?: boolean;
  /** Custom className for the wrapper */
  className?: string;
  /** Whether the upload is disabled */
  disabled?: boolean;
}

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];

function isImageUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return IMAGE_EXTENSIONS.some((ext) => pathname.includes(ext));
  } catch {
    // If it's not a valid URL, try checking the raw string
    const lower = url.toLowerCase();
    return IMAGE_EXTENSIONS.some((ext) => lower.includes(ext));
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  accept,
  maxSizeMB = 5,
  folder = "uploads",
  onUpload,
  onRemove,
  currentUrl,
  label,
  description,
  imageOnly = false,
  className = "",
  disabled = false,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    url: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const effectiveAccept = accept ?? (imageOnly ? "image/*" : undefined);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Client-side size check
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }

      // Client-side type check for images
      if (imageOnly && !file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        return;
      }

      setUploading(true);
      setProgress(10);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        // Simulate progress since fetch doesn't have built-in progress for uploads
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + Math.random() * 15;
          });
        }, 200);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Upload failed. Please try again.");
          setProgress(0);
          return;
        }

        setProgress(100);
        setUploadedFile({
          name: file.name,
          size: file.size,
          url: data.url,
        });
        onUpload(data.url);

        // Reset progress after a brief success indication
        setTimeout(() => setProgress(0), 1500);
      } catch {
        setError("Upload failed. Please check your connection and try again.");
        setProgress(0);
      } finally {
        setUploading(false);
      }
    },
    [folder, maxSizeMB, imageOnly, onUpload]
  );

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled || uploading) return;
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    },
    [disabled, uploading]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled || uploading) return;

      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [disabled, uploading, handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [handleFile]
  );

  const handleRemove = useCallback(async () => {
    const urlToDelete = uploadedFile?.url || currentUrl;

    // Clean up the blob if we have a URL
    if (urlToDelete) {
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlToDelete }),
        });
      } catch {
        // Silently fail — removal from blob store is best-effort
      }
    }

    setUploadedFile(null);
    setError(null);
    setProgress(0);
    onRemove?.();
  }, [uploadedFile, currentUrl, onRemove]);

  const displayUrl = uploadedFile?.url || currentUrl;
  const showPreview = !!displayUrl;
  const isImage = displayUrl ? isImageUrl(displayUrl) : false;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium leading-none">{label}</label>
      )}

      {/* Current file preview */}
      {showPreview && !uploading && (
        <div className="relative rounded-lg border bg-muted/30 p-3">
          <div className="flex items-start gap-3">
            {isImage ? (
              <div className="relative size-20 shrink-0 overflow-hidden rounded-md border bg-muted">
                <img
                  src={displayUrl!}
                  alt="Uploaded file"
                  className="size-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-md border bg-muted">
                <FileText className="size-8 text-muted-foreground" />
              </div>
            )}

            <div className="min-w-0 flex-1 space-y-1">
              {uploadedFile ? (
                <>
                  <p className="truncate text-sm font-medium">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadedFile.size)}
                  </p>
                </>
              ) : (
                <p className="truncate text-sm text-muted-foreground">
                  {displayUrl}
                </p>
              )}
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="size-3" />
                Uploaded
              </div>
            </div>

            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={handleRemove}
                title="Remove file"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Drop zone — show when no file is set, or when uploading */}
      {(!showPreview || uploading) && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && !disabled && inputRef.current?.click()}
          className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
            disabled
              ? "cursor-not-allowed opacity-50"
              : uploading
                ? "cursor-wait border-primary/30 bg-primary/5"
                : dragActive
                  ? "border-primary bg-primary/10"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={effectiveAccept}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2 className="size-8 animate-spin text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Uploading...</p>
                <div className="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(Math.min(progress, 100))}%
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              {imageOnly ? (
                <ImageIcon className="size-8 text-muted-foreground" />
              ) : (
                <Upload className="size-8 text-muted-foreground" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  <span className="text-primary">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  {imageOnly
                    ? `JPG, PNG, WebP, GIF, or SVG (max ${maxSizeMB}MB)`
                    : `Images or documents (max ${maxSizeMB}MB)`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
