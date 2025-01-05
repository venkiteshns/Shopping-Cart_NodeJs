const db = require('../config/connection')
const collection = require('../config/collection')
const { ObjectId } = require('mongodb');
const { log } = require('grunt');

module.exports = {

    verifyAdminLogIn: (adminDetails) => {
        console.log('function admin', adminDetails.email);
        return new Promise(async (resolve, reject) => {
            try {
                let response = {}
                let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: adminDetails.email, password: adminDetails.password })
                console.log('admin found : ', admin);
                if (admin) {
                    response.admin = admin
                    response.status = true
                    resolve(response)
                } else {
                    resolve({ status: false })
                }
            } catch (error) {
                console.log('ERROR NOT FOUND');
                resolve({ status: false })
            }
        })
    },

    addProduct: async (product, callback) => {
        try {
            const result = await db.get().collection('product').insertOne(product);
            callback(result.insertedId); // Access the insertedId directly
        } catch (error) {
            console.error(error);
        }
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },

    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.PRODUCT_COLLECTION)
                .deleteOne({ _id: new ObjectId(proId) })
                .then((response) => {
                    console.log("response func", response);
                    resolve(response);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    },

    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: new ObjectId(proId) }).then((product) => {
                resolve(product)
            })
        })
    },

    updateProduct: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: new ObjectId(proId) }, {
                $set: {
                    name: proDetails.name,
                    description: proDetails.description,
                    price: proDetails.price,
                    category: proDetails.category,
                }
            }).then((response) => {
                resolve()
            })
        })
    },

    getAllOrders: () => {
        // return new Promise((resolve, reject) => {
        //     db.get().collection(collection.ORDER_COLLECTION).find({ Status: "placed" }).toArray().then((response) => {
        //         console.log('orders found');
        //         resolve(response)
        //     }).catch(() => {
        //         reject(new Error('orders not found'))
        //     })
        // })
        return new Promise(async (resolve, reject) => {
            const result = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        Status: 'placed'
                    }
                },
                {
                    $lookup: {
                        from: collection.USER_LOGIN,
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userDetails'
                    }
                },
                {
                    $addFields: {
                        UserName: {
                            $arrayElemAt: ['$userDetails.name', 0]
                        }
                    }
                },
                // {
                //     $project: {
                //         _id: 1,
                //         Delivery: 1,
                //         TotalPrice: 1,
                //         PaymentMethod: 1,
                //         Status: 1,
                //         Date: 1,
                //         UserName: 1,
                //     }
                // },
                {
                    $unset: 'userDetails'  // Optional: Remove the userDetails array after extracting the name
                }
            ]).toArray();

            console.log('Updated Orders:1', result);
            // let orders = db.get().collection(collection.ORDER_COLLECTION).find({ Status: "placed" }).toArray()
            // console.log('updated orders', orders);

            resolve(result)

        })
    },

    getPendingOrders: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).find({ Status: "pending" }).toArray().then((response) => {
                console.log('orders found');
                resolve(response)
            }).catch(() => {
                reject(new Error('orders not found'))
            })
        })
    },

    getAdminOrderProducts: (orderId) => {
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

    getShippedOrders: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).find({ Status: "Shipped" }).toArray().then((response) => {
                console.log('orders found');
                resolve(response)
            }).catch(() => {
                reject(new Error('orders not found'))
            })
        })
    },

    shipProduct: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: new ObjectId(orderId) },
                {
                    $set:
                        { Status: "Shipped" }
                }).then(() => {
                    resolve()
                })
        })
    },

    getUserDetails: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_LOGIN).find().toArray().then((users) => {
                console.log('users', users);
                resolve(users)
                // db.get().collection(collection.USER_LOGIN).find({ _id: { $in: userIds } }).toArray().then((userDetails) => {
                //     console.log('userdetails', userDetails);
                //     resolve(userDetails)
                // })
            })
        })
    }

}
