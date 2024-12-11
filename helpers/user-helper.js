const bcrypt = require('bcrypt')
const db = require('../config/connection')
const collection = require('../config/collection');
const { decrypt } = require('dotenv');
const { ObjectId } = require('mongodb');

module.exports = {
    userSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            try {
                userData.password = await bcrypt.hash(userData.password, 10);
                let result = await db.get().collection(collection.USER_LOGIN).insertOne(userData)
                let storedData = await db.get().collection(collection.USER_LOGIN).findOne({ _id: result.insertedId })
                resolve(storedData); // Resolving the entire userData object
            } catch (error) {
                reject(error); // Catching errors during password hashing or other operations
            }
        });
    },
    userLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = {}
                let user = await db.get().collection(collection.USER_LOGIN).findOne({ email: userData.email })

                if (user) {
                    console.log("user found");
                    await bcrypt.compare(userData.password, user.password).then((status) => {
                        if (status) {
                            response.user = user
                            response.status = true
                            resolve(response)
                            console.log("log in success");
                        } else {
                            console.log("user not found : log in failed")
                            resolve({ status: false })
                        }
                    })
                } else {
                    console.log("log in failed email");
                    resolve({ status: false })
                }
            } catch (error) {
                reject(error);
            }
        })
    },

    addToCart: (proId, userId) => {
        let proObj = {
            item: new ObjectId(proId),
            quantity: 1
        }

        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })

            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item.equals(new ObjectId(proId)))
                console.log("pro Index", proExist);

                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ 'products.item': new ObjectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: new ObjectId(userId) },
                            {
                                $push: { products: proObj }
                            }
                        ).then(() => {
                            resolve()
                        })
                }

            } else {
                let cartObj = {
                    user: new ObjectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then(() => {
                    resolve()
                })
            }
        })
    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: new ObjectId(userId) } // Match the user's cart
                    },
                    {
                        $unwind:'$products'
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity'
                        }
                    },
                    {
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                            foreignField:'_id',
                            as:'productDetails'
                        }
                    }
                    // {
                    //     $lookup: {
                    //         from: collection.PRODUCT_COLLECTION, // Join with the product collection
                    //         let: { prodList: '$products' }, // Use products field from the cart
                    //         pipeline: [
                    //             {
                    //                 $match: {
                    //                     $expr: {
                    //                         $in: ["$_id", "$$prodList"] // Match product IDs with the cart's products
                    //                     }
                    //                 }
                    //             }
                    //         ],
                    //         as: 'ItemsInCart' // This will hold the matched products
                    //     }
                    // }
                ]).toArray();
                console.log("Cart items:", cartItems); // See the resulting cart items
                resolve(cartItems);
            } catch (error) {
                console.error("Error fetching cart items:", error);
                reject(error);
            }
        });
    },

    getCartCount: (userId) => {
        console.log("user id check count", userId);

        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            console.log("cart", cart);

            var count = 0
            if (cart) {
                count = cart.products.length
                console.log("count in ", count)
            }
            console.log("count", count);

            resolve(count)
        })

    }
};
