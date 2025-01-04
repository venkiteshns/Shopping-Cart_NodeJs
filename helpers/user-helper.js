const bcrypt = require('bcrypt')
const db = require('../config/connection')
const collection = require('../config/collection');
const { ObjectId } = require('mongodb');
const Razorpay = require('razorpay');
const { resolve } = require('node:path');

var instance = new Razorpay({
    key_id: 'rzp_test_sq0PU8BxkBIL9f',
    key_secret: 'XipqzGl8pgRHlQVKBwACtA1O',
});

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
                        .updateOne({ user: new ObjectId(userId), 'products.item': new ObjectId(proId) },
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
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'productDetails'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, productDetails: { $arrayElemAt: ['$productDetails', 0] }
                        }
                    }
                ]).toArray();
                // console.log("Cart items:", cartItems); // See the resulting cart items
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

    },

    changeProductQuantity: (details) => {
        const count = parseInt(details.count);
        const quantity = parseInt(details.quantity)
        console.log('quantity ', quantity);

        console.log("Cart ID:", details.cart);  // Log to ensure the cart ID is correct
        console.log("Product ID:", details.product);  // Log to ensure the product ID is correct
        // Validate ObjectId
        if (!ObjectId.isValid(details.cart) || !ObjectId.isValid(details.product)) {
            return Promise.reject('Invalid ObjectId');
        }

        return new Promise(async (resolve, reject) => {
            if (quantity == 1 && count == -1) {
                await db.get().collection(collection.CART_COLLECTION).updateOne(
                    {
                        _id: new ObjectId(details.cart)
                    },
                    {
                        $pull: { products: { item: new ObjectId(details.product) } }
                    }
                );
                resolve({ itemRemove: true })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne(
                        {
                            _id: new ObjectId(details.cart),
                            'products.item': new ObjectId(details.product)
                        },
                        {
                            $inc: { 'products.$.quantity': count }
                        }
                    )
                resolve({ status: true })
            }
        });
    },

    removeCartItem: (proId, userId) => {
        return new Promise(async (resolve, reject) => {
            console.log('product', proId, 'user :', userId);
            let user = new ObjectId(userId);
            let itemToRemove = { item: new ObjectId(proId) };

            await db.get().collection(collection.CART_COLLECTION).updateOne(
                { user: user },
                { $pull: { products: itemToRemove } }
            );
            resolve()
        })

    },

    getTotalPrice: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: new ObjectId(userId) } // Match the user's cart
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'productDetails'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, productDetails: { $arrayElemAt: ['$productDetails', 0] }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalPrice: { $sum: { $multiply: [{ $toDouble: '$quantity' }, { $toDouble: '$productDetails.price' }] } }
                        }
                    }
                ]).toArray();
                console.log("Cart items:", total); // See the resulting cart items
                resolve(total[0].totalPrice);
            } catch (error) {
                console.error("Error fetching cart items:", error);
                reject(error);
            }
        });
    },

    placeOrder: (order, products, total) => {
        return new Promise(async (resolve, reject) => {
            console.log('Place order 123 : ', order, products, total);
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                Delivery: {
                    Name: order.Name,
                    Phone: order.Phone,
                    Email: order.Email,
                    Address: order.Address,
                    Pincode: order.Pincode
                },
                userId: new ObjectId(order.userId),
                Products: products,
                TotalPrice: total,
                PaymentMethod: order['payment-method'],
                Status: status,
                Date: new Date()

            }
            await db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: new ObjectId(order.userId) })
                resolve(response.insertedId)
            })
        })
    },

    getProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            resolve(cart.products)
        })
    },

    getorder: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let orders = await db.get()
                    .collection(collection.ORDER_COLLECTION)
                    .find({ userId: new ObjectId(userId) })
                    .toArray();  // Converts the cursor to an array
                resolve(orders);
            } catch (error) {
                reject(error);
            }
        })
    },

    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match: { _id: new ObjectId(orderId) }
                    },
                    {
                        $unwind: '$Products'
                    },
                    {
                        $project: {
                            item: '$Products.item',
                            quantity: '$Products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'productDetails'
                        }
                    },
                    {
                        $addFields: {
                            productDetails: { $arrayElemAt: ['$productDetails', 0] }
                        }
                    },
                    {
                        $addFields: {
                            totalPrice: {
                                $multiply: [
                                    { $toDouble: '$quantity' },
                                    { $toDouble: '$productDetails.price' }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            productDetails: 1,
                            totalPrice: 1
                        }
                    }
                ]).toArray();

                console.log("Order items:", orderItems);
                resolve(orderItems);
            } catch (error) {
                console.error("Error fetching cart items:", error);
                reject(error);
            }

        })
    },

    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            instance.orders.create({
                amount: total * 100,
                currency: "INR",
                receipt: orderId,
                notes: {
                    OrderID: orderId,
                    ToatalAmount: total
                }
            }).then((order) => {
                console.log('order razorpay server', order);
                resolve(order)
            }).catch((error) => {
                console.error('Error creating order:', error);
                reject(error);  // Reject the promise in case of error
            });
        })
    },

    verifypayment: (details) => {
        return new Promise((resolve, reject) => {
            const { createHmac, } = require('node:crypto');
            let hmac = createHmac('sha256', 'XipqzGl8pgRHlQVKBwACtA1O');

            // generated_signature = hmac_sha256(order_id + "|" + razorpay_payment_id, secret);

            hmac.update(details['payment[razorpay_order_id]'] + "|" + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            console.log('hamc check', hmac);
            if (hmac === details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject(new Error('payment failed'))
            }
        })
    },

    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: new ObjectId(orderId) }, { $set: { Status: "placed" } }).then(() => {
                resolve()
            }).catch(()=>[
                reject()
            ])
        })
    }

};
