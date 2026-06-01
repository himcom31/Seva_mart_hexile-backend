const express = require('express');
const router  = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware.js');
const {
  getAllUsers,
  getUserById,
  updateUser,
  toggleBlock,
  deleteUser
} = require('../Controllers/userController.js');

router.get   ('/',       protect, isAdmin, getAllUsers);
router.get   ('/:id',    protect, isAdmin, getUserById);
router.put   ('/:id',    protect, isAdmin, updateUser);
router.patch ('/:id/block', protect, isAdmin, toggleBlock);
router.delete('/:id',    protect, isAdmin, deleteUser);

module.exports = router;