# ML Service Setup Guide

## Quick Start

1. **Extract your model from Colab:**
   ```bash
   cd ml_service
   python model_extractor.py
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the ML service:**
   ```bash
   python app.py
   ```

## Integrating Your Colab Model

### Step 1: Replace Sample Data with Your Dataset

In `model_extractor.py`, replace the `create_sample_dataset()` function with code to load your actual dataset:

```python
def load_your_dataset():
    # Replace this with your actual data loading code
    books_df = pd.read_csv('your_books_dataset.csv')
    return books_df
```

### Step 2: Update Preprocessing

Modify the `preprocess_books_data()` function to match your Colab preprocessing:

```python
def preprocess_books_data(books_df):
    # Add your specific preprocessing steps here
    # Example: text cleaning, feature engineering, etc.
    return books_df
```

### Step 3: Update Model Training

In `train_recommendation_model()`, replace with your actual model training code:

```python
def train_recommendation_model(books_df):
    # Replace with your actual model training logic
    # This could be collaborative filtering, content-based, or hybrid
    return model_components
```

### Step 4: Update Recommendation Logic

In `app.py`, modify the `get_recommendations()` method in the `BookRecommendationModel` class to use your specific recommendation algorithm.

## API Endpoints

- `GET /health` - Health check
- `POST /recommendations` - Get recommendations for a single query
- `POST /batch_recommendations` - Get recommendations for multiple queries

## Environment Variables

- `PORT` - Service port (default: 5000)
- `DEBUG` - Enable debug mode (default: False)

## Deployment

### Using Docker:
```bash
docker build -t book-ml-service .
docker run -p 5000:5000 book-ml-service
```

### Using Gunicorn:
```bash
gunicorn --bind 0.0.0.0:5000 --workers 2 app:app
```