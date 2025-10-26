-- Add image_url column to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create a storage bucket for card images (run this in Supabase Dashboard -> Storage)
-- Bucket name: card-images
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- Storage policies will be set via Supabase Dashboard
