/**
 * ML Model Integration Module
 * Handles integration with the book recommendation ML model
 */

class ModelIntegration {
    constructor() {
        this.modelEndpoint = '/api/recommendations';
        this.isModelReady = false;
        this.modelVersion = '1.0.0';
        this.supportedFeatures = [
            'content-based-filtering',
            'collaborative-filtering',
            'hybrid-recommendations',
            'similarity-scoring'
        ];
    }

    /**
     * Initialize model connection and check status
     * @returns {Promise<boolean>}
     */
    async initializeModel() {
        try {
            console.log('Initializing ML model connection...');
            
            // In a real implementation, this would check model health
            // For now, we'll simulate model readiness
            await this.simulateModelLoad();
            
            this.isModelReady = true;
            console.log('ML model initialized successfully');
            return true;
            
        } catch (error) {
            console.error('Failed to initialize ML model:', error);
            this.isModelReady = false;
            return false;
        }
    }

    /**
     * Simulate model loading time
     * @returns {Promise<void>}
     */
    async simulateModelLoad() {
        return new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }

    /**
     * Process user query and prepare it for the ML model
     * @param {string} query - Raw user input
     * @returns {Object} Processed query object
     */
    preprocessQuery(query) {
        const processed = {
            originalQuery: query,
            cleanedQuery: this.cleanQuery(query),
            extractedFeatures: this.extractFeatures(query),
            queryType: this.determineQueryType(query),
            confidence: 0.8
        };

        console.log('Preprocessed query:', processed);
        return processed;
    }

    /**
     * Clean and normalize the user query
     * @param {string} query 
     * @returns {string}
     */
    cleanQuery(query) {
        return query
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ');
    }

    /**
     * Extract features from the query for better matching
     * @param {string} query 
     * @returns {Object}
     */
    extractFeatures(query) {
        const features = {
            genres: this.extractGenres(query),
            authors: this.extractAuthors(query),
            themes: this.extractThemes(query),
            keywords: this.extractKeywords(query)
        };

        return features;
    }

    /**
     * Extract potential genres from query
     * @param {string} query 
     * @returns {Array<string>}
     */
    extractGenres(query) {
        const genreKeywords = {
            'mystery': ['mystery', 'detective', 'crime', 'thriller', 'suspense'],
            'romance': ['romance', 'love', 'romantic', 'relationship'],
            'fantasy': ['fantasy', 'magic', 'wizard', 'dragon', 'medieval'],
            'sci-fi': ['science fiction', 'sci-fi', 'space', 'future', 'technology'],
            'historical': ['historical', 'history', 'period', 'war', 'ancient'],
            'horror': ['horror', 'scary', 'ghost', 'supernatural', 'dark'],
            'biography': ['biography', 'memoir', 'life story', 'autobiography'],
            'self-help': ['self-help', 'motivation', 'improvement', 'guide']
        };

        const foundGenres = [];
        const lowerQuery = query.toLowerCase();

        for (const [genre, keywords] of Object.entries(genreKeywords)) {
            if (keywords.some(keyword => lowerQuery.includes(keyword))) {
                foundGenres.push(genre);
            }
        }

        return foundGenres;
    }

    /**
     * Extract potential author names from query
     * @param {string} query 
     * @returns {Array<string>}
     */
    extractAuthors(query) {
        // This is a simplified implementation
        // In a real system, you'd use NER (Named Entity Recognition)
        const commonAuthorPatterns = [
            /by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
            /author\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
            /like\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g
        ];

        const authors = [];
        for (const pattern of commonAuthorPatterns) {
            const matches = [...query.matchAll(pattern)];
            authors.push(...matches.map(match => match[1]));
        }

        return [...new Set(authors)];
    }

    /**
     * Extract themes and topics from query
     * @param {string} query 
     * @returns {Array<string>}
     */
    extractThemes(query) {
        const themeKeywords = {
            'coming-of-age': ['growing up', 'teenager', 'youth', 'adolescent'],
            'family': ['family', 'parent', 'mother', 'father', 'sibling'],
            'friendship': ['friendship', 'friends', 'companion'],
            'adventure': ['adventure', 'journey', 'quest', 'travel'],
            'war': ['war', 'battle', 'conflict', 'military'],
            'love': ['love', 'romance', 'relationship', 'marriage'],
            'death': ['death', 'loss', 'grief', 'mourning'],
            'identity': ['identity', 'self-discovery', 'finding yourself']
        };

        const foundThemes = [];
        const lowerQuery = query.toLowerCase();

        for (const [theme, keywords] of Object.entries(themeKeywords)) {
            if (keywords.some(keyword => lowerQuery.includes(keyword))) {
                foundThemes.push(theme);
            }
        }

        return foundThemes;
    }

    /**
     * Extract important keywords from query
     * @param {string} query 
     * @returns {Array<string>}
     */
    extractKeywords(query) {
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
            'before', 'after', 'above', 'below', 'between', 'among', 'is', 'are',
            'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
            'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
            'must', 'can', 'like', 'similar', 'book', 'books', 'novel', 'story'
        ]);

        return query
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word))
            .slice(0, 10); // Limit to top 10 keywords
    }

    /**
     * Determine the type of query (title, author, genre, description)
     * @param {string} query 
     * @returns {string}
     */
    determineQueryType(query) {
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes('by ') || lowerQuery.includes('author')) {
            return 'author';
        }
        
        if (lowerQuery.includes('like ') || lowerQuery.includes('similar to')) {
            return 'similar';
        }
        
        if (this.extractGenres(query).length > 0) {
            return 'genre';
        }
        
        if (query.length < 30 && /^[A-Z]/.test(query)) {
            return 'title';
        }
        
        return 'description';
    }

    /**
     * Post-process model results to enhance recommendations
     * @param {Array} recommendations 
     * @param {Object} originalQuery 
     * @returns {Array}
     */
    postProcessResults(recommendations, originalQuery) {
        return recommendations.map(book => ({
            ...book,
            relevanceScore: this.calculateRelevanceScore(book, originalQuery),
            matchReasons: this.generateMatchReasons(book, originalQuery),
            confidence: this.calculateConfidence(book, originalQuery)
        }));
    }

    /**
     * Calculate relevance score based on query features
     * @param {Object} book 
     * @param {Object} query 
     * @returns {number}
     */
    calculateRelevanceScore(book, query) {
        let score = book.similarity || 0.5;
        
        // Boost score based on feature matches
        if (query.extractedFeatures.genres.some(genre => 
            book.genre && book.genre.toLowerCase().includes(genre))) {
            score += 0.1;
        }
        
        if (query.extractedFeatures.authors.some(author => 
            book.author && book.author.toLowerCase().includes(author.toLowerCase()))) {
            score += 0.15;
        }
        
        return Math.min(score, 1.0);
    }

    /**
     * Generate human-readable match reasons
     * @param {Object} book 
     * @param {Object} query 
     * @returns {Array<string>}
     */
    generateMatchReasons(book, query) {
        const reasons = [];
        
        if (book.similarity > 0.8) {
            reasons.push('High content similarity');
        }
        
        if (query.extractedFeatures.genres.some(genre => 
            book.genre && book.genre.toLowerCase().includes(genre))) {
            reasons.push('Matching genre');
        }
        
        if (book.rating > 4.5) {
            reasons.push('Highly rated');
        }
        
        return reasons;
    }

    /**
     * Calculate confidence in the recommendation
     * @param {Object} book 
     * @param {Object} query 
     * @returns {number}
     */
    calculateConfidence(book, query) {
        let confidence = 0.7; // Base confidence
        
        if (book.similarity > 0.8) confidence += 0.2;
        if (book.rating > 4.0) confidence += 0.1;
        if (query.extractedFeatures.genres.length > 0) confidence += 0.1;
        
        return Math.min(confidence, 1.0);
    }

    /**
     * Get model status and capabilities
     * @returns {Object}
     */
    getModelStatus() {
        return {
            isReady: this.isModelReady,
            version: this.modelVersion,
            supportedFeatures: this.supportedFeatures,
            lastUpdate: new Date().toISOString()
        };
    }
}

// Create global model integration instance
window.modelIntegration = new ModelIntegration();

// Initialize model when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.modelIntegration.initializeModel();
});