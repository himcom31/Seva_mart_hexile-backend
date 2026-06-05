const Service    = require('../models/Services/Service.js');
const Category   = require('../models/Services/Category.js');
const cloudinary = require('../config/cloudinary');
const path       = require('path');

const generateSlug = (name) =>
  name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// Extract Cloudinary public_id from URL for deletion
const getPublicId = (url) => {
  if (!url) return null;
  // URL format: .../upload/v1234567890/services/filename.webp
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  // Join folder + filename, strip extension
  return parts.slice(uploadIndex + 2).join('/').replace(/\.[^/.]+$/, '');
};

// @desc   Add Service
// @route  POST /api/services
// @access Private (Admin)
exports.addService = (req, res) => {
  try {
    const { name, category_id, code, slug, description, status, verify_status, featured, code_prefix } = req.body;

    if (!name)        return res.status(400).json({ message: 'Service name is required' });
    if (!category_id) return res.status(400).json({ message: 'category_id is required' });

    const parentCategory = Category.findById(category_id);
    if (!parentCategory)
      return res.status(404).json({ message: `Category with id ${category_id} not found` });

    const finalCode = code || Service.generateCode(code_prefix || 'PROD');
    const finalSlug = slug || generateSlug(name);

    if (Service.findByCode(finalCode))
      return res.status(409).json({ message: `Code "${finalCode}" already exists.` });
    if (Service.findBySlug(finalSlug))
      return res.status(409).json({ message: `Slug "${finalSlug}" already exists.` });

    // Cloudinary returns full URL in file.path
    const image = req.files?.image?.[0]?.path || null;
    const icon  = req.files?.icon?.[0]?.path  || null;

    const service = Service.create({
      name,
      category_id,
      code:          finalCode,
      slug:          finalSlug,
      image,
      icon,
      description,
      status:        status        || 'active',
      verify_status: verify_status || 'pending',
      featured:      featured === 'true' || featured === true ? 1 : 0
    });

    res.status(201).json({ success: true, message: 'Service created successfully', service });
  } catch (err) {
    console.error('Add Service Error:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Get All Services
// @route  GET /api/services
// @access Public
exports.getAllServices = (req, res) => {
  try {
    const services = Service.findAll();
    res.status(200).json({ success: true, count: services.length, services });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Get Services by Category
// @route  GET /api/services/by-category/:category_id
// @access Public
exports.getServicesByCategory = (req, res) => {
  try {
    const parentCategory = Category.findById(req.params.category_id);
    if (!parentCategory)
      return res.status(404).json({ message: 'Category not found' });

    const services = Service.findByCategoryId(req.params.category_id);
    res.status(200).json({
      success: true,
      category: parentCategory.name,
      count:    services.length,
      services
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Get Single Service
// @route  GET /api/services/:id
// @access Public
exports.getServiceById = (req, res) => {
  try {
    const service = Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.status(200).json({ success: true, service });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Update Service
// @route  PUT /api/services/:id
// @access Private (Admin)
exports.updateService = async (req, res) => {
  try {
    const service = Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const { name, category_id, code, slug, description, status, verify_status, featured } = req.body;

    if (category_id && category_id != service.category_id) {
      const parentCategory = Category.findById(category_id);
      if (!parentCategory)
        return res.status(404).json({ message: `Category with id ${category_id} not found` });
    }

    let image = service.image;
    let icon  = service.icon;

    // If new image uploaded, delete old one from Cloudinary then save new URL
    if (req.files?.image?.[0]) {
      const oldId = getPublicId(service.image);
      if (oldId) await cloudinary.uploader.destroy(oldId);
      image = req.files.image[0].path;
    }

    if (req.files?.icon?.[0]) {
      const oldId = getPublicId(service.icon);
      if (oldId) await cloudinary.uploader.destroy(oldId);
      icon = req.files.icon[0].path;
    }

    const updated = Service.update(req.params.id, {
      name:          name          || service.name,
      category_id:   category_id   || service.category_id,
      code:          code          || service.code,
      slug:          slug          || service.slug,
      image,
      icon,
      description:   description   ?? service.description,
      status:        status        || service.status,
      verify_status: verify_status || service.verify_status,
      featured:      featured !== undefined ? (featured === 'true' ? 1 : 0) : service.featured
    });

    res.status(200).json({ success: true, message: 'Service updated', service: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Toggle Status (active/inactive)
// @route  PATCH /api/services/:id/toggle-status
// @access Private (Admin)
exports.toggleStatus = (req, res) => {
  try {
    const service = Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const newStatus = service.status === 'active' ? 'inactive' : 'active';
    const updated   = Service.updateStatus(req.params.id, newStatus);

    res.status(200).json({ success: true, message: `Status changed to ${newStatus}`, service: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Update Verify Status
// @route  PATCH /api/services/:id/verify
// @access Private (Admin)
exports.updateVerifyStatus = (req, res) => {
  try {
    const { verify_status } = req.body;
    if (!['pending', 'verified', 'rejected'].includes(verify_status))
      return res.status(400).json({ message: 'verify_status must be: pending, verified, or rejected' });

    const service = Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const updated = Service.updateVerifyStatus(req.params.id, verify_status);
    res.status(200).json({ success: true, message: `Verify status changed to ${verify_status}`, service: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Delete Service
// @route  DELETE /api/services/:id
// @access Private (Admin)
exports.deleteService = async (req, res) => {
  try {
    const service = Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    // Delete both image and icon from Cloudinary
    for (const field of ['image', 'icon']) {
      const publicId = getPublicId(service[field]);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    }

    Service.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};