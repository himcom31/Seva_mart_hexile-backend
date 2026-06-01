const express = require('express');
const router = express.Router();
const { login } = require('../Controllers/authController.js');
const { protect } = require('../middleware/authMiddleware.js');
const User = require('../models/superAdmin.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register-admin
router.post('/register-admin', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const user = User.create({
            ...req.body,
            password: hashedPassword,
            role: 'admin'
        });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                mobile: user.mobile
            }
        });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
});

module.exports = router;