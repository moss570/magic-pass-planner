
INSERT INTO storage.buckets (id, name, public) VALUES ('feed-images', 'feed-images', true);

CREATE POLICY "Public read feed images"
ON storage.objects FOR SELECT
USING (bucket_id = 'feed-images');

CREATE POLICY "Authenticated users upload feed images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'feed-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own feed images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'feed-images' AND auth.uid()::text = (storage.foldername(name))[1]);
