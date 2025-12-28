# Quick Background Removal Guide

## Best Option: Use remove.bg (Recommended)

This is the easiest and most professional way to remove backgrounds while keeping faces intact.

### Steps:

1. **Go to remove.bg:**
   - Visit: https://www.remove.bg
   - No signup required for first few images

2. **Upload your images:**
   - Click "Upload Image"
   - Select `dress1.png` from your project folder
   - Wait for processing (usually 5-10 seconds)

3. **Download the result:**
   - Click "Download" button
   - The image will have transparent background
   - Save it as `dress1.png` (replace the original)

4. **Repeat for dress2.png:**
   - Upload `dress2.png`
   - Download and replace the original

5. **Add Professional Background (Optional):**
   - If you want a solid color background instead of transparent:
   - Use Photopea (free): https://www.photopea.com
   - Open your processed image
   - Create new layer below
   - Fill with cream/white color (RGB: 250, 248, 245)
   - Export as PNG

### Alternative: Canva Background Remover

1. Go to https://www.canva.com
2. Create new design
3. Upload your image
4. Click on image → Effects → Background Remover
5. Download as PNG
6. Replace original file

## After Processing:

1. Replace the images in `public/` folder:
   - `public/dress1.png` → Your processed image
   - `public/dress2.png` → Your processed image

2. Run your Next.js app:
   ```bash
   npm run dev
   ```

3. Check the catalogue page to see the results!

## Tips:

- ✅ Keep original face exactly as is
- ✅ Use high quality/resolution
- ✅ Professional backgrounds: cream, white, or soft gradients
- ✅ Save as PNG format for best quality

---

**Note:** remove.bg allows 1 free image per month without signup, or unlimited with free account. For best results, this is the recommended method.

