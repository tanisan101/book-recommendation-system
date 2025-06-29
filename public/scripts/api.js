/**
 * API Integration Module
 * Handles all API calls and data fetching
 */

class BookAPI {
    constructor() {
        this.baseURL = '/api';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get book recommendations based on user query
     * @param {string} query - User search query
     * @param {Object} preferences - User preferences (optional)
     * @returns {Promise<Object>} API response with recommendations
     */
    async getRecommendations(query, preferences = {}) {
        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(query, preferences);
            const cachedResult = this.getFromCache(cacheKey);
            
            if (cachedResult) {
                console.log('Returning cached results for:', query);
                return cachedResult;
            }

            // Validate input
            if (!query || query.trim().length < 2) {
                throw new Error('Search query must be at least 2 characters long');
            }

            const requestBody = {
                query: query.trim(),
                preferences: {
                    genres: preferences.genres || [],
                    authors: preferences.authors || [],
                    minRating: preferences.minRating || 0,
                    maxResults: preferences.maxResults || 10,
                    ...preferences
                }
            };

            console.log('Fetching recommendations for:', query);

            const response = await fetch(`${this.baseURL}/recommendations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to get recommendations');
            }

            // Cache the successful result
            this.setCache(cacheKey, data);

            return data;

        } catch (error) {
            console.error('API Error:', error);
            
            // Return user-friendly error messages
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Unable to connect to the recommendation service. Please check your internet connection and try again.');
            }
            
            if (error.message.includes('timeout')) {
                throw new Error('The request took too long to complete. Please try again.');
            }

            throw error;
        }
    }

    /**
     * Generate cache key for request
     * @param {string} query 
     * @param {Object} preferences 
     * @returns {string}
     */
    generateCacheKey(query, preferences) {
        const key = `${query.toLowerCase()}_${JSON.stringify(preferences)}`;
        return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
    }

    /**
     * Get data from cache if not expired
     * @param {string} key 
     * @returns {Object|null}
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Store data in cache with timestamp
     * @param {string} key 
     * @param {Object} data 
     */
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });

        // Clean up old cache entries periodically
        if (this.cache.size > 50) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        this.cache.clear();
        console.log('Cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object}
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Create global API instance
window.bookAPI = new BookAPI();