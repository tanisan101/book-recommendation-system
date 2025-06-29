"""
Model Extractor Script
Extract and prepare your trained model from Google Colab notebook
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os

def extract_model_from_colab():
    """
    Extract your model from the Colab notebook
    Replace this with your actual model extraction logic
    """
    
    # Step 1: Load your dataset
    # Replace this with your actual data loading code from Colab
    print("Loading dataset...")
    
    # Example: If you have a CSV file
    # books_df = pd.read_csv('your_books_dataset.csv')
    
    # For demonstration, create sample data
    books_df = create_sample_dataset()
    
    # Step 2: Preprocess the data (same as in your Colab)
    print("Preprocessing data...")
    books_df = preprocess_books_data(books_df)
    
    # Step 3: Train/load your model
    print("Training model...")
    vectorizer, tfidf_matrix = train_recommendation_model(books_df)
    
    # Step 4: Save everything
    print("Saving model components...")
    save_model_components(books_df, vectorizer, tfidf_matrix)
    
    print("Model extraction completed!")

def create_sample_dataset():
    """Create sample dataset - replace with your actual data"""
    sample_data = [
        {
            'title': 'The Great Gatsby',
            'author': 'F. Scott Fitzgerald',
            'genre': 'Classic Literature',
            'description': 'A classic American novel about the Jazz Age and the American Dream. Set in the summer of 1922, it tells the story of Jay Gatsby and his obsession with Daisy Buchanan.',
            'rating': 4.2,
            'year': 1925,
            'isbn': '9780743273565'
        },
        {
            'title': 'To Kill a Mockingbird',
            'author': 'Harper Lee',
            'genre': 'Classic Literature',
            'description': 'A gripping tale of racial injustice and childhood innocence in the American South. The story follows Scout Finch as she grows up in a small Alabama town.',
            'rating': 4.5,
            'year': 1960,
            'isbn': '9780061120084'
        },
        {
            'title': '1984',
            'author': 'George Orwell',
            'genre': 'Dystopian Fiction',
            'description': 'A dystopian social science fiction novel about totalitarian control and surveillance. Winston Smith struggles against the oppressive regime of Big Brother.',
            'rating': 4.4,
            'year': 1949,
            'isbn': '9780451524935'
        },
        {
            'title': 'Pride and Prejudice',
            'author': 'Jane Austen',
            'genre': 'Romance',
            'description': 'A romantic novel about manners, upbringing, morality, and marriage in Georgian England. Elizabeth Bennet navigates love and social expectations.',
            'rating': 4.3,
            'year': 1813,
            'isbn': '9780141439518'
        },
        {
            'title': 'The Catcher in the Rye',
            'author': 'J.D. Salinger',
            'genre': 'Coming of Age',
            'description': 'A controversial novel about teenage rebellion and alienation. Holden Caulfield wanders New York City after being expelled from prep school.',
            'rating': 3.8,
            'year': 1951,
            'isbn': '9780316769174'
        },
        {
            'title': 'Harry Potter and the Philosopher\'s Stone',
            'author': 'J.K. Rowling',
            'genre': 'Fantasy',
            'description': 'A young wizard discovers his magical heritage and attends Hogwarts School of Witchcraft and Wizardry. The beginning of an epic fantasy series.',
            'rating': 4.7,
            'year': 1997,
            'isbn': '9780747532699'
        },
        {
            'title': 'The Lord of the Rings',
            'author': 'J.R.R. Tolkien',
            'genre': 'Fantasy',
            'description': 'An epic high fantasy novel about the quest to destroy the One Ring. Frodo Baggins and his companions journey through Middle-earth.',
            'rating': 4.6,
            'year': 1954,
            'isbn': '9780544003415'
        },
        {
            'title': 'The Hunger Games',
            'author': 'Suzanne Collins',
            'genre': 'Dystopian Fiction',
            'description': 'A dystopian novel about a televised fight to the death. Katniss Everdeen volunteers to take her sister\'s place in the deadly competition.',
            'rating': 4.1,
            'year': 2008,
            'isbn': '9780439023481'
        }
    ]
    
    return pd.DataFrame(sample_data)

def preprocess_books_data(books_df):
    """Preprocess the books data"""
    # Clean and prepare text data
    books_df['title'] = books_df['title'].fillna('')
    books_df['author'] = books_df['author'].fillna('')
    books_df['genre'] = books_df['genre'].fillna('')
    books_df['description'] = books_df['description'].fillna('')
    
    # Create combined features for similarity calculation
    books_df['combined_features'] = (
        books_df['title'] + ' ' +
        books_df['author'] + ' ' +
        books_df['genre'] + ' ' +
        books_df['description']
    )
    
    return books_df

def train_recommendation_model(books_df):
    """Train the recommendation model"""
    # Initialize TF-IDF Vectorizer
    vectorizer = TfidfVectorizer(
        max_features=5000,
        stop_words='english',
        ngram_range=(1, 2),
        min_df=1,
        max_df=0.8
    )
    
    # Fit and transform the combined features
    tfidf_matrix = vectorizer.fit_transform(books_df['combined_features'])
    
    return vectorizer, tfidf_matrix

def save_model_components(books_df, vectorizer, tfidf_matrix):
    """Save all model components"""
    # Create models directory
    os.makedirs('models', exist_ok=True)
    
    # Save the dataset
    books_df.to_csv('models/books_data.csv', index=False)
    print("✓ Saved books dataset")
    
    # Save the vectorizer
    with open('models/tfidf_vectorizer.pkl', 'wb') as f:
        pickle.dump(vectorizer, f)
    print("✓ Saved TF-IDF vectorizer")
    
    # Save the TF-IDF matrix
    with open('models/tfidf_matrix.pkl', 'wb') as f:
        pickle.dump(tfidf_matrix, f)
    print("✓ Saved TF-IDF matrix")

def test_model():
    """Test the saved model"""
    print("\nTesting saved model...")
    
    # Load components
    books_df = pd.read_csv('models/books_data.csv')
    
    with open('models/tfidf_vectorizer.pkl', 'rb') as f:
        vectorizer = pickle.load(f)
    
    with open('models/tfidf_matrix.pkl', 'rb') as f:
        tfidf_matrix = pickle.load(f)
    
    # Test query
    test_query = "fantasy adventure magic"
    query_vector = vectorizer.transform([test_query])
    similarity_scores = cosine_similarity(query_vector, tfidf_matrix).flatten()
    
    # Get top 3 recommendations
    top_indices = similarity_scores.argsort()[-3:][::-1]
    
    print(f"\nTop 3 recommendations for '{test_query}':")
    for i, idx in enumerate(top_indices, 1):
        book = books_df.iloc[idx]
        score = similarity_scores[idx]
        print(f"{i}. {book['title']} by {book['author']} (Score: {score:.3f})")

if __name__ == "__main__":
    extract_model_from_colab()
    test_model()