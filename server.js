const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.example.com", ML_SERVICE_URL]
    }
  }
}));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(limiter);
app.use(express.static('public'));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check ML service health
    const mlHealthResponse = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000
    });
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        web: 'healthy',
        ml: mlHealthResponse.data.status || 'unknown'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'ML service unavailable'
    });
  }
});

// Book recommendations endpoint
app.post('/api/recommendations', async (req, res) => {
  try {
    const { query, preferences } = req.body;
    
    // Input validation
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query must be a string with at least 2 characters'
      });
    }
    
    if (query.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Query is too long (max 500 characters)'
      });
    }
    
    // Prepare request for ML service
    const mlRequest = {
      query: query.trim(),
      preferences: {
        genres: preferences?.genres || [],
        authors: preferences?.authors || [],
        minRating: preferences?.minRating || 0,
        maxResults: Math.min(preferences?.maxResults || 10, 20),
        ...preferences
      }
    };
    
    console.log(`Forwarding request to ML service: ${query}`);
    
    // Call ML service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/recommendations`, mlRequest, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Log successful request
    console.log(`ML service returned ${mlResponse.data.recommendations?.length || 0} recommendations`);
    
    // Return response
    res.json({
      success: true,
      query: query,
      recommendations: mlResponse.data.recommendations || [],
      totalResults: mlResponse.data.total_results || 0,
      timestamp: new Date().toISOString(),
      processingTime: mlResponse.headers['x-processing-time'] || 'unknown'
    });
    
  } catch (error) {
    console.error('Recommendations API error:', error.message);
    
    // Handle different types of errors
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'Recommendation service is temporarily unavailable',
        message: 'Please try again in a few moments'
      });
    }
    
    if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        error: error.response.data.error || 'Invalid request',
        message: error.response.data.message || 'Please check your input'
      });
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable',
        message: 'Please try again later'
      });
    }
    
    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request'
    });
  }
});

// Batch recommendations endpoint
app.post('/api/batch-recommendations', async (req, res) => {
  try {
    const { queries } = req.body;
    
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Queries must be a non-empty array'
      });
    }
    
    if (queries.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 queries allowed per batch request'
      });
    }
    
    // Forward to ML service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/batch_recommendations`, {
      queries: queries
    }, {
      timeout: 60000, // 60 second timeout for batch requests
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      success: true,
      results: mlResponse.data.results || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Batch recommendations error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process batch recommendations'
    });
  }
});

// Fallback to mock data if ML service is unavailable
app.post('/api/recommendations/fallback', async (req, res) => {
  const { query } = req.body;
  
  console.log('Using fallback recommendations for:', query);
  
  // Mock recommendations data
  const mockRecommendations = [
    {
      id: 1,
      title: "The Seven Husbands of Evelyn Hugo",
      author: "Taylor Jenkins Reid",
      description: "A reclusive Hollywood icon finally tells her story to a young journalist, revealing secrets about her glamorous and scandalous life.",
      cover: "https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop",
      rating: 4.8,
      genre: "Historical Fiction",
      similarity: 0.92
    },
    {
      id: 2,
      title: "Where the Crawdads Sing",
      author: "Delia Owens",
      description: "A mystery and coming-of-age story set in the marshlands of North Carolina, following a young woman who raised herself in isolation.",
      cover: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop",
      rating: 4.6,
      genre: "Mystery",
      similarity: 0.89
    },
    {
      id: 3,
      title: "The Midnight Library",
      author: "Matt Haig",
      description: "A philosophical novel about a library that exists between life and death, where each book represents a different life you could have lived.",
      cover: "https://images.pexels.com/photos/1130641/pexels-photo-1130641.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop",
      rating: 4.5,
      genre: "Philosophy",
      similarity: 0.87
    }
  ];

  res.json({
    success: true,
    query: query,
    recommendations: mockRecommendations,
    totalResults: mockRecommendations.length,
    fallback: true
  });
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`Book Discovery Hub running on port ${PORT}`);
  console.log(`ML Service URL: ${ML_SERVICE_URL}`);
});