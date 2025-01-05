var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const { response } = require('../app');
const session = require("express-session");


/* Middleware to redirect logged-in Admins */
function verifySessionAdmin(req, res, next) {
  if (req.session.adminLoggedIn) {
    console.log("session found");
    next();
  } else {
    res.redirect('/admin/log-in')
  }
}

router.get('/', function (req, res, next) {
  res.redirect('/admin/log-in')
})

router.get('/dashboard', verifySessionAdmin, function (req, res, next) {
  adminLogin = true
  console.log('session check', req.session.adminLoggedIn);
  console.log('session check', req.session.admin);

  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products', { products, admin: true, adminDetails: req.session.admin })
  })
});

router.get('/log-in', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.session.adminLoggedIn) {
    res.redirect('/admin/dashboard')
  } else {
    res.render('admin/admin-login', { adminLoggingIn: true, 'adminLoginErr': req.session.adminLoginErr })
    req.session.adminLoginErr = false
  }
})

router.post('/log-in', (req, res) => {
  console.log('admin log-in', req.body);
  try {
    productHelpers.verifyAdminLogIn(req.body).then((response) => {
      console.log('admin found or not response', response);
      if (response.status) {
        req.session.adminLoggedIn = true
        req.session.admin = {
          _id: response.admin._id,
          name: response.admin.name,
          email: response.admin.email
        }
        console.log('admin session', req.session.admin);
        res.redirect('/admin/dashboard')
      } else {
        console.log('admin not found');
        req.session.adminLoginErr = "Invalid Username or Password"
        res.redirect('/admin/log-in')
      }

    })
  } catch (error) {
    console.log('error found', error);

  }
})

router.get('/log-out', (req, res) => {
  req.session.admin = null
  req.session.adminLoggedIn = null
  res.redirect('/admin/log-in')
})

router.get('/add-product', verifySessionAdmin, (req, res) => {
  res.render('admin/add-product', { admin: true, adminDetails: req.session.admin })
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

router.get('/delete-product/:id', verifySessionAdmin, (req, res) => {
  let proId = req.params.id
  console.log("id :", proId);

  productHelpers.deleteProduct(proId).then((response) => {
    console.log("response");
    res.redirect('/admin')
    console.log(response);
  })
})

router.get('/edit-product/:id', verifySessionAdmin, async (req, res) => {
  await productHelpers.getProductDetails(req.params.id).then((product) => {
    console.log(product);
    res.render('admin/edit-product', { product, admin: true, adminDetails: req.session.admin })
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

router.get('/all-orders', verifySessionAdmin, async (req, res) => {
  let orders = await productHelpers.getAllOrders()
  let pendingOrders = await productHelpers.getPendingOrders()
  let shippedOrders = await productHelpers.getShippedOrders()
  console.log('details', orders);
  res.render('admin/all-orders', { orders, pendingOrders, shippedOrders, admin: true, adminDetails: req.session.admin })
})

router.get('/order-products-admin/:id', async (req, res) => {
  console.log("order items to be found");
  let orderProducts = await productHelpers.getAdminOrderProducts(req.params.id)
  res.render('admin/view-order-products', { orderProducts, admin: true, adminDetails: req.session.admin })
})

router.get('/ship-order/:id', (req, res) => {
  console.log('proId', req.params.id);
  productHelpers.shipProduct(req.params.id).then(() => {
    res.redirect('/admin/all-orders')
  })
})

router.get('/all-Users', verifySessionAdmin, async (req, res) => {
  let userDetails = await productHelpers.getUserDetails()
  res.render('admin/all-users', { userDetails, admin: true, adminDetails: req.session.admin })
})


module.exports = router;
