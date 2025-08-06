import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Enhanced tone analysis function
function analyzeTone(titleData) {
    const {
        title_name_kr,
        title_name_en,
        pitch,
        tags,
        genre,
        description,
        tagline
    } = titleData;

    // Define tone indicators with specific primary tones and broader secondary tones
    const primaryToneIndicators = {
        // Primary tones (only these 9 allowed)
        funny: ['funny', 'comedy', 'humorous', 'hilarious', 'witty', 'satire', 'parody', 'lighthearted', 'amusing', 'entertaining', 'playful', 'silly', 'gag', 'gags'],
        intense: ['intense', 'drama', 'tragic', 'emotional', 'serious', 'dark', 'melodrama', 'passionate', 'conflict', 'struggle', 'betrayal', 'revenge', 'dramatic'],
        romantic: ['romance', 'love', 'romantic', 'passionate', 'sweet', 'heartwarming', 'fluffy', 'relationship', 'dating', 'marriage', 'affection', 'chemistry'],
        suspenseful: ['suspense', 'mystery', 'thriller', 'enigmatic', 'puzzling', 'intriguing', 'secret', 'hidden', 'unknown', 'investigation', 'clue', 'suspicious'],
        exciting: ['exciting', 'action', 'adventure', 'thrilling', 'fast-paced', 'dynamic', 'battle', 'fight', 'chase', 'explosion', 'danger', 'heroic', 'action-packed'],
        quirky: ['quirky', 'whimsical', 'fantastical', 'magical', 'enchanting', 'dreamy', 'surreal', 'fantasy', 'supernatural', 'mystical', 'otherworldly', 'enchanted', 'weird', 'strange', 'peculiar'],
        inspirational: ['inspirational', 'thoughtful', 'philosophical', 'introspective', 'meditative', 'reflective', 'deep', 'meaningful', 'profound', 'contemplative', 'spiritual', 'motivational', 'uplifting'],
        adventurous: ['adventurous', 'adventure', 'exploration', 'journey', 'quest', 'discovery', 'expedition', 'voyage', 'trek', 'odyssey'],
        heartwarming: ['heartwarming', 'heart-warming', 'warm', 'cozy', 'comforting', 'nurturing', 'gentle', 'kind', 'caring', 'tender', 'sweet', 'lovely']
    };

    // Secondary tone indicators (broader range for supplemental description)
    const secondaryToneIndicators = {
        // Emotional tones
        dramatic: ['drama', 'tragic', 'emotional', 'intense', 'serious', 'dark', 'melodrama', 'passionate', 'conflict', 'struggle', 'betrayal', 'revenge'],
        comedic: ['comedy', 'funny', 'humorous', 'hilarious', 'witty', 'satire', 'parody', 'lighthearted', 'amusing', 'entertaining', 'playful', 'silly'],
        romantic: ['romance', 'love', 'romantic', 'passionate', 'sweet', 'heartwarming', 'fluffy', 'relationship', 'dating', 'marriage', 'affection', 'chemistry'],
        mysterious: ['mystery', 'suspense', 'thriller', 'enigmatic', 'puzzling', 'intriguing', 'secret', 'hidden', 'unknown', 'investigation', 'clue', 'suspicious'],
        dark: ['dark', 'gritty', 'grim', 'bleak', 'disturbing', 'horror', 'macabre', 'violent', 'brutal', 'sinister', 'evil', 'corruption'],
        light: ['light', 'bright', 'cheerful', 'uplifting', 'positive', 'optimistic', 'happy', 'joyful', 'sunny', 'warm', 'friendly', 'hopeful'],

        // Narrative tones
        action_packed: ['action', 'adventure', 'exciting', 'thrilling', 'fast-paced', 'dynamic', 'battle', 'fight', 'chase', 'explosion', 'danger', 'heroic'],
        contemplative: ['thoughtful', 'philosophical', 'introspective', 'meditative', 'reflective', 'deep', 'meaningful', 'profound', 'contemplative', 'spiritual'],
        whimsical: ['whimsical', 'fantastical', 'magical', 'enchanting', 'dreamy', 'surreal', 'fantasy', 'supernatural', 'mystical', 'otherworldly', 'enchanted'],
        realistic: ['realistic', 'grounded', 'authentic', 'natural', 'everyday', 'slice of life', 'ordinary', 'normal', 'real', 'genuine', 'honest'],

        // Mood tones
        melancholic: ['melancholic', 'sad', 'nostalgic', 'bittersweet', 'yearning', 'longing', 'lonely', 'depressed', 'sorrowful', 'mournful', 'regretful'],
        energetic: ['energetic', 'vibrant', 'lively', 'dynamic', 'spirited', 'enthusiastic', 'energetic', 'powerful', 'strong', 'active', 'motivated'],
        calm: ['calm', 'peaceful', 'serene', 'tranquil', 'gentle', 'soothing', 'quiet', 'relaxed', 'easygoing', 'mellow', 'soft'],
        tense: ['tense', 'anxious', 'stressful', 'pressured', 'strained', 'conflicted', 'nervous', 'worried', 'fearful', 'uncomfortable', 'strained'],

        // Additional specific tones
        rebellious: ['rebel', 'disobey', 'defy', 'resist', 'challenge', 'oppose', 'dare', 'bold', 'brave', 'courageous', 'defiant'],
        sophisticated: ['elegant', 'refined', 'sophisticated', 'classy', 'luxurious', 'prestigious', 'high-class', 'noble', 'aristocratic'],
        playful: ['playful', 'fun', 'entertaining', 'amusing', 'delightful', 'charming', 'cute', 'adorable', 'sweet'],
        nostalgic: ['nostalgic', 'retro', 'vintage', 'old-fashioned', 'classic', 'timeless'],
        mysterious: ['mysterious', 'enigmatic', 'puzzling', 'curious', 'strange', 'unusual', 'peculiar', 'odd', 'weird'],
        emotional: ['emotional', 'sentimental', 'touching', 'moving', 'affecting', 'stirring'],
        thrilling: ['thrilling', 'exciting', 'adrenaline', 'rush', 'pulse-pounding', 'edge-of-seat'],
        magical: ['magical', 'enchanted', 'spellbinding', 'bewitching', 'charming', 'enchanting'],
        cozy: ['cozy', 'comfortable', 'snug', 'warm', 'inviting', 'welcoming'],
        empowering: ['empowering', 'strong', 'confident', 'determined', 'resilient', 'courageous']
    };

    // Analyze text for tone indicators with weighted scoring
    const primaryToneScores = {};
    const secondaryToneScores = {};

    // Define field weights (higher weight = more important for tone)
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

        // Analyze primary tones
        for (const [tone, indicators] of Object.entries(primaryToneIndicators)) {
            let fieldScore = 0;

            for (const indicator of indicators) {
                const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
                const foundMatches = fieldTextLower.match(regex);
                if (foundMatches) {
                    fieldScore += foundMatches.length * weight;
                }
            }

            if (fieldScore > 0) {
                primaryToneScores[tone] = (primaryToneScores[tone] || 0) + fieldScore;
            }
        }

        // Analyze secondary tones
        for (const [tone, indicators] of Object.entries(secondaryToneIndicators)) {
            let fieldScore = 0;

            for (const indicator of indicators) {
                const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
                const foundMatches = fieldTextLower.match(regex);
                if (foundMatches) {
                    fieldScore += foundMatches.length * weight;
                }
            }

            if (fieldScore > 0) {
                secondaryToneScores[tone] = (secondaryToneScores[tone] || 0) + fieldScore;
            }
        }
    }

    // Get top primary tones
    const sortedPrimaryTones = Object.entries(primaryToneScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([tone, score]) => ({ tone, score }));

    // Get top secondary tones
    const sortedSecondaryTones = Object.entries(secondaryToneScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tone, score]) => ({ tone, score }));

    // Additional analysis based on genre patterns for primary tones
    const genrePrimaryToneMapping = {
        'romance': ['romantic'],
        'fantasy': ['quirky'],
        'action': ['exciting'],
        'drama': ['intense'],
        'comedy': ['funny'],
        'thriller': ['suspenseful'],
        'horror': ['intense'],
        'slice_of_life': ['heartwarming'],
        'historical': ['inspirational']
    };

    // Add genre-based primary tone suggestions
    if (genre && Array.isArray(genre)) {
        for (const g of genre) {
            if (genrePrimaryToneMapping[g.toLowerCase()]) {
                for (const suggestedTone of genrePrimaryToneMapping[g.toLowerCase()]) {
                    if (!primaryToneScores[suggestedTone]) {
                        primaryToneScores[suggestedTone] = 0.5; // Lower weight for genre-based suggestions
                    }
                }
            }
        }
    }

    // Final tone determination
    let primaryTone = 'Not Specified';
    let secondaryTones = [];
    let confidence = 0;

    if (sortedPrimaryTones.length > 0 && sortedPrimaryTones[0].score > 0) {
        primaryTone = sortedPrimaryTones[0].tone;

        // Get secondary tones (excluding the primary tone if it appears in secondary)
        secondaryTones = sortedSecondaryTones
            .filter(t => t.tone !== primaryTone)
            .slice(0, 3)
            .map(t => t.tone);

        // Calculate confidence based on score difference
        if (sortedPrimaryTones.length > 1) {
            const scoreDiff = sortedPrimaryTones[0].score - sortedPrimaryTones[1].score;
            const totalScore = sortedPrimaryTones[0].score;
            confidence = Math.min(100, (scoreDiff / totalScore) * 100 + 50);
        } else {
            confidence = 70; // Default confidence for single tone
        }
    } else {
        // No primary tone detected, confidence is 0
        confidence = 0;
    }

    return {
        primaryTone,
        secondaryTones,
        primaryToneScores,
        secondaryToneScores,
        confidence: Math.round(confidence),
        analysis: {
            textAnalyzed: Object.values(fields).filter(Boolean).join(' ').length,
            fieldsUsed: Object.entries(fields).filter(([, text]) => text).map(([field]) => field),
            totalScore: Object.values(primaryToneScores).reduce((sum, score) => sum + score, 0) +
                Object.values(secondaryToneScores).reduce((sum, score) => sum + score, 0)
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

async function extractAllTitlesToneToCSV() {
    try {
        console.log('🔍 Fetching all titles from database...\n');

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

        console.log(`✅ Found ${titles.length} titles. Analyzing tones...\n`);

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

            // Analyze tone
            const toneAnalysis = analyzeTone(title);

            // Store results
            results.push({
                title_id: title.title_id,
                title_name_kr: title.title_name_kr || '',
                title_name_en: title.title_name_en || '',
                genre: arrayToCsvString(title.genre),
                content_format: title.content_format || '',
                views: title.views || 0,
                likes: title.likes || 0,
                rating: title.rating || 0,
                rating_count: title.rating_count || 0,
                created_at: title.created_at || '',
                primary_tone: toneAnalysis.primaryTone,
                secondary_tones: arrayToCsvString(toneAnalysis.secondaryTones),
                confidence: toneAnalysis.confidence,
                total_score: toneAnalysis.analysis.totalScore,
                text_analyzed_chars: toneAnalysis.analysis.textAnalyzed,
                fields_used: arrayToCsvString(toneAnalysis.analysis.fieldsUsed),
                all_tone_scores: JSON.stringify({
                    primary: toneAnalysis.primaryToneScores,
                    secondary: toneAnalysis.secondaryToneScores
                }),
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
            'Genre',
            'Content Format',
            'Views',
            'Likes',
            'Rating',
            'Rating Count',
            'Created At',
            'Primary Tone',
            'Secondary Tones',
            'Confidence (%)',
            'Total Score',
            'Text Analyzed (chars)',
            'Fields Used',
            'All Tone Scores (JSON)',
            'Description',
            'Tagline',
            'Tags',
            'Pitch'
        ];

        const csvRows = results.map(result => [
            escapeCsvValue(result.title_id),
            escapeCsvValue(result.title_name_kr),
            escapeCsvValue(result.title_name_en),
            escapeCsvValue(result.genre),
            escapeCsvValue(result.content_format),
            escapeCsvValue(result.views),
            escapeCsvValue(result.likes),
            escapeCsvValue(result.rating),
            escapeCsvValue(result.rating_count),
            escapeCsvValue(result.created_at),
            escapeCsvValue(result.primary_tone),
            escapeCsvValue(result.secondary_tones),
            escapeCsvValue(result.confidence),
            escapeCsvValue(result.total_score),
            escapeCsvValue(result.text_analyzed_chars),
            escapeCsvValue(result.fields_used),
            escapeCsvValue(result.all_tone_scores),
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
        const filename = `all_titles_tone_analysis_${timestamp}.csv`;

        fs.writeFileSync(filename, csvContent);

        // Generate summary statistics
        const toneStats = {};
        const genreStats = {};
        let totalConfidence = 0;
        let titlesWithTone = 0;

        results.forEach(result => {
            // Tone statistics
            const primaryTone = result.primary_tone;
            toneStats[primaryTone] = (toneStats[primaryTone] || 0) + 1;

            // Genre statistics
            if (result.genre) {
                const genres = result.genre.split('; ');
                genres.forEach(genre => {
                    if (genre.trim()) {
                        genreStats[genre.trim()] = (genreStats[genre.trim()] || 0) + 1;
                    }
                });
            }

            // Confidence statistics
            if (result.primary_tone !== 'neutral') {
                totalConfidence += result.confidence;
                titlesWithTone++;
            }
        });

        const avgConfidence = titlesWithTone > 0 ? Math.round(totalConfidence / titlesWithTone) : 0;

        // Save summary to separate file
        const summaryFilename = `tone_analysis_summary_${timestamp}.json`;
        const summary = {
            analysis_date: new Date().toISOString(),
            total_titles_analyzed: results.length,
            titles_with_detected_tone: titlesWithTone,
            average_confidence: avgConfidence,
            tone_distribution: toneStats,
            genre_distribution: genreStats,
            top_tones: Object.entries(toneStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([tone, count]) => ({ tone, count, percentage: Math.round(count / results.length * 100) }))
        };

        fs.writeFileSync(summaryFilename, JSON.stringify(summary, null, 2));

        console.log('\n🎯 Tone Analysis Complete!');
        console.log(`💾 CSV results saved to: ${filename}`);
        console.log(`📊 Summary saved to: ${summaryFilename}`);
        console.log(`\n📈 Summary Statistics:`);
        console.log(`   - Total titles analyzed: ${results.length}`);
        console.log(`   - Titles with detected tone: ${titlesWithTone}`);
        console.log(`   - Average confidence: ${avgConfidence}%`);
        console.log(`\n🏆 Top 5 Detected Tones:`);
        Object.entries(toneStats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .forEach(([tone, count], index) => {
                const percentage = Math.round(count / results.length * 100);
                console.log(`   ${index + 1}. ${tone}: ${count} titles (${percentage}%)`);
            });

        console.log('\n💡 Next Steps:');
        console.log('   - Review the CSV file for accuracy');
        console.log('   - Update the tone field in your database');
        console.log('   - Use tones for filtering and recommendations');
        console.log('   - Consider manual review for titles with low confidence');

    } catch (error) {
        console.error('❌ Error analyzing titles:', error);
    }
}

// Run the analysis
extractAllTitlesToneToCSV(); 