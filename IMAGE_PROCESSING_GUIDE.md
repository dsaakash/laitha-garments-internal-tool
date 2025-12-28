# Image Processing Guide

## Background Removal for Dress Images

Your dress images (`dress1.png` and `dress2.png`) need to have their backgrounds removed or replaced with professional backgrounds while keeping the original faces intact.

## Recommended Tools

### Option 1: remove.bg (Easiest)
1. Go to [https://www.remove.bg](https://www.remove.bg)
2. Upload your image
3. Download the result (PNG with transparent background)
4. Replace the original file in `public/` folder

### Option 2: Photopea (Free, More Control)
1. Go to [https://www.photopea.com](https://www.photopea.com)
2. Open your image
3. Use the Magic Wand or Quick Selection tool to select background
4. Delete or mask the background
5. Export as PNG with transparency
6. Replace the original file in `public/` folder

### Option 3: Canva Background Remover
1. Go to [https://www.canva.com](https://www.canva.com)
2. Upload your image
3. Use the Background Remover tool
4. Download as PNG
5. Replace the original file in `public/` folder

## Adding Professional Backgrounds

After removing the background, you can add professional backgrounds:

### Using Photopea or Photoshop:
1. Open your processed image (with transparent background)
2. Create a new layer below the image
3. Add a professional background:
   - Solid color (cream, white, or soft pastel)
   - Subtle gradient
   - Studio-style backdrop
4. Export as PNG or JPG

### Background Suggestions:
- **Cream/Beige solid** - Clean and professional
- **Soft gradient** - From light cream to soft sage
- **White studio backdrop** - Classic and clean
- **Subtle texture** - Very light pattern for depth

## Important Notes

✅ **DO:**
- Keep the original face exactly as it is
- Maintain image quality (high resolution)
- Use professional, clean backgrounds
- Ensure good lighting in final image
- Save as PNG for transparency or high-quality JPG

❌ **DON'T:**
- Don't alter the face or person
- Don't use busy or distracting backgrounds
- Don't reduce image quality
- Don't add filters that change skin tone

## File Naming

Keep the same filenames:
- `dress1.png` → Replace with processed version
- `dress2.png` → Replace with processed version

## Testing

After replacing images:
1. Run `npm run dev`
2. Check the catalogue page
3. Verify images display correctly
4. Test on mobile devices

## Need Help?

If you need professional image editing services, consider:
- Fiverr (affordable freelancers)
- Upwork (professional editors)
- Local photography studios

