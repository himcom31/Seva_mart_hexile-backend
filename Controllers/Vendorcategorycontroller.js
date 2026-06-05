const VendorCategory = require('../models/Vendorcategory');
const slugify = require('slugify');

const generateSlug = (name) =>
  slugify(name, { lower: true, strict: true, trim: true });

const isValidId = (id) => /^\d+$/.test(id);

// ─── Create ───────────────────────────────────────────────────────────────────
exports.createCategory = (req, res) => {
  try {
    const { name, description, icon } = req.body;

    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: 'Category name is required.' });

    const slug = generateSlug(name);

    const existing = VendorCategory.getBySlug(slug);
    if (existing)
      return res.status(409).json({ success: false, message: 'A category with this name already exists.' });

    const category = VendorCategory.create({ name: name.trim(), slug, description, icon });
    return res.status(201).json({ success: true, message: 'Category created.', data: category });

  } catch (err) {
    console.error('createCategory:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─── Get All ──────────────────────────────────────────────────────────────────
exports.getAllCategories = (req, res) => {
  try {
    const categories = VendorCategory.getAll();
    return res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    console.error('getAllCategories:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─── Get By ID ────────────────────────────────────────────────────────────────
exports.getCategoryById = (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id))
      return res.status(400).json({ success: false, message: 'Invalid ID.' });

    const category = VendorCategory.getById(id);
    if (!category)
      return res.status(404).json({ success: false, message: 'Category not found.' });

    return res.status(200).json({ success: true, data: category });
  } catch (err) {
    console.error('getCategoryById:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─── Get By Slug ──────────────────────────────────────────────────────────────
exports.getCategoryBySlug = (req, res) => {
  try {
    const { slug } = req.params;
    const category = VendorCategory.getBySlug(slug);
    if (!category)
      return res.status(404).json({ success: false, message: 'Category not found.' });

    return res.status(200).json({ success: true, data: category });
  } catch (err) {
    console.error('getCategoryBySlug:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─── Update ───────────────────────────────────────────────────────────────────
exports.updateCategory = (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id))
      return res.status(400).json({ success: false, message: 'Invalid ID.' });

    const { name, description, icon, is_active } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: 'Category name is required.' });

    const existing = VendorCategory.getById(id);
    if (!existing)
      return res.status(404).json({ success: false, message: 'Category not found.' });

    const slug = generateSlug(name);

    // Check slug conflict with a DIFFERENT category
    const slugConflict = VendorCategory.getBySlug(slug);
    if (slugConflict && slugConflict.id !== Number(id))
      return res.status(409).json({ success: false, message: 'A category with this name already exists.' });

    VendorCategory.update(id, { name: name.trim(), slug, description, icon, is_active });
    return res.status(200).json({
      success: true,
      message: 'Category updated.',
      data: { id: Number(id), name: name.trim(), slug, description, icon, is_active },
    });

  } catch (err) {
    console.error('updateCategory:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─── Soft Delete (Deactivate) ─────────────────────────────────────────────────
exports.deactivateCategory = (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id))
      return res.status(400).json({ success: false, message: 'Invalid ID.' });

    const existing = VendorCategory.getById(id);
    if (!existing)
      return res.status(404).json({ success: false, message: 'Category not found.' });

    VendorCategory.softDelete(id);
    return res.status(200).json({ success: true, message: 'Category deactivated.' });

  } catch (err) {
    console.error('deactivateCategory:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─── Hard Delete ──────────────────────────────────────────────────────────────
exports.deleteCategory = (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id))
      return res.status(400).json({ success: false, message: 'Invalid ID.' });

    const existing = VendorCategory.getById(id);
    if (!existing)
      return res.status(404).json({ success: false, message: 'Category not found.' });

    VendorCategory.delete(id);
    return res.status(200).json({ success: true, message: 'Category deleted.' });

  } catch (err) {
    console.error('deleteCategory:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};