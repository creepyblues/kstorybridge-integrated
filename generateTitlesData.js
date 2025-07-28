import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const IMAGES_DIR = '/Users/sungholee/Downloads/manta_title_left_images';

// Helper function to extract title name from filename
function extractTitleFromFilename(filename) {
  return filename
    .replace('.png', '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to generate Korean title name (placeholder)
function generateKoreanTitle(englishTitle) {
  return englishTitle + ' (Korean)';
}

// Helper to randomly assign genres
function getRandomGenre() {
  const genres = ['romance', 'fantasy', 'action', 'drama', 'comedy', 'thriller', 'sci_fi'];
  return genres[Math.floor(Math.random() * genres.length)];
}

// Helper to randomly assign content format
function getRandomFormat() {
  const formats = ['webtoon', 'web_novel', 'book'];
  return formats[Math.floor(Math.random() * formats.length)];
}

function main() {
  console.log('📋 Generating titles data for import...');

  // Get image files
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ Images directory not found: ${IMAGES_DIR}`);
    return;
  }

  const imageFiles = fs.readdirSync(IMAGES_DIR)
    .filter(file => file.endsWith('.png') && file !== 'blank.png')
    .sort();

  console.log(`📊 Found ${imageFiles.length} image files`);

  // Generate titles data
  const titlesData = [];
  const creatorId = '00000000-0000-0000-0000-000000000001'; // Placeholder creator ID

  imageFiles.forEach((imageFile, index) => {
    const titleNameEn = extractTitleFromFilename(imageFile);
    const titleNameKr = generateKoreanTitle(titleNameEn);
    const titleId = uuidv4();
    
    const titleData = {
      title_id: titleId,
      title_name_en: titleNameEn,
      title_name_kr: titleNameKr,
      creator_id: creatorId,
      genre: getRandomGenre(),
      content_format: getRandomFormat(),
      synopsis: `An exciting story about ${titleNameEn.toLowerCase()}. This compelling narrative explores themes of adventure, friendship, and personal growth.`,
      rating: (Math.floor(Math.random() * 20) + 40) / 10, // 4.0-5.9 rating
      likes: Math.floor(Math.random() * 5000) + 100,
      views: Math.floor(Math.random() * 50000) + 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      image_filename: imageFile
    };

    titlesData.push(titleData);
  });

  // Write to JSON file
  fs.writeFileSync('titles_data.json', JSON.stringify(titlesData, null, 2));
  console.log('✅ Generated titles_data.json with', titlesData.length, 'titles');

  // Write to CSV file for easier import
  const csvHeader = 'title_id,title_name_en,title_name_kr,creator_id,genre,content_format,synopsis,rating,likes,views,created_at,updated_at,image_filename\n';
  const csvRows = titlesData.map(title => {
    return [
      title.title_id,
      `"${title.title_name_en}"`,
      `"${title.title_name_kr}"`,
      title.creator_id,
      title.genre,
      title.content_format,
      `"${title.synopsis.replace(/"/g, '""')}"`, // Escape quotes in synopsis
      title.rating,
      title.likes,
      title.views,
      title.created_at,
      title.updated_at,
      title.image_filename
    ].join(',');
  });

  fs.writeFileSync('titles_data.csv', csvHeader + csvRows.join('\n'));
  console.log('✅ Generated titles_data.csv for easy import');

  // Create SQL insert statements
  const sqlInserts = titlesData.map(title => {
    return `INSERT INTO titles (title_id, title_name_en, title_name_kr, creator_id, genre, content_format, synopsis, rating, likes, views, created_at, updated_at) VALUES ('${title.title_id}', '${title.title_name_en.replace(/'/g, "''")}', '${title.title_name_kr.replace(/'/g, "''")}', '${title.creator_id}', '${title.genre}', '${title.content_format}', '${title.synopsis.replace(/'/g, "''")}', ${title.rating}, ${title.likes}, ${title.views}, '${title.created_at}', '${title.updated_at}');`;
  });

  fs.writeFileSync('titles_data.sql', sqlInserts.join('\n'));
  console.log('✅ Generated titles_data.sql for SQL import');

  console.log('\n📋 IMPORT INSTRUCTIONS:');
  console.log('1. Import titles_data.sql into your Supabase database (SQL Editor)');
  console.log('2. Or import titles_data.csv via Supabase Table Editor');
  console.log('3. Then run the image upload script to link images to titles');

  // Generate image mapping for reference
  const imageMapping = titlesData.map(title => ({
    title_id: title.title_id,
    title_name: title.title_name_en,
    image_file: title.image_filename
  }));

  fs.writeFileSync('image_mapping.json', JSON.stringify(imageMapping, null, 2));
  console.log('4. ✅ Generated image_mapping.json for reference');
}

main();