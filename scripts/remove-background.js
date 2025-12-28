/**
 * Background Removal Script using remove.bg API
 * 
 * This script uses the remove.bg API to remove backgrounds from images.
 * You'll need a free API key from https://www.remove.bg/api
 * 
 * Usage:
 * 1. Get free API key from https://www.remove.bg/api (50 free images/month)
 * 2. Set REMOVE_BG_API_KEY environment variable or add to .env file
 * 3. Run: node scripts/remove-background.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const API_KEY = process.env.REMOVE_BG_API_KEY || '';
const INPUT_DIR = path.join(__dirname, '../public');
const OUTPUT_DIR = path.join(__dirname, '../public');

const images = ['dress1.png', 'dress2.png'];

function removeBackground(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    if (!API_KEY) {
      console.error('❌ Error: REMOVE_BG_API_KEY not set!');
      console.log('\n📝 To get a free API key:');
      console.log('   1. Visit: https://www.remove.bg/api');
      console.log('   2. Sign up for free (50 images/month)');
      console.log('   3. Copy your API key');
      console.log('   4. Run: export REMOVE_BG_API_KEY="your-key-here"');
      console.log('   5. Or add to .env file: REMOVE_BG_API_KEY=your-key-here\n');
      reject(new Error('API key not set'));
      return;
    }

    const imageData = fs.readFileSync(inputPath);
    
    const options = {
      hostname: 'api.remove.bg',
      path: '/v1.0/removebg',
      method: 'POST',
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': imageData.length
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errorData = '';
        res.on('data', (chunk) => { errorData += chunk; });
        res.on('end', () => {
          console.error(`❌ API Error (${res.statusCode}):`, errorData);
          reject(new Error(`API returned ${res.statusCode}`));
        });
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ Processed: ${path.basename(outputPath)}`);
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    // Send image data
    const formData = `image_file_b64=${imageData.toString('base64')}`;
    req.write(formData);
    req.end();
  });
}

async function processImages() {
  console.log('🎨 Starting background removal...\n');

  if (!API_KEY) {
    console.log('💡 Alternative: Use the online tool at https://www.remove.bg');
    console.log('   Upload images manually and download processed versions.\n');
    return;
  }

  for (const imageName of images) {
    const inputPath = path.join(INPUT_DIR, imageName);
    const outputPath = path.join(OUTPUT_DIR, imageName);

    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Skipping ${imageName} (not found)`);
      continue;
    }

    try {
      await removeBackground(inputPath, outputPath);
    } catch (error) {
      console.error(`❌ Failed to process ${imageName}:`, error.message);
    }
  }

  console.log('\n✨ Background removal complete!');
  console.log('📸 Check your images in the public/ folder\n');
}

// Run the script
processImages().catch(console.error);

