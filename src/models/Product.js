const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true }, // frontend reads imgObj.imageUrl
    publicId: { type: String, default: null }, // Cloudinary id (null for preset/static images)
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    category: { type: String, default: 'রুদ্রাক্ষ', trim: true },
    tag: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    originalPrice: { type: Number, required: [true, 'Original price is required'], min: 1 },
    discountPrice: { type: Number, default: null, min: 0 },
    images: { type: [imageSchema], default: [] },
    rating: { type: Number, default: 5, min: 1, max: 5 },
  },
  { timestamps: true }
);

productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1 });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
