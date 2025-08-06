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

    // Define tone indicators with more nuanced keywords
    const toneIndicators = {
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
        playful: ['playful', 'fun', 'entertaining', 'amusing', 'delightful', 'charming', 'cute', 'adorable', 'sweet']
    };

    // Analyze text for tone indicators with weighted scoring
    const toneScores = {};
    const fieldAnalysis = {};

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
        fieldAnalysis[fieldName] = { text: fieldText, weight, score: 0 };

        for (const [tone, indicators] of Object.entries(toneIndicators)) {
            let fieldScore = 0;
            const matches = [];

            for (const indicator of indicators) {
                const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
                const foundMatches = fieldTextLower.match(regex);
                if (foundMatches) {
                    fieldScore += foundMatches.length * weight;
                    matches.push(...foundMatches);
                }
            }

            if (fieldScore > 0) {
                toneScores[tone] = (toneScores[tone] || 0) + fieldScore;
                if (!fieldAnalysis[fieldName].toneMatches) {
                    fieldAnalysis[fieldName].toneMatches = {};
                }
                fieldAnalysis[fieldName].toneMatches[tone] = { score: fieldScore, matches };
                fieldAnalysis[fieldName].score += fieldScore;
            }
        }
    }

    // Get top tones
    const sortedTones = Object.entries(toneScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tone, score]) => ({ tone, score }));

    // Additional analysis based on genre patterns
    const genreToneMapping = {
        'romance': ['romantic', 'sweet'],
        'fantasy': ['whimsical', 'magical'],
        'action': ['action_packed', 'energetic'],
        'drama': ['dramatic', 'emotional'],
        'comedy': ['comedic', 'lighthearted'],
        'thriller': ['mysterious', 'tense'],
        'horror': ['dark', 'disturbing'],
        'slice_of_life': ['realistic', 'calm'],
        'historical': ['contemplative', 'realistic']
    };

    // Add genre-based tone suggestions
    if (genre && Array.isArray(genre)) {
        for (const g of genre) {
            if (genreToneMapping[g.toLowerCase()]) {
                for (const suggestedTone of genreToneMapping[g.toLowerCase()]) {
                    if (!toneScores[suggestedTone]) {
                        toneScores[suggestedTone] = 0.5; // Lower weight for genre-based suggestions
                    }
                }
            }
        }
    }

    // Final tone determination
    let primaryTone = 'neutral';
    let secondaryTones = [];
    let confidence = 0;

    if (sortedTones.length > 0) {
        primaryTone = sortedTones[0].tone;
        secondaryTones = sortedTones.slice(1, 3).map(t => t.tone);

        // Calculate confidence based on score difference
        if (sortedTones.length > 1) {
            const scoreDiff = sortedTones[0].score - sortedTones[1].score;
            const totalScore = sortedTones[0].score;
            confidence = Math.min(100, (scoreDiff / totalScore) * 100 + 50);
        } else {
            confidence = 70; // Default confidence for single tone
        }
    }

    return {
        primaryTone,
        secondaryTones,
        toneScores,
        confidence: Math.round(confidence),
        fieldAnalysis,
        analysis: {
            textAnalyzed: Object.values(fields).filter(Boolean).join(' ').length,
            fieldsUsed: Object.entries(fields).filter(([, text]) => text).map(([field]) => field),
            totalScore: Object.values(toneScores).reduce((sum, score) => sum + score, 0)
        }
    };
}

async function extractTonesFromFirstFiveTitles() {
    try {
        console.log('🔍 Fetching first 5 titles from database...\n');

        // First, let's try to get just the basic fields to see what exists
        console.log('🔍 Testing database connection and available fields...');

        const { data: testData, error: testError } = await supabase
            .from('titles')
            .select('title_id, title_name_kr')
            .limit(1);

        if (testError) {
            console.error('❌ Database connection failed:', testError);
            return;
        }

        console.log('✅ Database connection successful');

        // Now fetch first 5 titles with basic fields
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
        rating_count
      `)
            .limit(5);

        if (error) {
            throw error;
        }

        if (!titles || titles.length === 0) {
            console.log('❌ No titles found in the database');
            return;
        }

        console.log(`✅ Found ${titles.length} titles. Analyzing tones...\n`);

        const results = [];

        // Analyze each title
        for (let i = 0; i < titles.length; i++) {
            const title = titles[i];
            console.log(`📖 Title ${i + 1}: ${title.title_name_kr || title.title_name_en || 'Untitled'}`);
            console.log(`   ID: ${title.title_id}`);

            if (title.title_name_en) {
                console.log(`   English: ${title.title_name_en}`);
            }

            // Analyze tone
            const toneAnalysis = analyzeTone(title);

            console.log(`   🎭 Primary Tone: ${toneAnalysis.primaryTone} (${toneAnalysis.confidence}% confidence)`);
            if (toneAnalysis.secondaryTones.length > 0) {
                console.log(`   🎭 Secondary Tones: ${toneAnalysis.secondaryTones.join(', ')}`);
            }

            console.log(`   📊 Analysis: Analyzed ${toneAnalysis.analysis.textAnalyzed} characters from fields: ${toneAnalysis.analysis.fieldsUsed.join(', ')}`);

            // Show top tone scores
            const topScores = Object.entries(toneAnalysis.toneScores)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5);

            if (topScores.length > 0) {
                console.log(`   📈 Top Tone Scores:`);
                topScores.forEach(([tone, score]) => {
                    console.log(`      - ${tone}: ${score.toFixed(2)}`);
                });
            }

            // Show key data fields
            console.log(`   📝 Key Data:`);
            if (title.pitch) {
                console.log(`      Pitch: ${title.pitch.substring(0, 100)}${title.pitch.length > 100 ? '...' : ''}`);
            }
            if (title.tags && title.tags.length > 0) {
                console.log(`      Tags: ${title.tags.join(', ')}`);
            }
            if (title.genre && (Array.isArray(title.genre) ? title.genre.length > 0 : title.genre)) {
                console.log(`      Genre: ${Array.isArray(title.genre) ? title.genre.join(', ') : title.genre}`);
            }

            // Show field analysis
            console.log(`   🔍 Field Analysis:`);
            Object.entries(toneAnalysis.fieldAnalysis).forEach(([field, analysis]) => {
                if (analysis.score > 0) {
                    console.log(`      ${field}: ${analysis.score.toFixed(2)} points`);
                    if (analysis.toneMatches) {
                        Object.entries(analysis.toneMatches).forEach(([tone, match]) => {
                            console.log(`        - ${tone}: ${match.score.toFixed(2)} (${match.matches.join(', ')})`);
                        });
                    }
                }
            });

            console.log(''); // Empty line for readability

            // Store results
            results.push({
                title_id: title.title_id,
                title_name_kr: title.title_name_kr,
                title_name_en: title.title_name_en,
                genre: title.genre,
                tone_analysis: toneAnalysis
            });
        }

        // Save results to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `tone_analysis_results_${timestamp}.json`;

        fs.writeFileSync(filename, JSON.stringify({
            analysis_date: new Date().toISOString(),
            total_titles_analyzed: results.length,
            results: results
        }, null, 2));

        console.log('🎯 Tone Analysis Complete!');
        console.log(`💾 Results saved to: ${filename}`);
        console.log('\n💡 Suggestions for improving tone detection:');
        console.log('   - Add more tone-specific keywords to the indicators');
        console.log('   - Consider context and word combinations');
        console.log('   - Weight different fields differently (e.g., synopsis vs tags)');
        console.log('   - Add sentiment analysis for more nuanced tone detection');
        console.log('   - Include character analysis and plot elements');
        console.log('   - Consider cultural context for Korean titles');

    } catch (error) {
        console.error('❌ Error analyzing titles:', error);
    }
}

// Run the analysis
extractTonesFromFirstFiveTitles(); 