"""
Book Recommendation ML API Service
Production-ready Flask API for serving book recommendations
"""

import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import traceback
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class BookRecommendationModel:
    def __init__(self):
        self.vectorizer = None
        self.tfidf_matrix = None
        self.books_df = None
        self.model_loaded = False
        
    def load_model(self, model_path='models/'):
        """Load the trained model and data"""
        try:
            # Load the books dataset
            books_path = os.path.join(model_path, 'books_data.csv')
            if os.path.exists(books_path):
                self.books_df = pd.read_csv(books_path)
                logger.info(f"Loaded {len(self.books_df)} books from dataset")
            else:
                # Create sample data if no dataset exists
                self.books_df = self._create_sample_data()
                logger.info("Using sample book data")
            
            # Load or create TF-IDF vectorizer
            vectorizer_path = os.path.join(model_path, 'tfidf_vectorizer.pkl')
            if os.path.exists(vectorizer_path):
                with open(vectorizer_path, 'rb') as f:
                    self.vectorizer = pickle.load(f)
                logger.info("Loaded pre-trained TF-IDF vectorizer")
            else:
                self._train_vectorizer()
                logger.info("Created new TF-IDF vectorizer")
            
            # Load or create TF-IDF matrix
            matrix_path = os.path.join(model_path, 'tfidf_matrix.pkl')
            if os.path.exists(matrix_path):
                with open(matrix_path, 'rb') as f:
                    self.tfidf_matrix = pickle.load(f)
                logger.info("Loaded pre-computed TF-IDF matrix")
            else:
                self._compute_tfidf_matrix()
                logger.info("Computed new TF-IDF matrix")
            
            self.model_loaded = True
            logger.info("Model loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    
    def _create_sample_data(self):
        """Create sample book data for demonstration"""
        sample_books = [
            {
                'title': 'The Great Gatsby',
                'author': 'F. Scott Fitzgerald',
                'genre': 'Classic Literature',
                'description': 'A classic American novel about the Jazz Age and the American Dream',
                'rating': 4.2,
                'year': 1925
            },
            {
                'title': 'To Kill a Mockingbird',
                'author': 'Harper Lee',
                'genre': 'Classic Literature',
                'description': 'A gripping tale of racial injustice and childhood innocence',
                'rating': 4.5,
                'year': 1960
            },
            {
                'title': '1984',
                'author': 'George Orwell',
                'genre': 'Dystopian Fiction',
                'description': 'A dystopian social science fiction novel about totalitarian control',
                'rating': 4.4,
                'year': 1949
            },
            {
                'title': 'Pride and Prejudice',
                'author': 'Jane Austen',
                'genre': 'Romance',
                'description': 'A romantic novel about manners, upbringing, morality, and marriage',
                'rating': 4.3,
                'year': 1813
            },
            {
                'title': 'The Catcher in the Rye',
                'author': 'J.D. Salinger',
                'genre': 'Coming of Age',
                'description': 'A controversial novel about teenage rebellion and alienation',
                'rating': 3.8,
                'year': 1951
            }
        ]
        
        return pd.DataFrame(sample_books)
    
    def _train_vectorizer(self):
        """Train TF-IDF vectorizer on book descriptions"""
        # Combine relevant text features
        self.books_df['combined_features'] = (
            self.books_df['title'].fillna('') + ' ' +
            self.books_df['author'].fillna('') + ' ' +
            self.books_df['genre'].fillna('') + ' ' +
            self.books_df['description'].fillna('')
        )
        
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.8
        )
        
        self.vectorizer.fit(self.books_df['combined_features'])
    
    def _compute_tfidf_matrix(self):
        """Compute TF-IDF matrix for all books"""
        if 'combined_features' not in self.books_df.columns:
            self.books_df['combined_features'] = (
                self.books_df['title'].fillna('') + ' ' +
                self.books_df['author'].fillna('') + ' ' +
                self.books_df['genre'].fillna('') + ' ' +
                self.books_df['description'].fillna('')
            )
        
        self.tfidf_matrix = self.vectorizer.transform(self.books_df['combined_features'])
    
    def get_recommendations(self, query, num_recommendations=10):
        """Get book recommendations based on query"""
        if not self.model_loaded:
            raise Exception("Model not loaded")
        
        try:
            # Transform query using the same vectorizer
            query_vector = self.vectorizer.transform([query])
            
            # Calculate cosine similarity
            similarity_scores = cosine_similarity(query_vector, self.tfidf_matrix).flatten()
            
            # Get top recommendations
            top_indices = similarity_scores.argsort()[-num_recommendations:][::-1]
            
            recommendations = []
            for idx in top_indices:
                if similarity_scores[idx] > 0.01:  # Minimum similarity threshold
                    book = self.books_df.iloc[idx].to_dict()
                    book['similarity'] = float(similarity_scores[idx])
                    book['cover'] = self._get_book_cover(book['title'])
                    recommendations.append(book)
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting recommendations: {str(e)}")
            raise
    
    def _get_book_cover(self, title):
        """Get book cover URL (placeholder implementation)"""
        # In production, you'd integrate with a book cover API
        cover_urls = [
            "https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop",
            "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop",
            "https://images.pexels.com/photos/1130641/pexels-photo-1130641.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop",
            "https://images.pexels.com/photos/1130623/pexels-photo-1130623.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop"
        ]
        return cover_urls[hash(title) % len(cover_urls)]

# Initialize model
model = BookRecommendationModel()

@app.before_first_request
def load_model():
    """Load model before first request"""
    try:
        model.load_model()
        logger.info("Model loaded successfully on startup")
    except Exception as e:
        logger.error(f"Failed to load model on startup: {str(e)}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model.model_loaded,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/recommendations', methods=['POST'])
def get_recommendations():
    """Get book recommendations endpoint"""
    try:
        # Validate request
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
        
        data = request.get_json()
        query = data.get('query', '').strip()
        
        if not query:
            return jsonify({'error': 'Query parameter is required'}), 400
        
        if len(query) < 2:
            return jsonify({'error': 'Query must be at least 2 characters long'}), 400
        
        # Get preferences
        preferences = data.get('preferences', {})
        num_recommendations = min(preferences.get('maxResults', 10), 20)  # Cap at 20
        
        # Get recommendations
        recommendations = model.get_recommendations(query, num_recommendations)
        
        # Apply filters if specified
        if preferences.get('minRating'):
            min_rating = float(preferences['minRating'])
            recommendations = [r for r in recommendations if r.get('rating', 0) >= min_rating]
        
        if preferences.get('genres'):
            preferred_genres = [g.lower() for g in preferences['genres']]
            recommendations = [r for r in recommendations 
                             if any(genre.lower() in r.get('genre', '').lower() 
                                   for genre in preferred_genres)]
        
        return jsonify({
            'success': True,
            'query': query,
            'recommendations': recommendations,
            'total_results': len(recommendations),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in recommendations endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/batch_recommendations', methods=['POST'])
def batch_recommendations():
    """Batch recommendations endpoint"""
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
        
        data = request.get_json()
        queries = data.get('queries', [])
        
        if not queries or not isinstance(queries, list):
            return jsonify({'error': 'Queries parameter must be a non-empty list'}), 400
        
        if len(queries) > 10:  # Limit batch size
            return jsonify({'error': 'Maximum 10 queries per batch'}), 400
        
        results = []
        for query in queries:
            if isinstance(query, str) and len(query.strip()) >= 2:
                recommendations = model.get_recommendations(query.strip(), 5)
                results.append({
                    'query': query,
                    'recommendations': recommendations
                })
            else:
                results.append({
                    'query': query,
                    'error': 'Invalid query'
                })
        
        return jsonify({
            'success': True,
            'results': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in batch recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)