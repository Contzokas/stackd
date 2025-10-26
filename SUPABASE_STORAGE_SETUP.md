# Supabase Storage Setup for Card Images

## Step 1: Run the Database Migration

Run the SQL in `add-card-images.sql` in your Supabase SQL Editor to add the `image_url` column to the cards table.

## Step 2: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Configure the bucket:
   - **Name**: `card-images`
   - **Public bucket**: ✅ YES (check this box)
   - Click **Create bucket**

## Step 3: Set Up Storage Policies

After creating the bucket, click on it and go to **Policies**:

### Policy 1: Allow authenticated users to upload images
```sql
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'card-images');
```

### Policy 2: Allow public read access
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'card-images');
```

### Policy 3: Allow users to delete their own images
```sql
CREATE POLICY "Users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'card-images');
```

## Step 4: Configure Bucket Settings (Optional)

In the bucket settings, you can set:
- **File size limit**: 5MB
- **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`

## Testing

After setup:
1. Create or open a card
2. Click the "📎 Click to upload image" button
3. Select an image file
4. The image should upload and display immediately
5. You can remove it by clicking the ✕ button on the image

## Troubleshooting

**Upload fails with "new row violates row-level security policy"**
- Make sure the storage policies are created
- Verify the bucket is set to **public**

**Images don't display**
- Check that the bucket is set to **public**
- Verify the public read access policy is enabled

**"Bucket not found" error**
- Make sure the bucket name is exactly `card-images`
- Refresh your app and try again
