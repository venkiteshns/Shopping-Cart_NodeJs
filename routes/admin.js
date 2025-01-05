var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const { response } = require('../app');

/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products', { products, admin: true })
  })
});

router.get('/add-product', (req, res) => {
  res.render('admin/add-product', { admin: true })
})

router.post('/add-product', (req, res) => {
  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.image
    image.mv('./public/product-images/' + id + '.jpg', (err) => {
      if (!err) {
        res.redirect('/admin')
      } else {
        console.log(err);
      }
    })
  })
})

router.get('/delete-product/:id', (req, res) => {
  let proId = req.params.id
  console.log("id :", proId);

  productHelpers.deleteProduct(proId).then((response) => {
    console.log("response");
    res.redirect('/admin')
    console.log(response);
  })
})

router.get('/edit-product/:id', async (req, res) => {
  await productHelpers.getProductDetails(req.params.id).then((product) => {
    console.log(product);
    res.render('admin/edit-product', { product, admin: true })
  })
})

router.post('/edit-product/:id', async (req, res) => {
  let id = req.params.id
  await productHelpers.updateProduct(req.params.id, req.body).then(() => {
    if (req.files && req.files.image) {
      let image = req.files.image
      image.mv('./public/product-images/' + id + '.jpg')
    }
    res.redirect('/admin')
  })
})

router.get('/all-orders', async (req, res) => {
  let orders = await productHelpers.getAllOrders()
  let pendingOrders = await productHelpers.getPendingOrders()
  let shippedOrders = await productHelpers.getShippedOrders()
  console.log('details', orders);
  res.render('admin/all-orders', { orders, pendingOrders, shippedOrders, admin: true })
})

router.get('/order-products-admin/:id', async (req, res) => {
  console.log("order items to be found");
  let orderProducts = await productHelpers.getAdminOrderProducts(req.params.id)
  res.render('admin/view-order-products', { orderProducts, admin: true })
})

router.get('/ship-order/:id', (req, res) => {
  console.log('proId', req.params.id);
  productHelpers.shipProduct(req.params.id).then(() => {
    res.redirect('/admin/all-orders')
  })
})

router.get('/all-Users', async (req, res) => {
  let userDetails = await productHelpers.getUserDetails()
  res.render('admin/all-users', { userDetails, admin: true })
})


module.exports = router;
