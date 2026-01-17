"use client";

/**
 * FileUpload Component
 * Beautiful, reusable file upload with drag & drop, progress, and preview
 * Matches GymPro theme - orange primary, rounded-xl, shadow effects
 */

import * as React from "react";
import {
  Upload,
  X,
  Image,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  uploadFile,
  uploadApi,
  type FileCategory,
  type UploadedFile,
} from "@/lib/upload";

// ============================================
// TYPES
// ============================================

export interface FileUploadProps {
  // Configuration
  category: FileCategory;
  entityType?: string;
  entityId?: string;
  isPublic?: boolean;

  // Limits (override defaults)
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];

  // Callbacks
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: Error, file: File) => void;
  onRemove?: (fileId: string) => void;

  // UI customization
  variant?: "default" | "avatar" | "compact";
  showPreview?: boolean;
  disabled?: boolean;
  className?: string;

  // Existing files
  existingFiles?: UploadedFile[];
  
  // Value for controlled component
  value?: string; // URL for single file (avatar)
  onChange?: (url: string | null) => void;
}

interface FileState {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
  result?: UploadedFile;
}

// ============================================
// DEFAULT LIMITS BY CATEGORY
// ============================================

const DEFAULT_LIMITS: Record<
  FileCategory,
  { maxSize: number; types: string[] }
> = {
  MEMBER_AVATAR: { maxSize: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  MEMBER_DOCUMENT: { maxSize: 10 * 1024 * 1024, types: ["application/pdf", "image/jpeg", "image/png"] },
  TRAINER_AVATAR: { maxSize: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  TRAINER_CERTIFICATE: { maxSize: 10 * 1024 * 1024, types: ["application/pdf", "image/jpeg"] },
  PRODUCT_IMAGE: { maxSize: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  CLASS_IMAGE: { maxSize: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  ORGANIZATION_LOGO: { maxSize: 2 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/svg+xml"] },
  INVOICE_PDF: { maxSize: 5 * 1024 * 1024, types: ["application/pdf"] },
  REPORT_EXPORT: { maxSize: 20 * 1024 * 1024, types: ["application/pdf", "text/csv"] },
  OTHER: { maxSize: 10 * 1024 * 1024, types: ["*/*"] },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function isImageType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function getAcceptString(types: string[]): string {
  if (types.includes("*/*")) return "*/*";
  return types.join(",");
}

// ============================================
// MAIN COMPONENT
// ============================================

export function FileUpload({
  category,
  entityType,
  entityId,
  isPublic = false,
  maxFiles = 1,
  maxSize,
  acceptedTypes,
  onUploadComplete,
  onUploadError,
  onRemove,
  variant = "default",
  showPreview = true,
  disabled = false,
  className,
  existingFiles = [],
  value,
  onChange,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<FileState[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Get limits
  const limits = DEFAULT_LIMITS[category] || DEFAULT_LIMITS.OTHER;
  const effectiveMaxSize = maxSize || limits.maxSize;
  const effectiveTypes = acceptedTypes || limits.types;

  // Calculate how many more files can be added
  const currentCount = files.filter((f) => f.status !== "error").length + existingFiles.length;
  const canAddMore = currentCount < maxFiles;

  // Validate file
  const validateFile = (file: File): string | null => {
    if (file.size > effectiveMaxSize) {
      return `File too large. Max size: ${formatFileSize(effectiveMaxSize)}`;
    }
    if (!effectiveTypes.includes("*/*") && !effectiveTypes.includes(file.type)) {
      return `Invalid file type. Allowed: ${effectiveTypes.join(", ")}`;
    }
    return null;
  };

  // Handle file selection
  const handleFiles = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || disabled) return;

    const newFiles: FileState[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      if (currentCount + newFiles.length >= maxFiles) break;

      const file = selectedFiles[i];
      const error = validateFile(file);

      const fileState: FileState = {
        file,
        id: `${Date.now()}-${i}`,
        progress: 0,
        status: error ? "error" : "pending",
        error: error ?? undefined,
      };

      newFiles.push(fileState);
    }

    setFiles((prev) => [...prev, ...newFiles]);

    // Start uploading valid files
    for (const fileState of newFiles) {
      if (fileState.status === "pending") {
        uploadSingleFile(fileState);
      }
    }
  };

  // Upload single file
  const uploadSingleFile = async (fileState: FileState) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileState.id ? { ...f, status: "uploading" as const } : f
      )
    );

    try {
      const result = await uploadFile(fileState.file, category, {
        entityType,
        entityId,
        isPublic,
        onProgress: (progress) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileState.id ? { ...f, progress } : f
            )
          );
        },
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileState.id
            ? { ...f, status: "complete" as const, progress: 100, result }
            : f
        )
      );

      onUploadComplete?.(result);
      onChange?.(result.url);
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Upload failed");
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileState.id
            ? { ...f, status: "error" as const, error: err.message }
            : f
        )
      );
      onUploadError?.(err, fileState.file);
    }
  };

  // Remove file from list
  const removeFile = (fileId: string) => {
    const fileState = files.find((f) => f.id === fileId);
    if (fileState?.result) {
      onRemove?.(fileState.result.id);
    }
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    onChange?.(null);
  };

  // Remove existing file
  const removeExistingFile = async (fileId: string) => {
    try {
      await uploadApi.deleteFile(fileId);
      onRemove?.(fileId);
      onChange?.(null);
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  };

  // Drag handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && canAddMore) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // ============================================
  // RENDER: AVATAR VARIANT
  // ============================================

  if (variant === "avatar") {
    const currentUrl = value || existingFiles[0]?.url || files.find(f => f.result)?.result?.url;
    const isUploading = files.some((f) => f.status === "uploading");

    return (
      <div className={cn("relative inline-block", className)}>
        {/* Avatar Circle */}
        <div
          className={cn(
            "relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed",
            "transition-all duration-300",
            isDragging
              ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10 scale-105"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800",
            !disabled && "hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-500/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {currentUrl ? (
            <img
              src={currentUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-zinc-400" />
              )}
            </div>
          )}

          {/* Progress overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-sm font-medium">
                {files.find((f) => f.status === "uploading")?.progress}%
              </div>
            </div>
          )}
        </div>

        {/* Hidden input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptString(effectiveTypes)}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        {/* Change/Remove buttons */}
        <div className="absolute -bottom-1 -right-1 flex gap-1">
          {currentUrl && !disabled && (
            <Button
              type="button"
              size="icon-sm"
              variant="destructive"
              className="rounded-full shadow-lg"
              onClick={() => {
                if (existingFiles[0]) {
                  removeExistingFile(existingFiles[0].id);
                } else {
                  const completedFile = files.find((f) => f.result);
                  if (completedFile) removeFile(completedFile.id);
                }
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          <Button
            type="button"
            size="icon-sm"
            variant="default"
            className="rounded-full shadow-lg"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            <Upload className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: COMPACT VARIANT
  // ============================================

  if (variant === "compact") {
    return (
      <div className={cn("space-y-2", className)}>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || !canAddMore}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {files.some((f) => f.status === "uploading") ? "Uploading..." : "Upload File"}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptString(effectiveTypes)}
          onChange={(e) => handleFiles(e.target.files)}
          multiple={maxFiles > 1}
          className="hidden"
          disabled={disabled}
        />

        {/* File list */}
        {(files.length > 0 || existingFiles.length > 0) && (
          <div className="space-y-1">
            {existingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
              >
                <FileText className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <span className="text-sm truncate flex-1">{file.originalName}</span>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => removeExistingFile(file.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
            {files.map((file) => (
              <CompactFileItem
                key={file.id}
                file={file}
                onRemove={() => removeFile(file.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // RENDER: DEFAULT VARIANT
  // ============================================

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      {canAddMore && (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-8",
            "transition-all duration-300 cursor-pointer",
            "flex flex-col items-center justify-center gap-3",
            isDragging
              ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10 scale-[1.02]"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30",
            !disabled &&
              "hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-500/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          {/* Upload Icon */}
          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center",
              "transition-all duration-300",
              isDragging
                ? "bg-orange-500 text-white scale-110"
                : "bg-zinc-100 dark:bg-zinc-700 text-zinc-400"
            )}
          >
            <Upload className="w-8 h-8" />
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="font-semibold text-zinc-900 dark:text-white">
              {isDragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              or{" "}
              <span className="text-orange-500 hover:underline">browse</span> to
              choose files
            </p>
          </div>

          {/* Limits info */}
          <div className="flex flex-wrap gap-2 justify-center text-xs text-zinc-400">
            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
              Max: {formatFileSize(effectiveMaxSize)}
            </span>
            {maxFiles > 1 && (
              <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
                Up to {maxFiles} files
              </span>
            )}
          </div>
        </div>
      )}

      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptString(effectiveTypes)}
        onChange={(e) => handleFiles(e.target.files)}
        multiple={maxFiles > 1}
        className="hidden"
        disabled={disabled}
      />

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {existingFiles.map((file) => (
            <ExistingFileCard
              key={file.id}
              file={file}
              showPreview={showPreview}
              onRemove={() => removeExistingFile(file.id)}
            />
          ))}
        </div>
      )}

      {/* Uploading/New Files */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {files.map((file) => (
            <FileCard
              key={file.id}
              fileState={file}
              showPreview={showPreview}
              onRemove={() => removeFile(file.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function FileCard({
  fileState,
  showPreview,
  onRemove,
}: {
  fileState: FileState;
  showPreview: boolean;
  onRemove: () => void;
}) {
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (showPreview && isImageType(fileState.file.type)) {
      const url = URL.createObjectURL(fileState.file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [fileState.file, showPreview]);

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden border",
        "bg-white dark:bg-zinc-800 transition-all duration-300",
        fileState.status === "error"
          ? "border-red-300 dark:border-red-500/50"
          : fileState.status === "complete"
          ? "border-emerald-300 dark:border-emerald-500/50"
          : "border-zinc-200 dark:border-zinc-700"
      )}
    >
      {/* Preview or Icon */}
      <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
        {preview ? (
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <FileText className="w-10 h-10 text-zinc-400" />
        )}

        {/* Progress Overlay */}
        {fileState.status === "uploading" && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
            <span className="text-white font-semibold">{fileState.progress}%</span>
            <div className="w-3/4 h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${fileState.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Icons */}
        {fileState.status === "complete" && (
          <div className="absolute top-2 right-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 drop-shadow-lg" />
          </div>
        )}
        {fileState.status === "error" && (
          <div className="absolute top-2 right-2">
            <AlertCircle className="w-6 h-6 text-red-500 drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="p-2">
        <p className="text-sm font-medium truncate text-zinc-900 dark:text-white">
          {fileState.file.name}
        </p>
        <p className="text-xs text-zinc-500">
          {fileState.status === "error" ? (
            <span className="text-red-500">{fileState.error}</span>
          ) : (
            formatFileSize(fileState.file.size)
          )}
        </p>
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className={cn(
          "absolute top-2 left-2 w-6 h-6 rounded-full",
          "bg-black/50 hover:bg-black/70 text-white",
          "flex items-center justify-center transition-all",
          "opacity-0 group-hover:opacity-100"
        )}
        style={{ opacity: 1 }} // Always show for now
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function ExistingFileCard({
  file,
  showPreview,
  onRemove,
}: {
  file: UploadedFile;
  showPreview: boolean;
  onRemove: () => void;
}) {
  const isImage = isImageType(file.mimeType);

  return (
    <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 group">
      <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
        {showPreview && isImage ? (
          <img src={file.url} alt="" className="w-full h-full object-cover" />
        ) : (
          <FileText className="w-10 h-10 text-zinc-400" />
        )}

        {/* Confirmed badge */}
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 drop-shadow-lg" />
        </div>
      </div>

      <div className="p-2">
        <p className="text-sm font-medium truncate text-zinc-900 dark:text-white">
          {file.originalName}
        </p>
        <p className="text-xs text-zinc-500">{formatFileSize(file.size)}</p>
      </div>

      {/* Delete overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Button
          type="button"
          size="icon-sm"
          variant="destructive"
          onClick={onRemove}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function CompactFileItem({
  file,
  onRemove,
}: {
  file: FileState;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg",
        file.status === "error"
          ? "bg-red-50 dark:bg-red-500/10"
          : file.status === "complete"
          ? "bg-emerald-50 dark:bg-emerald-500/10"
          : "bg-zinc-100 dark:bg-zinc-800"
      )}
    >
      {file.status === "uploading" ? (
        <Loader2 className="w-4 h-4 text-orange-500 animate-spin flex-shrink-0" />
      ) : file.status === "complete" ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      ) : file.status === "error" ? (
        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      ) : (
        <FileText className="w-4 h-4 text-zinc-500 flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{file.file.name}</p>
        {file.status === "uploading" && (
          <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-orange-500 transition-all"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}
        {file.status === "error" && (
          <p className="text-xs text-red-500">{file.error}</p>
        )}
      </div>

      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        onClick={onRemove}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}

export default FileUpload;
