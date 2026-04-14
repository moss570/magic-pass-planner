-- Blog Posts Table — Rocket can publish whenever needed
-- Public read-only, admins (Rocket) can write

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  author_email TEXT,
  featured_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS Policies
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Admins/Rocket can read/write/delete all posts
CREATE POLICY "admins_manage_posts" ON blog_posts
  FOR ALL
  USING (auth.jwt() ->> 'email' IN ('moss570@gmail.com', 'brandon@discountmikeblinds.net', 'rocket@discountmikeblinds.net'))
  WITH CHECK (auth.jwt() ->> 'email' IN ('moss570@gmail.com', 'brandon@discountmikeblinds.net', 'rocket@discountmikeblinds.net'));

-- Public can only read published posts
CREATE POLICY "public_read_published" ON blog_posts
  FOR SELECT
  USING (is_published = true);

-- Create index for faster queries
CREATE INDEX idx_blog_published_at ON blog_posts(published_at DESC) WHERE is_published = true;
CREATE INDEX idx_blog_slug ON blog_posts(slug);
CREATE INDEX idx_blog_category ON blog_posts(category);
