import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const AVATAR_SIZE = 400;

interface AvatarUploadProps {
  currentUrl: string | null;
  monogram: string;
  size?: number;
}

export function AvatarUpload({ currentUrl, monogram, size = 96 }: AvatarUploadProps) {
  const { user, refreshProfile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please choose an image file (JPEG, PNG, WebP, or GIF).");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be under 5 MB.");
      return;
    }
    if (!user || !supabase) {
      setError("You must be signed in to upload.");
      return;
    }

    setUploading(true);
    try {
      // Crop to square via canvas
      const bitmap = await createImageBitmap(file);
      const minDim = Math.min(bitmap.width, bitmap.height);
      const sx = (bitmap.width - minDim) / 2;
      const sy = (bitmap.height - minDim) / 2;

      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not process image.");
      ctx.drawImage(bitmap, sx, sy, minDim, minDim, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9),
      );
      if (!blob) throw new Error("Could not process image.");

      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (dbErr) throw dbErr;

      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const ringSize = `${size}px`;

  return (
    <div className="relative inline-block" style={{ width: ringSize, height: ringSize }}>
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-full text-3xl"
        style={{
          border: "3px solid var(--accent)",
          background: currentUrl
            ? "var(--surface)"
            : "linear-gradient(135deg, color-mix(in srgb, var(--accent) 80%, var(--bg-elevated)), var(--accent))",
          color: "var(--bg)",
          fontFamily: '"Cormorant Garamond", serif',
          fontWeight: 600,
          boxShadow:
            "0 0 0 4px var(--surface), 0 8px 24px -8px color-mix(in srgb, var(--accent) 50%, transparent)",
          backgroundImage: currentUrl ? `url(${currentUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!currentUrl && monogram}
      </div>

      {/* Camera overlay — upload entry point */}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-60"
        style={{
          backgroundColor: "var(--accent)",
          color: "var(--bg)",
          border: "3px solid var(--surface)",
        }}
        aria-label="Change profile picture"
      >
        <Camera size={14} strokeWidth={2} />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {uploading && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-full text-xs"
          style={{ backgroundColor: "color-mix(in srgb, var(--surface) 80%, transparent)" }}
        >
          <span style={{ color: "var(--accent)" }}>Uploading...</span>
        </div>
      )}

      {error && (
        <p
          className="absolute left-1/2 top-full mt-2 w-48 -translate-x-1/2 text-center text-xs"
          style={{ color: "var(--error, #c0392b)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
