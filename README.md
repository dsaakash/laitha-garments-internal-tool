# Lalitha Garments - Landing Page

A modern, responsive landing page for Lalitha Garments, an Indian online clothing brand specializing in customized and ready-made clothing.

## Features

- 🎨 **Premium Professional Design** - Modern, elegant UI/UX with refined typography and smooth animations
- 📱 **Fully Responsive** - Mobile-first design that looks perfect on all devices
- 🛍️ **Catalogue with Filters** - Browse collections by category (Kurtis, Dresses, Sarees)
- ✨ **Custom Inquiry Form** - Easy-to-use form that sends inquiries via WhatsApp
- 💬 **WhatsApp Integration** - Floating button and direct contact links (7204219541)
- 🖼️ **Professional Image Display** - Optimized image containers with hover effects
- 🎯 **SEO-Friendly** - Proper meta tags and semantic HTML
- 🚀 **Production Ready** - Optimized for Vercel deployment

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Responsive Design** - Mobile-first approach

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/
├── app/
│   ├── catalogue/          # Catalogue page with filters
│   ├── custom-inquiry/      # Custom order inquiry form
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/              # React components
│   ├── HeroSection.tsx
│   ├── WhatWeDo.tsx
│   ├── WhyChoose.tsx
│   ├── Products.tsx
│   ├── CustomizationProcess.tsx
│   ├── CallToAction.tsx
│   ├── Footer.tsx
│   └── WhatsAppFloat.tsx
├── public/                  # Static assets
│   ├── dress1.png          # Your dress image 1
│   └── dress2.png          # Your dress image 2
└── package.json
```

## Image Processing - Background Removal

The dress images (`dress1.png` and `dress2.png`) need professional background removal.

### Quick Method (Recommended):
1. Visit [remove.bg](https://www.remove.bg/)
2. Upload `dress1.png` → Download → Replace in `public/` folder
3. Upload `dress2.png` → Download → Replace in `public/` folder
4. Done! Website will automatically use the new images

**See `BACKGROUND_REMOVAL_INSTRUCTIONS.md` for detailed guide.**

### Automated Method:
Use the provided Node.js script with remove.bg API:
```bash
export REMOVE_BG_API_KEY="your-key"
node scripts/remove-background.js
```

**Important:** Keep original faces intact, only remove/replace backgrounds for professional look.

## Customization

### WhatsApp Number
The WhatsApp number is set to `7204219541`. To change it, update:
- `components/HeroSection.tsx`
- `components/CallToAction.tsx`
- `components/WhatsAppFloat.tsx`
- `app/catalogue/page.tsx`
- `app/custom-inquiry/page.tsx`

### Colors
Edit `tailwind.config.js` to customize the color palette:
- Primary colors (terracotta/amber)
- Sage colors (green tones)
- Cream colors (neutral tones)

### Content
All content can be edited in the respective component files in the `components/` directory.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Deploy automatically

### Other Platforms

```bash
npm run build
npm start
```

## Features Breakdown

### Home Page
- Hero section with brand name and CTAs
- What We Offer section (Customized vs Catalogue)
- Why Choose section with features
- Products overview
- Customization process steps
- Call to action section
- Footer

### Catalogue Page
- Category filters (All, Kurtis, Dresses, Sarees)
- Product cards with images
- WhatsApp inquiry buttons
- Link to custom inquiry form

### Custom Inquiry Form
- Name, mobile, requirement, fabric fields
- WhatsApp integration
- Form validation
- User-friendly flow

## Contact

For any questions or support, contact via WhatsApp: +91 7204219541

---

Built with ❤️ for Lalitha Garments

