import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get daily scripture verse
router.get('/daily', authenticate, async (req, res) => {
  try {
    // Using bible-api.com for free Bible verses
    const response = await fetch('https://bible-api.com/john+3:16');
    const data = await response.json();
    
    // If API fails, provide a fallback verse
    if (!data || !data.text) {
      return res.json({
        reference: 'John 3:16',
        text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
        translation_name: 'NIV'
      });
    }

    res.json(data);
  } catch (error) {
    // Fallback verse if API is unavailable
    res.json({
      reference: 'Philippians 4:13',
      text: 'I can do all this through him who gives me strength.',
      translation_name: 'NIV'
    });
  }
});

// Get random verse
router.get('/random', authenticate, async (req, res) => {
  try {
    const verses = [
      'john+3:16',
      'philippians+4:13',
      'romans+8:28',
      'jeremiah+29:11',
      'psalm+23:1',
      'matthew+28:20',
      'isaiah+40:31',
      'proverbs+3:5-6'
    ];
    
    const randomVerse = verses[Math.floor(Math.random() * verses.length)];
    const response = await fetch(`https://bible-api.com/${randomVerse}`);
    const data = await response.json();
    
    if (!data || !data.text) {
      return res.json({
        reference: 'Psalm 23:1',
        text: 'The Lord is my shepherd, I lack nothing.',
        translation_name: 'NIV'
      });
    }

    res.json(data);
  } catch (error) {
    res.json({
      reference: 'Romans 8:28',
      text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
      translation_name: 'NIV'
    });
  }
});

export default router;