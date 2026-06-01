const SubService = require('../models/Services/SubService');
const Service    = require('../models/Services/Service');
const path = require('path');
const fs   = require('fs');

const generateSlug = (name) =>
  name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// @desc   Add SubService
// @route  POST /api/subservices
// @access Private (Admin)
exports.addSubService = (req, res) => {
  try {
    const { service_id, name, slug, description, price, status, featured } = req.body;

    if (!service_id) return res.status(400).json({ message: 'service_id is required' });
    if (!name)       return res.status(400).json({ message: 'Sub service name is required' });

    // Check parent service exists
    const parentService = Service.findById(service_id);
    if (!parentService) {
      return res.status(404).json({ message: `Service with id ${service_id} not found` });
    }

    const finalSlug = slug || generateSlug(name);

    // Check duplicate slug
    const existing = SubService.findBySlug(finalSlug);
    if (existing) {
      return res.status(409).json({ message: `Slug "${finalSlug}" already exists.` });
    }

    const image = req.files?.image?.[0]?.filename || null;
    const icon  = req.files?.icon?.[0]?.filename  || null;

    const subService = SubService.create({
      service_id,
      name,
      slug:        finalSlug,
      image,
      icon,
      description,
      price:       price    || null,
      status:      status   || 'active',
      featured:    featured === 'true' || featured === true ? 1 : 0,
    });

    res.status(201).json({
      success: true,
      message: 'Sub Service created successfully',
      subService,
    });
  } catch (err) {
    console.error('Add SubService Error:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Get All SubServices
// @route  GET /api/subservices
// @access Public
exports.getAllSubServices = (req, res) => {
  try {
    const subServices = SubService.findAll();
    res.status(200).json({ success: true, count: subServices.length, subServices });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Get SubServices by Service ID
// @route  GET /api/subservices/by-service/:service_id
// @access Public
exports.getSubServicesByService = (req, res) => {
  try {
    const { service_id } = req.params;

    const parentService = Service.findById(service_id);
    if (!parentService) {
      return res.status(404).json({ message: 'Parent service not found' });
    }

    const subServices = SubService.findByServiceId(service_id);
    res.status(200).json({
      success: true,
      service: parentService.name,
      count:   subServices.length,
      subServices,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Get Single SubService
// @route  GET /api/subservices/:id
// @access Public
exports.getSubServiceById = (req, res) => {
  try {
    const subService = SubService.findById(req.params.id);
    if (!subService) return res.status(404).json({ message: 'Sub Service not found' });
    res.status(200).json({ success: true, subService });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Update SubService
// @route  PUT /api/subservices/:id
// @access Private (Admin)
exports.updateSubService = (req, res) => {
  try {
    const subService = SubService.findById(req.params.id);
    if (!subService) return res.status(404).json({ message: 'Sub Service not found' });

    const { service_id, name, slug, description, price, status, featured } = req.body;

    // Validate new parent service if changed
    if (service_id && service_id != subService.service_id) {
      const parentService = Service.findById(service_id);
      if (!parentService) {
        return res.status(404).json({ message: `Service with id ${service_id} not found` });
      }
    }

    // Handle file replacements
    let image = subService.image;
    let icon  = subService.icon;

    if (req.files?.image?.[0]) {
      if (subService.image) {
        const oldPath = path.join(__dirname, '../uploads/subservices', subService.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      image = req.files.image[0].filename;
    }

    if (req.files?.icon?.[0]) {
      if (subService.icon) {
        const oldPath = path.join(__dirname, '../uploads/subservices', subService.icon);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      icon = req.files.icon[0].filename;
    }

    const updated = SubService.update(req.params.id, {
      service_id:  service_id  || subService.service_id,
      name:        name        || subService.name,
      slug:        slug        || subService.slug,
      image,
      icon,
      description: description ?? subService.description,
      price:       price       !== undefined ? price : subService.price,
      status:      status      || subService.status,
      featured:    featured    !== undefined ? (featured === 'true' ? 1 : 0) : subService.featured,
    });

    res.status(200).json({ success: true, message: 'Sub Service updated', subService: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Delete SubService
// @route  DELETE /api/subservices/:id
// @access Private (Admin)
exports.deleteSubService = (req, res) => {
  try {
    const subService = SubService.findById(req.params.id);
    if (!subService) return res.status(404).json({ message: 'Sub Service not found' });

    ['image', 'icon'].forEach(field => {
      if (subService[field]) {
        const filePath = path.join(__dirname, '../uploads/subservices', subService[field]);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    SubService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Sub Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};