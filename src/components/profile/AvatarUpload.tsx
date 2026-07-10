"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateAvatarUrl } from "@/lib/users/actions";

/** Center-crop to a 512px square JPEG so uploads stay tiny. */
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    512,
    512
  );
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.85
    )
  );
}

export function AvatarUpload({
  userId,
  avatarUrl,
  name,
}: {
  userId: string;
  avatarUrl: string | null;
  name: string;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(false);
    try {
      const blob = await toSquareJpeg(file);
      const supabase = getSupabaseBrowserClient();
      const path = `${userId}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`; // cache-bust replacements
      const res = await updateAvatarUrl(url);
      if (!res.ok) throw new Error("profile update failed");
      setPreview(url);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar url={preview ?? avatarUrl} name={name} size="lg" />
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? t("profile.photoUploading") : t("profile.changePhoto")}
        </Button>
        {error ? (
          <p className="mt-1 text-xs text-danger-ink">{t("profile.photoError")}</p>
        ) : null}
      </div>
    </div>
  );
}
