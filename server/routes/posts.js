import express from 'express';
import Post from '../models/Post.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all posts
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, page = 1, limit = 10, category, sort = 'newest', q } = req.query;
    const query = { isActive: true };

    if (type && type !== 'all') {
      query.type = type;
    }
    if (category) {
      if (type === 'testimony') {
        query.testimonyCategory = category;
      } else if (type === 'celebration') {
        query.celebrationCategory = category;
      } else {
        // apply to either field
        query.$or = [
          { testimonyCategory: category },
          { celebrationCategory: category }
        ];
      }
    }
    if (q) {
      // use searchText lowercased
      query.searchText = { $regex: String(q).toLowerCase(), $options: 'i' };
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      category: { celebrationCategory: 1, testimonyCategory: 1, createdAt: -1 }
    };
    const sortOption = sortMap[sort] || sortMap.newest;

    const posts = await Post.find(query)
      .populate('author', 'name profilePhoto fellowshipRole')
      .populate('comments.user', 'name profilePhoto')
      .sort(sortOption)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create post
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, type, isAnonymous, mediaUrl, testimonyCategory, celebrationCategory, mentions } = req.body;

    if (type === 'testimony' && !testimonyCategory) {
      return res.status(400).json({ message: 'Testimony category is required for testimony posts' });
    }
    if (type === 'celebration' && !celebrationCategory) {
      return res.status(400).json({ message: 'Celebration category is required for celebration posts' });
    }

    const post = new Post({
      title,
      content,
      type,
      testimonyCategory: type === 'testimony' ? testimonyCategory : undefined,
      celebrationCategory: type === 'celebration' ? celebrationCategory : undefined,
      author: req.user._id,
      isAnonymous: isAnonymous || false,
      mediaUrl: mediaUrl || ''
    });

    await post.save();
    await post.populate('author', 'name profilePhoto fellowshipRole');

    res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    res.status(400).json({ message: 'Failed to create post', error: error.message });
  }
});

// Like/Unlike post
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user._id);
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json({ message: 'Post like status updated', likesCount: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Amen/Un-amen testimony
router.post('/:id/amen', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.type !== 'testimony') {
      return res.status(400).json({ message: 'Amen reactions are only for testimonies' });
    }

    const idx = post.amenReactions.findIndex(u => u.toString() === req.user._id.toString());
    if (idx > -1) {
      post.amenReactions.splice(idx, 1);
    } else {
      post.amenReactions.push(req.user._id);
    }
    await post.save();
    res.json({ message: 'Amen status updated', amenCount: post.amenReactions.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Blessings/Unbless celebration
router.post('/:id/bless', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.type !== 'celebration') return res.status(400).json({ message: 'Blessings are only for celebrations' });

    const idx = post.blessingReactions.findIndex(u => u.toString() === req.user._id.toString());
    if (idx > -1) post.blessingReactions.splice(idx, 1); else post.blessingReactions.push(req.user._id);
    await post.save();
    res.json({ message: 'Blessing status updated', count: post.blessingReactions.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Congrats/Uncongrats celebration
router.post('/:id/congrats', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.type !== 'celebration') return res.status(400).json({ message: 'Congrats are only for celebrations' });

    const idx = post.congratsReactions.findIndex(u => u.toString() === req.user._id.toString());
    if (idx > -1) post.congratsReactions.splice(idx, 1); else post.congratsReactions.push(req.user._id);
    await post.save();
    res.json({ message: 'Congrats status updated', count: post.congratsReactions.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Heart/Unheart celebration
router.post('/:id/heart', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.type !== 'celebration') return res.status(400).json({ message: 'Hearts are only for celebrations' });

    const idx = post.heartReactions.findIndex(u => u.toString() === req.user._id.toString());
    if (idx > -1) post.heartReactions.splice(idx, 1); else post.heartReactions.push(req.user._id);
    await post.save();
    res.json({ message: 'Heart status updated', count: post.heartReactions.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Pray for post
router.post('/:id/pray', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const prayIndex = post.prayedFor.indexOf(req.user._id);
    if (prayIndex === -1) {
      post.prayedFor.push(req.user._id);
      await post.save();
    }

    res.json({ message: 'Prayer recorded', prayersCount: post.prayedFor.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add comment
router.post('/:id/comment', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      user: req.user._id,
      content
    });

    await post.save();
    await post.populate('comments.user', 'name profilePhoto');

    res.json({ message: 'Comment added successfully', comments: post.comments });
  } catch (error) {
    res.status(400).json({ message: 'Failed to add comment', error: error.message });
  }
});

// Delete post
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check authorization
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    post.isActive = false;
    await post.save();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;