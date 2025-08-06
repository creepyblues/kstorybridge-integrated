import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Genre detection function
function analyzeGenre(titleData) {
    const {
        title_name_kr,
        title_name_en,
        pitch,
        tags,
        genre,
        description,
        tagline
    } = titleData;

    // Define genre indicators with keywords
    const genreIndicators = {
        // Main genres
        romance: ['romance', 'love', 'romantic', 'dating', 'marriage', 'relationship', 'couple', 'boyfriend', 'girlfriend', 'wedding', 'proposal', 'affair', 'cheating', 'love triangle', 'first love', 'unrequited love'],
        fantasy: ['fantasy', 'magic', 'wizard', 'witch', 'spell', 'enchanted', 'supernatural', 'mythical', 'fairy tale', 'dragon', 'princess', 'kingdom', 'castle', 'quest', 'adventure', 'otherworldly'],
        action: ['action', 'fight', 'battle', 'war', 'combat', 'martial arts', 'sword', 'weapon', 'hero', 'villain', 'rescue', 'mission', 'spy', 'assassin', 'ninja', 'soldier'],
        drama: ['drama', 'tragic', 'emotional', 'conflict', 'struggle', 'betrayal', 'revenge', 'family', 'parent', 'child', 'sibling', 'divorce', 'death', 'illness', 'poverty', 'social issue'],
        comedy: ['comedy', 'funny', 'humor', 'gag', 'joke', 'satire', 'parody', 'slapstick', 'wit', 'amusing', 'entertaining', 'hilarious', 'silly', 'absurd'],
        thriller: ['thriller', 'suspense', 'mystery', 'crime', 'murder', 'detective', 'investigation', 'police', 'criminal', 'victim', 'suspect', 'evidence', 'clue', 'conspiracy'],
        horror: ['horror', 'scary', 'fear', 'terror', 'ghost', 'monster', 'zombie', 'vampire', 'demon', 'haunted', 'supernatural', 'paranormal', 'exorcism', 'possession'],
        sci_fi: ['sci-fi', 'science fiction', 'futuristic', 'robot', 'android', 'space', 'alien', 'technology', 'cyber', 'virtual', 'artificial intelligence', 'time travel', 'dimension'],
        slice_of_life: ['slice of life', 'daily life', 'everyday', 'ordinary', 'normal', 'routine', 'school', 'work', 'office', 'family', 'friendship', 'neighbor', 'community'],
        historical: ['historical', 'period', 'ancient', 'medieval', 'royal', 'noble', 'aristocrat', 'palace', 'court', 'king', 'queen', 'prince', 'duke', 'earl', 'warrior'],
        sports: ['sports', 'athlete', 'competition', 'game', 'tournament', 'championship', 'team', 'coach', 'training', 'victory', 'defeat', 'rival', 'challenge'],
        mystery: ['mystery', 'detective', 'investigation', 'clue', 'evidence', 'suspect', 'crime', 'murder', 'disappearance', 'secret', 'conspiracy', 'puzzle'],
        adventure: ['adventure', 'journey', 'quest', 'exploration', 'discovery', 'treasure', 'map', 'expedition', 'voyage', 'travel', 'wander', 'explorer'],
        psychological: ['psychological', 'mental', 'psychology', 'mind', 'consciousness', 'memory', 'trauma', 'therapy', 'psychiatrist', 'mental illness', 'personality', 'behavior'],
        supernatural: ['supernatural', 'ghost', 'spirit', 'demon', 'angel', 'deity', 'god', 'goddess', 'myth', 'legend', 'folklore', 'magical', 'enchanted'],
        school: ['school', 'student', 'teacher', 'classroom', 'academy', 'university', 'college', 'education', 'study', 'exam', 'homework', 'campus', 'dormitory'],
        workplace: ['workplace', 'office', 'company', 'business', 'career', 'job', 'boss', 'employee', 'colleague', 'work', 'professional', 'corporate'],
        family: ['family', 'parent', 'child', 'sibling', 'brother', 'sister', 'mother', 'father', 'grandparent', 'cousin', 'relative', 'household', 'domestic'],
        music: ['music', 'singer', 'band', 'concert', 'performance', 'musician', 'song', 'melody', 'rhythm', 'instrument', 'orchestra', 'choir', 'audition'],
        food: ['food', 'cooking', 'chef', 'restaurant', 'kitchen', 'recipe', 'ingredient', 'meal', 'cuisine', 'gourmet', 'baking', 'catering'],
        medical: ['medical', 'doctor', 'nurse', 'hospital', 'clinic', 'patient', 'treatment', 'surgery', 'medicine', 'disease', 'health', 'emergency'],
        legal: ['legal', 'lawyer', 'court', 'judge', 'trial', 'law', 'justice', 'crime', 'criminal', 'defense', 'prosecution', 'verdict'],
        military: ['military', 'army', 'navy', 'air force', 'soldier', 'officer', 'commander', 'war', 'battle', 'mission', 'training', 'rank'],
        political: ['political', 'government', 'president', 'minister', 'election', 'campaign', 'policy', 'diplomacy', 'corruption', 'power', 'authority'],
        crime: ['crime', 'criminal', 'gang', 'mafia', 'drug', 'smuggling', 'theft', 'robbery', 'murder', 'investigation', 'police', 'detective'],
        western: ['western', 'cowboy', 'ranch', 'frontier', 'wild west', 'sheriff', 'outlaw', 'horse', 'desert', 'saloon', 'gold rush'],
        war: ['war', 'battle', 'conflict', 'military', 'soldier', 'army', 'enemy', 'victory', 'defeat', 'strategy', 'tactics', 'combat'],
        post_apocalyptic: ['post-apocalyptic', 'apocalypse', 'survival', 'wasteland', 'ruin', 'disaster', 'end of world', 'zombie', 'virus', 'pandemic'],
        isekai: ['isekai', 'another world', 'reincarnation', 'transmigration', 'parallel world', 'different world', 'summoned', 'portal'],
        martial_arts: ['martial arts', 'kung fu', 'karate', 'taekwondo', 'fighting', 'combat', 'warrior', 'master', 'dojo', 'training', 'tournament'],
        mecha: ['mecha', 'robot', 'giant robot', 'pilot', 'machine', 'mechanical', 'armor', 'suit', 'battle', 'technology'],
        idol: ['idol', 'celebrity', 'star', 'fame', 'entertainment', 'show business', 'performance', 'fan', 'audience', 'stage'],
        gaming: ['gaming', 'game', 'player', 'virtual', 'online', 'level', 'quest', 'achievement', 'guild', 'raid', 'esports'],
        cooking: ['cooking', 'chef', 'kitchen', 'recipe', 'food', 'restaurant', 'cuisine', 'ingredient', 'baking', 'catering'],
        fashion: ['fashion', 'style', 'designer', 'model', 'clothing', 'beauty', 'makeup', 'cosmetics', 'runway', 'trend'],
        art: ['art', 'artist', 'painting', 'sculpture', 'gallery', 'museum', 'creative', 'masterpiece', 'exhibition', 'canvas'],
        dance: ['dance', 'dancer', 'choreography', 'performance', 'ballet', 'modern', 'hip hop', 'stage', 'audition', 'competition'],
        photography: ['photography', 'photographer', 'camera', 'photo', 'studio', 'model', 'shoot', 'portrait', 'landscape'],
        travel: ['travel', 'journey', 'trip', 'vacation', 'tourist', 'destination', 'adventure', 'exploration', 'backpacking'],
        nature: ['nature', 'wildlife', 'animal', 'forest', 'mountain', 'ocean', 'environment', 'conservation', 'outdoor'],
        urban: ['urban', 'city', 'metropolitan', 'street', 'neighborhood', 'community', 'downtown', 'suburb', 'urban life'],
        rural: ['rural', 'countryside', 'village', 'farm', 'agriculture', 'pastoral', 'rustic', 'small town'],
        cyberpunk: ['cyberpunk', 'cyber', 'neon', 'dystopian', 'futuristic', 'technology', 'hacker', 'virtual reality'],
        steampunk: ['steampunk', 'steam', 'mechanical', 'clockwork', 'industrial', 'victorian', 'brass', 'gear'],
        bl: ['bl', 'boys love', 'yaoi', 'gay', 'lgbtq', 'same-sex', 'male romance'],
        gl: ['gl', 'girls love', 'yuri', 'lesbian', 'lgbtq', 'same-sex', 'female romance'],
        adult: ['adult', 'mature', 'explicit', 'erotic', 'sexy', 'seduction', 'passion', 'intimate'],
        children: ['children', 'kids', 'child', 'family-friendly', 'educational', 'learning', 'innocent', 'wholesome']
    };

    // Analyze text for genre indicators with weighted scoring
    const genreScores = {};

    // Define field weights (higher weight = more important for genre)
    const fieldWeights = {
        title_name_kr: 3,
        title_name_en: 3,
        pitch: 2,
        description: 2,
        tagline: 2,
        tags: 1.5,
        genre: 1
    };

    // Analyze each field separately with weights
    const fields = {
        title_name_kr,
        title_name_en,
        pitch,
        description,
        tagline,
        tags: tags ? tags.join(' ') : '',
        genre: Array.isArray(genre) ? genre.join(' ') : (genre || '')
    };

    for (const [fieldName, fieldText] of Object.entries(fields)) {
        if (!fieldText) continue;

        const weight = fieldWeights[fieldName] || 1;
        const fieldTextLower = fieldText.toLowerCase();

        for (const [genre, indicators] of Object.entries(genreIndicators)) {
            let fieldScore = 0;

            for (const indicator of indicators) {
                const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
                const foundMatches = fieldTextLower.match(regex);
                if (foundMatches) {
                    fieldScore += foundMatches.length * weight;
                }
            }

            if (fieldScore > 0) {
                genreScores[genre] = (genreScores[genre] || 0) + fieldScore;
            }
        }
    }

    // Get top genres
    const sortedGenres = Object.entries(genreScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([genre, score]) => ({ genre, score }));

    // Additional analysis based on existing genre tags
    if (genre && Array.isArray(genre)) {
        for (const existingGenre of genre) {
            const normalizedGenre = existingGenre.toLowerCase().replace(/[^a-z]/g, '');

            // Map existing genres to our categories
            const genreMapping = {
                'romance': 'romance',
                'fantasy': 'fantasy',
                'action': 'action',
                'drama': 'drama',
                'comedy': 'comedy',
                'thriller': 'thriller',
                'horror': 'horror',
                'scifi': 'sci_fi',
                'sliceoflife': 'slice_of_life',
                'historical': 'historical',
                'sports': 'sports',
                'mystery': 'mystery',
                'adventure': 'adventure',
                'psychological': 'psychological',
                'supernatural': 'supernatural',
                'school': 'school',
                'workplace': 'workplace',
                'family': 'family',
                'music': 'music',
                'food': 'food',
                'medical': 'medical',
                'legal': 'legal',
                'military': 'military',
                'political': 'political',
                'crime': 'crime',
                'western': 'western',
                'war': 'war',
                'postapocalyptic': 'post_apocalyptic',
                'isekai': 'isekai',
                'martialarts': 'martial_arts',
                'mecha': 'mecha',
                'idol': 'idol',
                'gaming': 'gaming',
                'cooking': 'cooking',
                'fashion': 'fashion',
                'art': 'art',
                'dance': 'dance',
                'photography': 'photography',
                'travel': 'travel',
                'nature': 'nature',
                'urban': 'urban',
                'rural': 'rural',
                'cyberpunk': 'cyberpunk',
                'steampunk': 'steampunk',
                'bl': 'bl',
                'gl': 'gl',
                'adult': 'adult',
                'children': 'children'
            };

            if (genreMapping[normalizedGenre]) {
                const mappedGenre = genreMapping[normalizedGenre];
                if (!genreScores[mappedGenre]) {
                    genreScores[mappedGenre] = 0.5; // Lower weight for existing genre tags
                }
            }
        }
    }

    // Final genre determination
    let primaryGenre = 'Not Specified';
    let secondaryGenres = [];
    let confidence = 0;

    if (sortedGenres.length > 0 && sortedGenres[0].score > 0) {
        primaryGenre = sortedGenres[0].genre;

        // Get secondary genres (excluding the primary genre if it appears in secondary)
        secondaryGenres = sortedGenres
            .filter(g => g.genre !== primaryGenre)
            .slice(0, 3)
            .map(g => g.genre);

        // Calculate confidence based on score difference
        if (sortedGenres.length > 1) {
            const scoreDiff = sortedGenres[0].score - sortedGenres[1].score;
            const totalScore = sortedGenres[0].score;
            confidence = Math.min(100, (scoreDiff / totalScore) * 100 + 50);
        } else {
            confidence = 70; // Default confidence for single genre
        }
    } else {
        // No genre detected, confidence is 0
        confidence = 0;
    }

    return {
        primaryGenre,
        secondaryGenres,
        genreScores,
        confidence: Math.round(confidence),
        analysis: {
            textAnalyzed: Object.values(fields).filter(Boolean).join(' ').length,
            fieldsUsed: Object.entries(fields).filter(([, text]) => text).map(([field]) => field),
            totalScore: Object.values(genreScores).reduce((sum, score) => sum + score, 0)
        }
    };
}

// Function to escape CSV values
function escapeCsvValue(value) {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

// Function to convert array to CSV-safe string
function arrayToCsvString(arr) {
    if (!arr || !Array.isArray(arr)) return '';
    return arr.join('; ');
}

async function extractAllTitlesGenreToCSV() {
    try {
        console.log('🔍 Fetching all titles from database for genre analysis...\n');

        // First, let's test the connection
        console.log('🔍 Testing database connection...');

        const { data: testData, error: testError } = await supabase
            .from('titles')
            .select('title_id, title_name_kr')
            .limit(1);

        if (testError) {
            console.error('❌ Database connection failed:', testError);
            return;
        }

        console.log('✅ Database connection successful');

        // Get total count of titles
        const { count, error: countError } = await supabase
            .from('titles')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('❌ Error getting title count:', countError);
            return;
        }

        console.log(`📊 Total titles in database: ${count}`);

        // Fetch all titles with basic fields
        const { data: titles, error } = await supabase
            .from('titles')
            .select(`
                title_id,
                title_name_kr,
                title_name_en,
                pitch,
                tags,
                genre,
                description,
                tagline,
                content_format,
                views,
                likes,
                rating,
                rating_count,
                created_at
            `)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        if (!titles || titles.length === 0) {
            console.log('❌ No titles found in the database');
            return;
        }

        console.log(`✅ Found ${titles.length} titles. Analyzing genres...\n`);

        const results = [];
        let processedCount = 0;

        // Analyze each title
        for (let i = 0; i < titles.length; i++) {
            const title = titles[i];
            processedCount++;

            // Show progress every 10 titles
            if (processedCount % 10 === 0 || processedCount === titles.length) {
                console.log(`📊 Processing: ${processedCount}/${titles.length} titles (${Math.round(processedCount / titles.length * 100)}%)`);
            }

            // Analyze genre
            const genreAnalysis = analyzeGenre(title);

            // Store results
            results.push({
                title_id: title.title_id,
                title_name_kr: title.title_name_kr || '',
                title_name_en: title.title_name_en || '',
                existing_genre: arrayToCsvString(title.genre),
                content_format: title.content_format || '',
                views: title.views || 0,
                likes: title.likes || 0,
                rating: title.rating || 0,
                rating_count: title.rating_count || 0,
                created_at: title.created_at || '',
                primary_genre: genreAnalysis.primaryGenre,
                secondary_genres: arrayToCsvString(genreAnalysis.secondaryGenres),
                confidence: genreAnalysis.confidence,
                total_score: genreAnalysis.analysis.totalScore,
                text_analyzed_chars: genreAnalysis.analysis.textAnalyzed,
                fields_used: arrayToCsvString(genreAnalysis.analysis.fieldsUsed),
                all_genre_scores: JSON.stringify(genreAnalysis.genreScores),
                description: title.description || '',
                tagline: title.tagline || '',
                tags: arrayToCsvString(title.tags),
                pitch: title.pitch || ''
            });
        }

        // Create CSV content
        const csvHeaders = [
            'Title ID',
            'Korean Title',
            'English Title',
            'Existing Genre',
            'Content Format',
            'Views',
            'Likes',
            'Rating',
            'Rating Count',
            'Created At',
            'Primary Genre',
            'Secondary Genres',
            'Confidence (%)',
            'Total Score',
            'Text Analyzed (chars)',
            'Fields Used',
            'All Genre Scores (JSON)',
            'Description',
            'Tagline',
            'Tags',
            'Pitch'
        ];

        const csvRows = results.map(result => [
            escapeCsvValue(result.title_id),
            escapeCsvValue(result.title_name_kr),
            escapeCsvValue(result.title_name_en),
            escapeCsvValue(result.existing_genre),
            escapeCsvValue(result.content_format),
            escapeCsvValue(result.views),
            escapeCsvValue(result.likes),
            escapeCsvValue(result.rating),
            escapeCsvValue(result.rating_count),
            escapeCsvValue(result.created_at),
            escapeCsvValue(result.primary_genre),
            escapeCsvValue(result.secondary_genres),
            escapeCsvValue(result.confidence),
            escapeCsvValue(result.total_score),
            escapeCsvValue(result.text_analyzed_chars),
            escapeCsvValue(result.fields_used),
            escapeCsvValue(result.all_genre_scores),
            escapeCsvValue(result.description),
            escapeCsvValue(result.tagline),
            escapeCsvValue(result.tags),
            escapeCsvValue(result.pitch)
        ]);

        const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.join(','))
            .join('\n');

        // Save CSV file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `all_titles_genre_analysis_${timestamp}.csv`;

        fs.writeFileSync(filename, csvContent);

        // Generate summary statistics
        const genreStats = {};
        const existingGenreStats = {};
        let totalConfidence = 0;
        let titlesWithGenre = 0;

        results.forEach(result => {
            // Genre statistics
            const primaryGenre = result.primary_genre;
            genreStats[primaryGenre] = (genreStats[primaryGenre] || 0) + 1;

            // Existing genre statistics
            if (result.existing_genre) {
                const existingGenres = result.existing_genre.split('; ');
                existingGenres.forEach(genre => {
                    if (genre.trim()) {
                        existingGenreStats[genre.trim()] = (existingGenreStats[genre.trim()] || 0) + 1;
                    }
                });
            }

            // Confidence statistics
            if (result.primary_genre !== 'Not Specified') {
                totalConfidence += result.confidence;
                titlesWithGenre++;
            }
        });

        const avgConfidence = titlesWithGenre > 0 ? Math.round(totalConfidence / titlesWithGenre) : 0;

        // Save summary to separate file
        const summaryFilename = `genre_analysis_summary_${timestamp}.json`;
        const summary = {
            analysis_date: new Date().toISOString(),
            total_titles_analyzed: results.length,
            titles_with_detected_genre: titlesWithGenre,
            average_confidence: avgConfidence,
            genre_distribution: genreStats,
            existing_genre_distribution: existingGenreStats,
            top_genres: Object.entries(genreStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 15)
                .map(([genre, count]) => ({ genre, count, percentage: Math.round(count / results.length * 100) }))
        };

        fs.writeFileSync(summaryFilename, JSON.stringify(summary, null, 2));

        console.log('\n🎯 Genre Analysis Complete!');
        console.log(`💾 CSV results saved to: ${filename}`);
        console.log(`📊 Summary saved to: ${summaryFilename}`);
        console.log(`\n📈 Summary Statistics:`);
        console.log(`   - Total titles analyzed: ${results.length}`);
        console.log(`   - Titles with detected genre: ${titlesWithGenre}`);
        console.log(`   - Average confidence: ${avgConfidence}%`);
        console.log(`\n🏆 Top 10 Detected Genres:`);
        Object.entries(genreStats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .forEach(([genre, count], index) => {
                const percentage = Math.round(count / results.length * 100);
                console.log(`   ${index + 1}. ${genre}: ${count} titles (${percentage}%)`);
            });

        console.log('\n💡 Next Steps:');
        console.log('   - Review the CSV file for accuracy');
        console.log('   - Compare detected genres with existing genre tags');
        console.log('   - Update genre fields in your database');
        console.log('   - Use genres for filtering and recommendations');
        console.log('   - Consider manual review for titles with low confidence');

    } catch (error) {
        console.error('❌ Error analyzing titles:', error);
    }
}

// Run the analysis
extractAllTitlesGenreToCSV(); 