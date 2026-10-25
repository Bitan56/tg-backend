const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const FOLDER = 'ashram-products';

// Upload a multer memory buffer to Cloudinary
function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: FOLDER, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

async function deleteImages(publicIds = []) {
  const ids = publicIds.filter(Boolean);
  if (!ids.length) return;
  await Promise.allSettled(ids.map((id) => cloudinary.uploader.destroy(id)));
}

module.exports = { cloudinary, uploadBuffer, deleteImages };
