const SubService = require('../models/Services/Subservice.js');
const Service    = require('../models/Services/Service.js');
const cloudinary = require('../config/cloudinary');

const generateSlug = (name) =>
  name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const getPublicId = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  return parts.slice(uploadIndex + 2).join('/').replace(/\.[^/.]+$/, '');
};

// @desc   Add SubService
// @route  POST /api/subservices
// @access Private (Admin)
exports.addSubService = (req, res) => {
  try {
    const { service_id, name, slug, description, price, status, featured } = req.body;

    if (!service_id) return res.status(400).json({ message: 'service_id is required' });
    if (!name)       return res.status(400).json({ message: 'Sub service name is required' });

    const parentService = Service.findById(service_id);
    if (!parentService)
      return res.status(404).json({ message: `Service with id ${service_id} not found` });

    const finalSlug = slug || generateSlug(name);
    const existing  = SubService.findBySlug(finalSlug);
    if (existing)
      return res.status(409).json({ message: `Slug "${finalSlug}" already exists.` });

    // Cloudinary returns full URL in file.path
    const image = req.files?.image?.[0]?.path || null;
    const icon  = req.files?.icon?.[0]?.path  || null;

    const subService = SubService.create({
      service_id, name,
      slug:        finalSlug,
      image,       icon,
      description,
      price:       price    || null,
      status:      status   || 'active',
      featured:    featured === 'true' || featured === true ? 1 : 0,
    });

    res.status(201).json({ success: true, message: 'Sub Service created successfully', subService });
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
    const parentService  = Service.findById(service_id);
    if (!parentService)
      return res.status(404).json({ message: 'Parent service not found' });

    const subServices = SubService.findByServiceId(service_id);
    res.status(200).json({ success: true, service: parentService.name, count: subServices.length, subServices });
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
exports.updateSubService = async (req, res) => {
  try {
    const subService = SubService.findById(req.params.id);
    if (!subService) return res.status(404).json({ message: 'Sub Service not found' });

    const { service_id, name, slug, description, price, status, featured } = req.body;

    if (service_id && service_id != subService.service_id) {
      const parentService = Service.findById(service_id);
      if (!parentService)
        return res.status(404).json({ message: `Service with id ${service_id} not found` });
    }

    let image = subService.image;
    let icon  = subService.icon;

    if (req.files?.image?.[0]) {
      const oldId = getPublicId(subService.image);
      if (oldId) await cloudinary.uploader.destroy(oldId);
      image = req.files.image[0].path;
    }

    if (req.files?.icon?.[0]) {
      const oldId = getPublicId(subService.icon);
      if (oldId) await cloudinary.uploader.destroy(oldId);
      icon = req.files.icon[0].path;
    }

    const updated = SubService.update(req.params.id, {
      service_id:  service_id  || subService.service_id,
      name:        name        || subService.name,
      slug:        slug        || subService.slug,
      image,       icon,
      description: description ?? subService.description,
      price:       price !== undefined ? price : subService.price,
      status:      status   || subService.status,
      featured:    featured !== undefined ? (featured === 'true' ? 1 : 0) : subService.featured,
    });

    res.status(200).json({ success: true, message: 'Sub Service updated', subService: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Delete SubService
// @route  DELETE /api/subservices/:id
// @access Private (Admin)
exports.deleteSubService = async (req, res) => {
  try {
    const subService = SubService.findById(req.params.id);
    if (!subService) return res.status(404).json({ message: 'Sub Service not found' });

    for (const field of ['image', 'icon']) {
      const publicId = getPublicId(subService[field]);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    }

    SubService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Sub Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};