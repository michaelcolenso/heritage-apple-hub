import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

type ImageUploaderProps = {
  kind: "listing" | "avatar";
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
};

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

export default function ImageUploader({ kind, value, onChange, max = 6 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const presign = trpc.upload.getPresignedUploadUrl.useMutation();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = Math.max(0, max - value.length);
    if (remaining <= 0) {
      toast.error(`You can attach at most ${max} images`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    setIsUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of toUpload) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          toast.error(`Unsupported file type: ${file.name}`);
          continue;
        }
        const { uploadUrl, publicUrl } = await presign.mutateAsync({
          filename: file.name,
          contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
          kind,
        });
        const res = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!res.ok) {
          toast.error(`Upload failed for ${file.name}`);
          continue;
        }
        uploaded.push(publicUrl);
      }
      if (uploaded.length > 0) {
        onChange([...value, ...uploaded]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (url: string) => {
    onChange(value.filter((u) => u !== url));
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {value.map((url) => (
            <div key={url} className="relative group rounded-lg overflow-hidden border border-[var(--color-sage-light)]">
              <img src={url} alt="" className="w-full aspect-square object-cover" />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {value.length < max && (
        <label
          className={`flex items-center justify-center gap-2 w-full h-24 rounded-lg border-2 border-dashed border-[var(--color-sage-light)] text-sm text-[var(--color-bark-warm)] cursor-pointer transition-colors hover:bg-[var(--color-bone)] ${
            isUploading ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>{isUploading ? "Uploading..." : "Click or drop images"}</span>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            multiple={kind === "listing"}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
