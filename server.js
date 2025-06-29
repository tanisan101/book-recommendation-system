const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.example.com"]
    }
  }
}));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static('public'));

// Mock API endpoint for book recommendations
app.post('/api/recommendations', async (req, res) => {
  try {
    const { query, preferences } = req.body;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
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
      },
      {
        id: 4,
        title: "Educated",
        author: "Tara Westover",
        description: "A powerful memoir about education, family, and the struggle between loyalty and independence in a survivalist Mormon family.",
        cover: "https://images.pexels.com/photos/1130623/pexels-photo-1130623.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop",
        rating: 4.7,
        genre: "Memoir",
        similarity: 0.85
      },
      {
        id: 5,
        title: "The Silent Patient",
        author: "Alex Michaelides",
        description: "A psychological thriller about a woman who refuses to speak after allegedly murdering her husband, and the therapist determined to understand why.",
        cover: "https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop",
        rating: 4.4,
        genre: "Thriller",
        similarity: 0.83
      }
    ];

    res.json({
      success: true,
      query: query,
      recommendations: mockRecommendations,
      totalResults: mockRecommendations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations',
      message: error.message
    });
  }
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Book Discovery Hub running on port ${PORT}`);
});