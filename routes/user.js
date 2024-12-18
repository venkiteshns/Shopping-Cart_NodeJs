
var express = require("express");
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helper');
const session = require("express-session");
const db = require('../config/connection')
const collection = require('../config/collection')
const { ObjectId } = require('mongodb');

/* Middleware to redirect logged-in users */
function verifyLogin(req, res, next) {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get("/", async function (req, res, next) {
  let user = req.session.user
  let cartCount = null
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  console.log("session check user main page", user);
  productHelpers.getAllProducts().then((products) => {
    res.render("user/view-products", { products, user, cartCount });
  })
});

router.get('/login', (req, res) => {
  console.log("redirect " + req.session.loggedIn);
  res.setHeader('Cache-Control', 'no-store');
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render("user/log-in", { "loginErr": req.session.loginErr })
    req.session.loginErr = false
  }
})

// /* GET login page */
// router.get('/login', redirectToHomeIfLoggedIn, (req, res) => {
//   res.setHeader('Cache-Control', 'no-store'); // Prevent caching
//   res.render("user/log-in");                 // Render login page
// });

router.post('/login', (req, res) => {
  userHelpers.userLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      // req.session.loginErr=true
      req.session.loginErr = "invalid username or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

router.get('/signup', (req, res) => {
  res.render('user/sign-up')
})

router.post('/signup', (req, res) => {
  userHelpers.userSignup(req.body).then((response) => {
    console.log("accepting data from function");
    console.log(response);
    req.session.loggedIn = true
    req.session.user = response
    res.redirect('/')
  })
})

router.get('/add-to-cart/:id', async (req, res) => {
  console.log('api call check');
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })

});


router.get("/cart", verifyLogin, async (req, res) => {
  let user = req.session.user
  let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(req.session.user._id) })
  if (userCart) {
    let products = await userHelpers.getCartProducts(req.session.user._id)
    let total = await userHelpers.getTotalPrice(req.session.user._id)

    // console.log("cart items got :",products);
    res.render('user/cart', { products, user, total })
  } else {
    res.render('user/cart', { user })
  }
})

router.post('/change-product-quantity', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then((response) => {
    console.log('cart update response', response);
    res.json(response);
  })
});

router.get('/remove-item/:id/', (req, res) => {
  console.log('id remove', req.params.id);

  userHelpers.removeCartItem(req.params.id, req.session.user._id).then(() => {
    res.redirect('/cart')
  })
})

router.get('/place-order', verifyLogin, async (req, res) => {
  console.log("place order page");
  let total = await userHelpers.getTotalPrice(req.session.user._id)
  console.log('total', total);
  res.render('user/place-order', { total })
})


module.exports = router;
