import express from 'express';
import InviteCode from '../models/InviteCode.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Create invite code (SUPER_ADMIN only)
router.post('/', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { code, role, ministry, familyId, expiresAt, description } = req.body;

    // Validate role
    const validRoles = ['FAMILY_LEADER', 'TEAM_LEADER', 'GENERAL_LEADER', 'SUPER_ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role for invite code' });
    }

    // Check if code already exists
    const existingCode = await InviteCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ message: 'Invite code already exists' });
    }

    const inviteCode = new InviteCode({
      code: code.toUpperCase(),
      role,
      ministry: ministry || '',
      familyId: familyId || null,
      createdBy: req.user._id,
      expiresAt: expiresAt || null,
      description: description || ''
    });

    await inviteCode.save();

    res.status(201).json({
      message: 'Invite code created successfully',
      inviteCode: {
        id: inviteCode._id,
        code: inviteCode.code,
        role: inviteCode.role,
        ministry: inviteCode.ministry,
        familyId: inviteCode.familyId,
        expiresAt: inviteCode.expiresAt,
        description: inviteCode.description,
        isActive: inviteCode.isActive
      }
    });
  } catch (error) {
    console.error('Create invite code error:', error);
    res.status(500).json({ message: 'Failed to create invite code', error: error.message });
  }
});

// Get all invite codes (SUPER_ADMIN only)
router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const inviteCodes = await InviteCode.find()
      .populate('createdBy', 'name email')
      .populate('usedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(inviteCodes);
  } catch (error) {
    console.error('Get invite codes error:', error);
    res.status(500).json({ message: 'Failed to fetch invite codes', error: error.message });
  }
});

// Validate invite code (public)
router.get('/validate/:code', async (req, res) => {
  try {
    const invite = await InviteCode.findOne({ 
      code: req.params.code.toUpperCase(),
      isActive: true,
      usedBy: null
    });

    if (!invite) {
      return res.status(404).json({ valid: false, message: 'Invalid invite code' });
    }

    // Check expiration
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return res.status(400).json({ valid: false, message: 'Invite code has expired' });
    }

    res.json({
      valid: true,
      role: invite.role,
      ministry: invite.ministry,
      description: invite.description
    });
  } catch (error) {
    console.error('Validate invite code error:', error);
    res.status(500).json({ message: 'Failed to validate invite code', error: error.message });
  }
});

// Deactivate invite code (SUPER_ADMIN only)
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const inviteCode = await InviteCode.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!inviteCode) {
      return res.status(404).json({ message: 'Invite code not found' });
    }

    res.json({ message: 'Invite code deactivated successfully', inviteCode });
  } catch (error) {
    console.error('Deactivate invite code error:', error);
    res.status(500).json({ message: 'Failed to deactivate invite code', error: error.message });
  }
});

export default router;
