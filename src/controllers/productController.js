const mongoose = require('mongoose');
const Product = require('../models/Product');
const { uploadBuffer, deleteImages } = require('../config/cloudinary');

const parsePrices = (body) => {
  const originalPrice = Number(body.originalPrice);
  const hasDiscount =
    body.discountPrice !== undefined && body.discountPrice !== null && body.discountPrice !== '';
  const discountPrice = hasDiscount ? Number(body.discountPrice) : null;
  return { originalPrice, discountPrice };
};

const validatePrices = (originalPrice, discountPrice) => {
  if (Number.isNaN(originalPrice) || originalPrice <= 0) {
    return 'Please provide a valid original price greater than 0';
  }
  if (discountPrice !== null && (Number.isNaN(discountPrice) || discountPrice < 0 || discountPrice > originalPrice)) {
    return 'Discount price cannot be negative or greater than the original price';
  }
  return null;
};

// GET /api/v1/products?category=&search=
exports.getProducts = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category && category !== 'সকল সামগ্রী') filter.category = category;
    if (search && search.trim()) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { description: rx }, { tag: rx }];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/products/:id
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/products  (multipart/form-data)
// fields: name, category, tag, description, originalPrice, discountPrice?, images[] OR imageUrl
exports.createProduct = async (req, res, next) => {
  let uploaded = [];
  try {
    const { name, category, tag, description, imageUrl } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    const { originalPrice, discountPrice } = parsePrices(req.body);
    const priceError = validatePrices(originalPrice, discountPrice);
    if (priceError) return res.status(400).json({ success: false, message: priceError });

    let images = [];
    if (req.files && req.files.length > 0) {
      const results = await Promise.all(req.files.map((f) => uploadBuffer(f.buffer)));
      uploaded = results.map((r) => r.public_id);
      images = results.map((r) => ({ imageUrl: r.secure_url, publicId: r.public_id }));
    } else if (imageUrl) {
      images = [{ imageUrl, publicId: null }]; // preset/static image path from frontend
    }

    const product = await Product.create({
      name: name.trim(),
      category,
      tag,
      description,
      originalPrice,
      discountPrice,
      images,
    });

    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (err) {
    await deleteImages(uploaded); // roll back orphaned Cloudinary uploads
    next(err);
  }
};

// PUT /api/v1/products/:id  (multipart/form-data) - new images are appended unless replaceImages=true
exports.updateProduct = async (req, res, next) => {
  let uploaded = [];
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const { name, category, tag, description, imageUrl, replaceImages } = req.body;
    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category;
    if (tag !== undefined) product.tag = tag;
    if (description !== undefined) product.description = description;

    const original = req.body.originalPrice !== undefined ? Number(req.body.originalPrice) : product.originalPrice;
    let discount = product.discountPrice;
    if (req.body.discountPrice !== undefined) {
      discount = req.body.discountPrice === '' ? null : Number(req.body.discountPrice);
    }
    const priceError = validatePrices(original, discount);
    if (priceError) return res.status(400).json({ success: false, message: priceError });
    product.originalPrice = original;
    product.discountPrice = discount;

    let removedIds = [];
    let newImages = [];
    if (req.files && req.files.length > 0) {
      const results = await Promise.all(req.files.map((f) => uploadBuffer(f.buffer)));
      uploaded = results.map((r) => r.public_id);
      newImages = results.map((r) => ({ imageUrl: r.secure_url, publicId: r.public_id }));
    } else if (imageUrl) {
      newImages = [{ imageUrl, publicId: null }];
    }

    if (newImages.length) {
      if (replaceImages === 'true') {
        removedIds = product.images.map((i) => i.publicId);
        product.images = newImages;
      } else {
        product.images.push(...newImages);
      }
    }

    await product.save();
    await deleteImages(removedIds);
    res.json({ success: true, message: 'Product updated', data: product });
  } catch (err) {
    await deleteImages(uploaded);
    next(err);
  }
};

// DELETE /api/v1/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    await deleteImages(product.images.map((i) => i.publicId));
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};
