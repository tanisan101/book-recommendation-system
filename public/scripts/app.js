/**
 * Main Application Logic
 * Handles UI interactions and coordinates between API and model integration
 */

class BookDiscoveryApp {
    constructor() {
        this.currentQuery = '';
        this.currentResults = [];
        this.isLoading = false;
        
        // DOM elements
        this.elements = {
            searchForm: document.getElementById('searchForm'),
            searchInput: document.getElementById('searchInput'),
            searchButton: document.getElementById('searchButton'),
            searchError: document.getElementById('searchError'),
            loadingSection: document.getElementById('loadingSection'),
            resultsSection: document.getElementById('resultsSection'),
            resultsGrid: document.getElementById('resultsGrid'),
            resultsSubtitle: document.getElementById('resultsSubtitle'),
            emptyState: document.getElementById('emptyState')
        };
        
        this.initializeEventListeners();
        this.initializeExampleTags();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Search form submission
        this.elements.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        // Real-time input validation
        this.elements.searchInput.addEventListener('input', (e) => {
            this.validateInput(e.target.value);
        });

        // Clear error on focus
        this.elements.searchInput.addEventListener('focus', () => {
            this.hideError();
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });
    }

    /**
     * Initialize example tag functionality
     */
    initializeExampleTags() {
        const exampleTags = document.querySelectorAll('.example-tag');
        exampleTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const searchQuery = tag.dataset.search;
                this.elements.searchInput.value = searchQuery;
                this.handleSearch();
            });
        });
    }

    /**
     * Handle search form submission
     */
    async handleSearch() {
        const query = this.elements.searchInput.value.trim();
        
        if (!this.validateInput(query)) {
            return;
        }

        this.currentQuery = query;
        this.setLoadingState(true);
        this.hideError();

        try {
            // Preprocess query using model integration
            const processedQuery = window.modelIntegration.preprocessQuery(query);
            
            // Get recommendations from API
            const response = await window.bookAPI.getRecommendations(query);
            
            if (response.success && response.recommendations) {
                // Post-process results
                const enhancedResults = window.modelIntegration.postProcessResults(
                    response.recommendations, 
                    processedQuery
                );
                
                this.displayResults(enhancedResults, query);
                this.trackSearchEvent(query, enhancedResults.length);
            } else {
                throw new Error('No recommendations found');
            }
            
        } catch (error) {
            console.error('Search error:', error);
            this.showError(error.message);
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Validate search input
     * @param {string} value 
     * @returns {boolean}
     */
    validateInput(value) {
        if (!value || value.length < 2) {
            if (value.length > 0) {
                this.showError('Please enter at least 2 characters');
            }
            return false;
        }
        
        if (value.length > 200) {
            this.showError('Search query is too long (max 200 characters)');
            return false;
        }
        
        this.hideError();
        return true;
    }

    /**
     * Set loading state
     * @param {boolean} loading 
     */
    setLoadingState(loading) {
        this.isLoading = loading;
        
        // Update button state
        this.elements.searchButton.disabled = loading;
        const buttonText = this.elements.searchButton.querySelector('.search-button-text');
        buttonText.textContent = loading ? 'Searching...' : 'Find Books';
        
        // Show/hide sections
        this.elements.loadingSection.style.display = loading ? 'block' : 'none';
        this.elements.resultsSection.style.display = loading ? 'none' : 'block';
        this.elements.emptyState.style.display = loading ? 'none' : 'block';
        
        if (loading) {
            this.elements.emptyState.style.display = 'none';
            this.elements.resultsSection.style.display = 'none';
        }
    }

    /**
     * Display search results
     * @param {Array} results 
     * @param {string} query 
     */
    displayResults(results, query) {
        this.currentResults = results;
        
        // Update results header
        this.elements.resultsSubtitle.textContent = 
            `Found ${results.length} book${results.length !== 1 ? 's' : ''} for "${query}"`;
        
        // Clear previous results
        this.elements.resultsGrid.innerHTML = '';
        
        // Create book cards
        results.forEach((book, index) => {
            const bookCard = this.createBookCard(book, index);
            this.elements.resultsGrid.appendChild(bookCard);
        });
        
        // Show results section
        this.elements.resultsSection.style.display = 'block';
        this.elements.emptyState.style.display = 'none';
        
        // Scroll to results
        this.elements.resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    /**
     * Create a book card element
     * @param {Object} book 
     * @param {number} index 
     * @returns {HTMLElement}
     */
    createBookCard(book, index) {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Book: ${book.title} by ${book.author}`);
        
        // Add animation delay
        card.style.animationDelay = `${index * 0.1}s`;
        
        const similarityPercentage = Math.round((book.similarity || 0) * 100);
        const stars = this.generateStars(book.rating || 0);
        
        card.innerHTML = `
            <div class="book-cover-container">
                <img 
                    src="${book.cover}" 
                    alt="Cover of ${book.title}"
                    class="book-cover"
                    loading="lazy"
                    onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTgwSDEyMFYyMjBIMTUwVjE4MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHA+Qm9vayBDb3ZlcjwvcD4KPC9zdmc+'"
                >
                <div class="similarity-badge">${similarityPercentage}% match</div>
            </div>
            <div class="book-content">
                <h3 class="book-title">${this.escapeHtml(book.title)}</h3>
                <p class="book-author">by ${this.escapeHtml(book.author)}</p>
                <span class="book-genre">${this.escapeHtml(book.genre || 'Fiction')}</span>
                <p class="book-description">${this.escapeHtml(book.description)}</p>
                <div class="book-rating">
                    <span class="rating-stars">${stars}</span>
                    <span>${book.rating || 'N/A'}</span>
                </div>
            </div>
        `;
        
        // Add click handler for book details
        card.addEventListener('click', () => {
            this.showBookDetails(book);
        });
        
        // Add keyboard support
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.showBookDetails(book);
            }
        });
        
        return card;
    }

    /**
     * Generate star rating display
     * @param {number} rating 
     * @returns {string}
     */
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }

    /**
     * Show book details (placeholder for future modal/page)
     * @param {Object} book 
     */
    showBookDetails(book) {
        // For now, just log the book details
        // In a real app, this would open a modal or navigate to a detail page
        console.log('Book details:', book);
        
        // Simple alert for demonstration
        alert(`${book.title} by ${book.author}\n\n${book.description}\n\nRating: ${book.rating || 'N/A'}`);
    }

    /**
     * Show error message
     * @param {string} message 
     */
    showError(message) {
        this.elements.searchError.textContent = message;
        this.elements.searchError.classList.add('show');
    }

    /**
     * Hide error message
     */
    hideError() {
        this.elements.searchError.classList.remove('show');
    }

    /**
     * Clear search and reset to initial state
     */
    clearSearch() {
        this.elements.searchInput.value = '';
        this.elements.resultsSection.style.display = 'none';
        this.elements.loadingSection.style.display = 'none';
        this.elements.emptyState.style.display = 'block';
        this.hideError();
        this.currentQuery = '';
        this.currentResults = [];
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text 
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Track search events for analytics
     * @param {string} query 
     * @param {number} resultCount 
     */
    trackSearchEvent(query, resultCount) {
        // In a real app, this would send data to analytics service
        console.log('Search tracked:', {
            query: query,
            resultCount: resultCount,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get app statistics
     * @returns {Object}
     */
    getStats() {
        return {
            currentQuery: this.currentQuery,
            resultCount: this.currentResults.length,
            isLoading: this.isLoading,
            cacheStats: window.bookAPI.getCacheStats(),
            modelStatus: window.modelIntegration.getModelStatus()
        };
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bookApp = new BookDiscoveryApp();
    console.log('Book Discovery Hub initialized successfully');
});

// Handle page visibility changes to pause/resume operations
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('App paused');
    } else {
        console.log('App resumed');
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('App is online');
});

window.addEventListener('offline', () => {
    console.log('App is offline');
    if (window.bookApp) {
        window.bookApp.showError('You are currently offline. Please check your internet connection.');
    }
});