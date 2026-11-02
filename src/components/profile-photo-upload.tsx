"use client";

import { useState } from "react";
import { ImageUp, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

const key = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

export function ProfilePhotoUpload({
  value,
  onChange,
  onUploadingChange,
}: {
  value: string;
  onChange: (value: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    if (!key) { toast.error("Photo upload is unavailable. Paste an image URL instead."); return; }
    if (!file.type.startsWith("image/")) { toast.error("Choose an image file."); return; }
    if (file.size > 32 * 1024 * 1024) { toast.error("Choose an image smaller than 32 MB."); return; }
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const data = new FormData();
      data.append("image", file);
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok || !result.success || !result.data?.url) throw new Error(result.error?.message || "Photo upload failed.");
      onChange(result.data.url);
      toast.success("Profile photo uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Photo upload failed.");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  }

  return <div className="profile-photo-field">
    <label>Profile photo</label>
    <div className="upload-control">
      <label className="upload-button"><input type="file" accept="image/*" disabled={uploading} onChange={event => upload(event.target.files?.[0])}/>{uploading ? <LoaderCircle className="spin-icon" size={16}/> : <ImageUp size={16}/>}<span>{uploading ? "Uploading photo..." : value ? "Upload a different photo" : "Upload a photo"}</span></label>
      <small>PNG, JPG or WebP (max 32 MB)</small>
    </div>
    <small className="profile-photo-dimension-help">Optional suggestion: square photos (for example, 512 x 512 px) often fit profile circles nicely. Any image dimensions are welcome.</small>
    <label className="profile-photo-url-label" htmlFor="profile-photo-url">Or paste an image URL</label>
    <input id="profile-photo-url" name="image" type="url" required value={value} onChange={event => onChange(event.target.value)} placeholder="https://..."/>
    {value && <div className="profile-photo-preview-wrap"><img className="profile-photo-preview" src={value} alt="Profile photo preview"/><button type="button" className="profile-photo-remove" onClick={() => onChange("")}>Remove photo</button></div>}
  </div>;
}

