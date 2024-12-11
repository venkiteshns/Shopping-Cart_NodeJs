const db = require('../config/connection')
const collection = require('../config/collection')
const { ObjectId } = require('mongodb');
const { response, resource } = require('../app');

module.exports = {

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
                    console.log("response func",response);
                    resolve(response);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    },

    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id: new ObjectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },

    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id: new ObjectId(proId)},{
                $set:{
                    name:proDetails.name,
                    description:proDetails.description,
                    price:proDetails.price,
                    category:proDetails.category,
                }
            }).then((response)=>{
                resolve()
            })
        })
    }
    
}
