/**
 * Simple Content Validator
 * ONLY checks for gibberish and profanity - nothing else!
 */

// Common Tanglish words (so we don't flag them as gibberish)
const COMMON_TANGLISH_WORDS = [
    'amma', 'appa', 'anna', 'akka', 'thambi', 'thangachi', 'paati', 'thatha',
    'avan', 'aval', 'avanga', 'naan', 'naanga', 'nenga', 'neenga',
    'veedu', 'veetla', 'veetil', 'ooru', 'oor', 'school', 'college',
    'romba', 'rombave', 'konjam', 'chinna', 'periya', 'nalla', 'ketta',
    'paavam', 'kashta', 'kashtam', 'poor', 'rich', 'middle',
    'irukku', 'irukkan', 'irukkanga', 'irundha', 'illa', 'illai',
    'panna', 'pannuvan', 'pannuvanga', 'sonna', 'sonnaru', 'sonnanga',
    'poga', 'poganum', 'vara', 'varanum', 'seiya', 'seiyanum',
    'enna', 'epdi', 'eppadi', 'yenna', 'yepdi', 'yeppadi',
    'anga', 'inga', 'enga', 'yenga',
    'padikka', 'padikkanum', 'padichitu', 'velai', 'work', 'job',
    'panam', 'kaasu', 'kadai', 'loan', 'kadhan', 'kadan',
];

// Profanity list (English + Tamil)
const PROFANITY_LIST = [
    // English
    'fuck', 'shit', 'damn', 'hell', 'ass', 'bitch', 'bastard',
    'dick', 'cock', 'pussy', 'cunt', 'motherfucker', 'asshole',
    'bullshit', 'piss', 'slut', 'whore', 'fag', 'nigger',

    // Tamil/Tanglish profanity
    'punda', 'pundai', 'oombu', 'otha', 'poda', 'podi',
    'loosu', 'naaye', 'paiya', 'koothi', 'sunni',
    'thevdiya', 'thevidiya', 'porukki', 'poriki'
];

/**
 * Check if text contains Tanglish words
 */
export const containsTanglish = (text) => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return COMMON_TANGLISH_WORDS.some(word =>
        new RegExp(`\\b${word}\\b`, 'i').test(lowerText)
    );
};

/**
 * Check if text contains profanity
 */
export const containsProfanity = (text) => {
    if (!text) return { hasProfanity: false, words: [] };

    const lowerText = text.toLowerCase();
    const foundWords = [];

    for (const word of PROFANITY_LIST) {
        const regex = new RegExp(`\\b${word}\\b|${word}`, 'gi');
        if (regex.test(lowerText)) {
            foundWords.push(word);
        }
    }

    return {
        hasProfanity: foundWords.length > 0,
        words: foundWords
    };
};

/**
 * Check if text is gibberish
 * ONLY checks for obvious patterns - very lenient!
 */
export const isGibberish = (text) => {
    if (!text || text.trim().length === 0) {
        return { isGibberish: false, reason: null };
    }

    const trimmedText = text.trim();
    const isTanglish = containsTanglish(trimmedText);

    // 1. Check for excessive repeated characters (e.g., "aaaaaaaaaa")
    if (/(.)\1{7,}/.test(trimmedText)) {
        return {
            isGibberish: true,
            reason: 'Contains too many repeated characters'
        };
    }

    // 2. Check for obvious keyboard mashing (e.g., "qwertyqwertyqwerty")
    if (/^[qwerty]{15,}$/i.test(trimmedText) || /^[asdf]{15,}$/i.test(trimmedText)) {
        return {
            isGibberish: true,
            reason: 'Appears to be keyboard mashing'
        };
    }

    // 3. Check for random character sequences (e.g., "ababckasdsjflksdal")
    // Only if it's NOT Tanglish and has very high consonant ratio
    if (!isTanglish) {
        const consonantRatio = (trimmedText.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length / trimmedText.length;
        if (consonantRatio > 0.9 && trimmedText.length > 15) {
            return {
                isGibberish: true,
                reason: 'Appears to be random typing'
            };
        }
    }

    // If we reach here, it's probably valid
    return { isGibberish: false, reason: null };
};

/**
 * Validate content - ONLY gibberish and profanity checks
 */
export const validateContent = (text, fieldName = 'This field') => {
    const errors = [];

    // Skip validation if empty (let required field validation handle that)
    if (!text || text.trim().length === 0) {
        return { isValid: true, errors: [] };
    }

    const trimmedText = text.trim();

    // Check 1: Profanity (highest priority)
    const profanityCheck = containsProfanity(trimmedText);
    if (profanityCheck.hasProfanity) {
        errors.push(`${fieldName} contains inappropriate language. Please use professional language.`);
    }

    // Check 2: Gibberish
    const gibberishCheck = isGibberish(trimmedText);
    if (gibberishCheck.isGibberish) {
        errors.push(`${fieldName}: ${gibberishCheck.reason}`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings: {
            hasProfanity: profanityCheck.hasProfanity,
            isGibberish: gibberishCheck.isGibberish
        }
    };
};

/**
 * Real-time validation - ONLY gibberish and profanity
 */
export const validateRealTime = (text) => {
    if (!text || text.trim().length === 0) {
        return null;
    }

    // Check profanity first (highest priority)
    const profanityCheck = containsProfanity(text);
    if (profanityCheck.hasProfanity) {
        return '⚠️ Inappropriate language detected';
    }

    // Check for obvious gibberish patterns
    if (/(.)\1{7,}/.test(text)) {
        return '⚠️ Too many repeated characters';
    }

    if (/^[qwerty]{15,}$/i.test(text) || /^[asdf]{15,}$/i.test(text)) {
        return '⚠️ Please type meaningful text';
    }

    return null;
};

/**
 * Sanitize text (remove extra spaces, trim)
 */
export const sanitizeText = (text) => {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
};

export default {
    containsTanglish,
    containsProfanity,
    isGibberish,
    validateContent,
    validateRealTime,
    sanitizeText,
    COMMON_TANGLISH_WORDS,
    PROFANITY_LIST
};
