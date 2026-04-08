import { useState, useRef, useCallback } from "react";
import { Send, Camera, ImageIcon, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PostComposerProps {
  userId: string;
  userEmail?: string;
  onPostCreated: () => void;
}

export default function PostComposer({ userId, userEmail, onPostCreated }: PostComposerProps) {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Only image files are supported", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", variant: "destructive" });
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("feed-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data: urlData } = supabase.storage.from("feed-images").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const createPost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImage(imageFile);
        setUploading(false);
        if (!imageUrl) {
          toast({ title: "Failed to upload image", variant: "destructive" });
          setPosting(false);
          return;
        }
      }

      const { error } = await supabase.from("social_posts").insert({
        user_id: userId,
        content: content.trim(),
        image_url: imageUrl,
        post_type: "user",
      });
      if (error) throw error;

      setContent("");
      removeImage();
      toast({ title: "✅ Posted!" });
      onPostCreated();
    } catch (err) {
      console.error("Post error:", err);
      toast({ title: "Failed to post", variant: "destructive" });
    } finally {
      setPosting(false);
      setUploading(false);
    }
  };

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${isDragOver ? "border-primary/60 bg-primary/5" : "border-white/8"}`}
      style={{ background: isDragOver ? undefined : "var(--card)" }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-sm font-bold text-primary shrink-0">
          {userEmail?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share a tip, photo, or Disney moment..."
            className="w-full px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40 resize-none"
            style={{ background: "var(--muted)", minHeight: 80 }}
            maxLength={500}
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-48 rounded-lg object-cover"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Drag-drop hint */}
          {isDragOver && (
            <div className="text-center py-4 text-sm font-semibold text-primary">
              📸 Drop your photo here!
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* File picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Add photo from files"
            >
              <ImageIcon className="w-4.5 h-4.5" />
            </button>

            {/* Camera capture */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Take a photo"
            >
              <Camera className="w-4.5 h-4.5" />
            </button>

            <div className="flex-1" />

            <button
              onClick={createPost}
              disabled={posting || !content.trim()}
              className="px-4 py-2 rounded-lg font-bold text-sm text-[var(--background)] disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: "#F5C842" }}
            >
              {posting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {uploading ? "Uploading..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
