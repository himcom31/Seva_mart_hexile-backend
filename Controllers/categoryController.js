const Category = require('../models/Services/Category');
const path = require('path');
const fs = require('fs');

// Helper: auto-generate slug from name
const generateSlug = (name) =>
  name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// @desc   Add Category
// @route  POST /api/categories
// @access Private (Admin)
exports.addCategory = async (req, res) => {
  try {
    const { language, name, slug, description, status, featured } = req.body;

    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const finalSlug = slug || generateSlug(name);

    // Check duplicate slug
    const existing = Category.findBySlug(finalSlug);
    if (existing) {
      return res.status(409).json({ message: `Slug "${finalSlug}" already exists. Use a different name.` });
    }

    // Handle uploaded files
    const image = req.files?.image?.[0]?.filename || null;
    const icon  = req.files?.icon?.[0]?.filename  || null;

    const category = Category.create({
      language: language || 'en',
      name,
      slug: finalSlug,
      image,
      icon,
      description,
      status: status || 'active',
      featured: featured === 'true' || featured === true ? 1 : 0
    });

    res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (err) {
    console.error('Add Category Error:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Get All Categories
// @route  GET /api/categories
// @access Public
exports.getAllCategories = (req, res) => {
  try {
    const categories = Category.findAll();
    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Get Single Category
// @route  GET /api/categories/:id
// @access Public
exports.getCategoryById = (req, res) => {
  try {
    const category = Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Update Category
// @route  PUT /api/categories/:id
// @access Private (Admin)
exports.updateCategory = (req, res) => {
  try {
    const category = Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const { language, name, slug, description, status, featured } = req.body;

    // Handle new file uploads — delete old ones if replaced
    let image = category.image;
    let icon  = category.icon;

    if (req.files?.image?.[0]) {
      if (category.image) {
        const oldPath = path.join(__dirname, '../uploads/categories', category.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      image = req.files.image[0].filename;
    }

    if (req.files?.icon?.[0]) {
      if (category.icon) {
        const oldPath = path.join(__dirname, '../uploads/categories', category.icon);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      icon = req.files.icon[0].filename;
    }

    const updated = Category.update(req.params.id, {
      language: language || category.language,
      name:     name     || category.name,
      slug:     slug     || category.slug,
      image, icon,
      description: description ?? category.description,
      status:   status   || category.status,
      featured: featured !== undefined ? (featured === 'true' ? 1 : 0) : category.featured
    });

    res.status(200).json({ success: true, message: 'Category updated', category: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Delete Category
// @route  DELETE /api/categories/:id
// @access Private (Admin)
exports.deleteCategory = (req, res) => {
  try {
    const category = Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Delete associated files
    ['image', 'icon'].forEach(field => {
      if (category[field]) {
        const filePath = path.join(__dirname, '../uploads/categories', category[field]);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    Category.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};