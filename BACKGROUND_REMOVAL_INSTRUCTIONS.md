# Professional Background Removal Guide

## 🎯 Quick Solution: Use remove.bg (Recommended)

The easiest and most professional way to remove backgrounds while keeping faces intact.

### Steps:

1. **Visit remove.bg:**
   - Go to: https://www.remove.bg
   - No signup needed for first image

2. **Process dress1.png:**
   - Click "Upload Image"
   - Select `dress1.png` from your project
   - Wait 5-10 seconds for processing
   - Click "Download" 
   - Save as `dress1.png` (replace original in `public/` folder)

3. **Process dress2.png:**
   - Repeat the same process for `dress2.png`
   - Replace the original in `public/` folder

4. **Done!** Your website will automatically use the new images.

---

## 🔧 Alternative: Automated Script (Advanced)

If you want to automate this, you can use the Node.js script:

1. **Get API Key:**
   - Visit: https://www.remove.bg/api
   - Sign up (free: 50 images/month)
   - Copy your API key

2. **Set API Key:**
   ```bash
   export REMOVE_BG_API_KEY="your-api-key-here"
   ```

3. **Run Script:**
   ```bash
   node scripts/remove-background.js
   ```

---

## 🎨 Adding Professional Backgrounds (Optional)

After removing backgrounds, you can add professional solid colors:

### Using Photopea (Free):
1. Go to https://www.photopea.com
2. Open your processed image (with transparent background)
3. Create new layer below
4. Fill with professional color:
   - **Cream:** RGB(250, 248, 245)
   - **White:** RGB(255, 255, 255)
   - **Soft Sage:** RGB(246, 247, 246)
5. Export as PNG

### Background Color Recommendations:
- ✅ **Cream/Beige** - Warm and professional
- ✅ **Pure White** - Clean and modern
- ✅ **Soft Gradient** - Subtle cream to white
- ❌ Avoid busy patterns or textures

---

## ✅ Quality Checklist

After processing, ensure:
- [ ] Original face is unchanged
- [ ] Background is cleanly removed
- [ ] Image quality is high (no pixelation)
- [ ] File format is PNG
- [ ] Images are in `public/` folder with same names

---

## 🚀 Testing

After replacing images:
```bash
npm run dev
```

Visit http://localhost:3000/catalogue to see your professional images!

---

**Note:** remove.bg offers 1 free image/month without signup, or 50 free images/month with account.

