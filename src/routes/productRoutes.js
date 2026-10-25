const router = require('express').Router();
const upload = require('../middleware/upload');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

router.route('/').get(getProducts).post(upload, createProduct);
router.route('/:id').get(getProductById).put(upload, updateProduct).delete(deleteProduct);

module.exports = router;
