import express from 'express';
import Post from '../models/Post.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all posts
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };
    
    if (type && type !== 'all') {
      query.type = type;
    }

    const posts = await Post.find(query)
      .populate('author', 'name profilePhoto fellowshipRole')
      .populate('comments.user', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create post
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, type, isAnonymous, mediaUrl } = req.body;

    const post = new Post({
      title,
      content,
      type,
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