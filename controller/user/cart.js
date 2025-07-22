
const _ = require("lodash");
const crypto = require('crypto');
const moment = require('moment');
const Controller = require('../base');
const connection = require("../../config/db");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const Authentication = require("../auth");
const IthinkController = require('../common/ithink');


const gstStages = [
    { $lookup: { from: "gstcodes", localField: "productDetails.gstCodeId", foreignField: "_id", as: "gstCode" } },
    { $unwind: { "path": "$gstCode", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "adminsettings", localField: "productDetails.adminSettingsId", foreignField: "_id", as: "adminsettings" } },
    { $unwind: "$adminsettings" },
];




 // Fetch product details from the database using the product ID
 async function getProductDetails(productId) {
    return new Promise((resolve, reject) => {
      const selectQuery = 'SELECT * FROM products WHERE _id = ?';
      connection.query(selectQuery, [productId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          console.log(results[0]);
          resolve(results[0]);
        }
      });
    });
  }
  
  // Function to check if the cart item already exists
  async function  getCartItem(userId, productId) {
    return new Promise((resolve, reject) => {
      const selectQuery = 'SELECT * FROM cart WHERE userId = ? AND productId = ?';
      connection.query(selectQuery, [userId, productId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }
  
  // Function to insert a new cart item
  async function insertCartItem(cartItem) {
    console.log(cartItem);
    return new Promise((resolve, reject) => {
      const insertQuery = 'INSERT INTO cart SET ?';
      connection.query(insertQuery, cartItem, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }
  
  // Function to update the cart item quantity
  async function updateCartItem(cartItem) {
    console.log("cartItme2", cartItem);
    try {
      // Check if the cart item already exists
      const cartItemExists = await getCartItem(cartItem.userId, cartItem.productId);
      // If the cart item exists, update its quantity
      if (cartItemExists) {
        console.log("cartexist", cartItemExists);
        // Get the existing quantity from the database
        // Calculate the new quantity by adding the existing quantity to the new quantity
        // const newQuantity = cartItemExists.quantity + cartItem.quantity;  
        return new Promise((resolve, reject) => {
          const updateQuery = 'UPDATE cart SET quantity = ? WHERE userId = ? AND productId = ?';
          console.log(updateQuery);
          connection.query(updateQuery, [cartItem.quantity, cartItem.userId, cartItem.productId], (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }
          });
        });
      } else {
        // If the cart item doesn't exist, you may choose to handle this case separately (e.g., insert a new cart item)
        // For simplicity, I'm assuming the cart item is already inserted and you only update the quantity here.
        return Promise.reject(new Error('Cart item does not exist'));
      }
    } catch (error) {
      throw error;
    }
  }



  async function bulkUpdateCartItem(cartItems, userId) {
    try {
      const updatePromises = [];
    //   console.log(cartItems);
  
      for (const cartItem of cartItems) {
        // Check if the cart item already exists
        // const cartItemExists = await getCartItem(cartItem.userId, cartItem.productId);
  
    //    console.log(cartItem, userId);
  
        // If the cart item exists, update its quantity
        const updatePromise = new Promise((resolve, reject) => {
          const updateQuery = 'UPDATE cart SET quantity = ? WHERE userId = ? AND productId = ?';
        
          connection.query(updateQuery, [cartItem.quantity, userId, cartItem.productId], (err, results) => {
            if (err) {
              reject(err);
            } else {
                // console.log(results);
              resolve(results);
            }
          });
        });
  
        updatePromises.push(updatePromise);
      }
  
      // Wait for all update promises to resolve
      const updateResults = await Promise.all(updatePromises);
      return updateResults;
    } catch (error) {
      throw error;
    }
  }



  async function bulkUpdateCartItemSignle(cartItems, userId) {
    try {
      const updatePromises = [];
      console.log(cartItems, userId);
  
      for (const cartItem of cartItems) {
        // Check if the cart item already exists
        // const cartItemExists = await getCartItem(cartItem.userId, cartItem.productId);
  
    //    console.log(cartItem, userId);
  
        // If the cart item exists, update its quantity
        const updatePromise = new Promise((resolve, reject) => {
          const updateQuery = 'UPDATE cart SET quantity = ? WHERE userId = ? AND _id = ?';

        
          connection.query(updateQuery, [cartItem.quantity, userId, cartItem._id], (err, results) => {
            console.log(updateQuery);
            if (err) {
              reject(err);
            } else {
                console.log(results);
              resolve(results);
            }
          });
        });
  
        updatePromises.push(updatePromise);
      }
  
      // Wait for all update promises to resolve
      const updateResults = await Promise.all(updatePromises);
      return updateResults;
    } catch (error) {
      throw error;
    }
  }
  
  // Function to get the cart total
  async function getCartTotal(userId) {
    return new Promise((resolve, reject) => {
      const selectQuery = 'SELECT SUM(quantity) AS cartTotal FROM cart WHERE userId = ?';
      connection.query(selectQuery, [userId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].cartTotal || 0);
        }
      });
    });
  }
  
  // Function to get the cart quantity
  async function getCartQuantity(userId) {
    return new Promise((resolve, reject) => {
      const selectQuery = 'SELECT COUNT(*) AS cartQuantity FROM cart WHERE userId = ?';
      connection.query(selectQuery, [userId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].cartQuantity || 0);
        }
      });
    });


    
  }



class CartController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }

    /********************************************************
    Purpose: Add and update products details in cart
    Method: Post
    Authorisation: true
    Parameter:
    {
        "quantity":2,
        "productId":"641b4911c56ee001379dd87e",
        "productType":"Variant",
        "attributeId":"641b4911c56ee001379dd87f",
        "sizeId":"641b4911c56ee001379dd880",
        "type":"isEcommerce" or "isFood" or "isGame",
        "isInput": true,
        "isIncrement": false
    }
    Return: JSON String
    ********************************************************/
    async addToCart() {
  try {
    const userId = this.req.user; // Authenticated user ID
    const { productId, quantity } = this.req.body;

    // Validate required fields
    const fieldsArray = ["productId", "quantity"];
    const emptyFields = await this.requestBody.checkEmptyWithFields(this.req.body, fieldsArray);
    if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
      return this.res.status(400).send({
        status: 0,
        message: `Please send ${emptyFields.join(", ")} field(s) required.`,
      });
    }

    // Validate quantity is a positive integer
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return this.res.status(400).send({
        status: 0,
        message: "Quantity must be a positive integer.",
      });
    }

    // Fetch product details
    const productDetails = await getProductDetails(productId);
    if (!productDetails) {
      return this.res.status(404).send({
        status: 0,
        message: "Product not found.",
      });
    }
    console.log(productDetails);

    // Validate product status, stock, and purchase limits
    if (productDetails.status !== "active") {
      return this.res.status(400).send({
        status: 0,
        message: "Product is not available.",
      });
    }
    if (productDetails.stock < parsedQuantity) {
      return this.res.status(400).send({
        status: 0,
        message: "Insufficient stock.",
      });
    }
    if (
      parsedQuantity < productDetails.minPurchaseQty ||
      parsedQuantity > productDetails.maxPurchaseQty
    ) {
      return this.res.status(400).send({
        status: 0,
        message: `Quantity must be between ${productDetails.minPurchaseQty} and ${productDetails.maxPurchaseQty}.`,
      });
    }
    if (
      productDetails.discountDate &&
      new Date(productDetails.discountDate) < new Date()
    ) {
      // Reset discount if expired
      productDetails.discount = 0;
      productDetails.discountType = "percentage";
    }

    // Calculate total price based on discount type
    console.log("hello",productDetails.unitprice);
    const unitPrice = productDetails.unitprice;
    console.log("321",unitPrice);
    let totalPrice;
    if (productDetails.discountType === "percentage") {
      totalPrice = unitPrice * parsedQuantity * (1 - productDetails.discount / 100);
    } else {
      totalPrice = unitPrice * parsedQuantity - productDetails.discount;
    }
    // Ensure totalPrice is not negative
    totalPrice = Math.max(0, parseFloat(totalPrice.toFixed(2)));

    // Prepare cart item object
    const cartItem = {
      userId,
      productId: parseInt(productId),
      quantity: parsedQuantity,
      unitPrice,
      totalPrice,
      discount: productDetails.discount || 0,
      discountType: productDetails.discountType || "percentage",
      otherTaxes: productDetails.otherTaxes || 0,
    };
    console.log("cartItem", userId);

    // Check if the item already exists in the cart
    const cartItemExists = await getCartItem(userId, productId);
    console.log("cartItemExists", cartItemExists);

    if (!cartItemExists) {
      // Insert new cart item
      await insertCartItem(cartItem);
    } else {
      // Update existing cart item (add to existing quantity)
      const newQuantity = cartItemExists.quantity + parsedQuantity;
      console.log("new qunatity", newQuantity);
      if (newQuantity > productDetails.stock) {
        return this.res.status(400).send({
          status: 0,
          message: "Total quantity exceeds available stock.",
        });
      }
      if (
        newQuantity < productDetails.minPurchaseQty ||
        newQuantity > productDetails.maxPurchaseQty
      ) {
        return this.res.status(400).send({
          status: 0,
          message: `Total quantity must be between ${productDetails.minPurchaseQty} and ${productDetails.maxPurchaseQty}.`,
        });
      }

      // Recalculate totalPrice for updated quantity
      let updatedTotalPrice;
      if (productDetails.discountType === "percentage") {
        updatedTotalPrice = unitPrice * newQuantity * (1 - productDetails.discount / 100);
      } else {
        updatedTotalPrice = unitPrice * newQuantity - productDetails.discount;
      }
      updatedTotalPrice = Math.max(0, parseFloat(updatedTotalPrice.toFixed(2)));

      const updatedCartItem = {
        ...cartItem,
        quantity: newQuantity,
        totalPrice: updatedTotalPrice,
      };

      console.log("updateItems", updatedCartItem);
      await updateCartItem(updatedCartItem);
    }

    // Get cart total and quantity
    const cartTotal = await getCartTotal(userId);
    const cartQuantity = await getCartQuantity(userId);

    return this.res.status(200).send({
      status: 1,
      message: cartItemExists
        ? "Cart item quantity updated successfully."
        : "Item added to cart successfully.",
      data: { cartTotal, cartQuantity },
    });
  } catch (error) {
    console.error("Error in addToCart:", error);
    return this.res.status(500).send({
      status: 0,
      message: "Internal server error.",
    });
  }
}






    async  updateAddToCart() {
        try {
          const userId = this.req.user;
          const dataArray = this.req.body;
      console.log(dataArray);
          // Check if the dataArray is an array
          if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return this.res.send({ status: 0, message: "Please send a valid array of cart items" });
          }
      
          const fieldsArray = ["productId", "quantity"];
      
          // Iterate through the dataArray and validate each cart item
          for (const data of dataArray) {
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
              return this.res.send({ status: 0, message: "Please send " + emptyFields.join(", ") + " fields required for each cart item." });
            }
      
            const productDetails = await getProductDetails(data.productId);
            if (!productDetails) {
              return this.res.send({ status: 0, message: 'Product details not found for one of the cart items.' });
            }
          }
      
          const bulkUpdates = [];
          const insertedProductIds = [];
      
          // Prepare the bulk updates
         
                
      
            // const cartItemExists = await getCartItem(userId, dataArray.productId);
      
            
                await bulkUpdateCartItem(dataArray, userId);
           
          
      
          // Execute all the bulk updates
        //   await Promise.all(bulkUpdates);
      
          // Get cart total and quantity after the bulk updates
          const cartTotal = await getCartTotal(userId);
          const cartQuantity = await getCartQuantity(userId);
      
          return this.res.send({ status: 1, message: 'Bulk cart update successful', data: { cartTotal, cartQuantity, insertedProductIds } });
        } catch (error) {
          console.error('Error:', error);
          return this.res.send({ status: 0, message: 'Internal server error' });
        }
      }



      async  updateAddToCartSingle() {
        try {
          const userId = this.req.user;
          const dataArray = this.req.body;
          // Check if the dataArray is an array
          if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return this.res.send({ status: 0, message: "Please send a valid array of cart items" });
          }
      
          const fieldsArray = ["productId", "quantity", "_id"];
      
          // Iterate through the dataArray and validate each cart item
          for (const data of dataArray) {
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
              return this.res.send({ status: 0, message: "Please send " + emptyFields.join(", ") + " fields required for each cart item." });
            }
      
            const productDetails = await getProductDetails(data.productId);
            if (!productDetails) {
              return this.res.send({ status: 0, message: 'Product details not found for one of the cart items.' });
            }
          }
      
          const bulkUpdates = [];
          const insertedProductIds = [];
      
          // Prepare the bulk updates
         
                
      
            // const cartItemExists = await getCartItem(userId, dataArray.productId);
      
            
                await bulkUpdateCartItemSignle(dataArray, userId);
           
          
      
          // Execute all the bulk updates
        //   await Promise.all(bulkUpdates);
      
          // Get cart total and quantity after the bulk updates
          const cartTotal = await getCartTotal(userId);
          const cartQuantity = await getCartQuantity(userId);
      
          return this.res.send({ status: 1, message: 'Bulk cart update successful', data: { cartTotal, cartQuantity, insertedProductIds } });
        } catch (error) {
          console.error('Error:', error);
          return this.res.send({ status: 0, message: 'Internal server error' });
        }
      }
      
   
  

    /********************************************************
  Purpose: Add and update products details in saveForLater
  Method: Post
  Authorisation: true
  Parameter:
  {
       "quantity":2,
       "productId":"5cd00e988566d30c6b8553cc",
       "productType":"Variant",
       "attributeId":"641b4911c56ee001379dd87f",
       "sizeId":"641b4911c56ee001379dd880",
       "type":"isEcommerce" or "isFood" or "isGame",
       "isBack": true
  }
  Return: JSON String
  ********************************************************/
    async saveForLater() {
        try {
            const userId = this.req.user;
            const data = this.req.body;
            const fields = ["productId", "productType", "quantity", "type"]
            const fieldsArray = data.productType == 'Simple' ?
                fields : [...fields, "attributeId", "sizeId"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            const cartKey = data.type == "isEcommerce" ? "ecommerceCart" : (data.type == "isFood" ? "foodCart" : "gameCart")
            const saveForLaterKey = data.type == "isEcommerce" ? "ecommerceSaveForLater" : (data.type == "isFood" ? "foodSaveForLater" : "gameSaveForLater")
            const cartProductId = data.type == "isEcommerce" ? "ecommerceCart.productId" :
                (data.type == "isFood" ? "foodCart.productId" : "gameCart.productId")
            const updateCartProductsQuantity = data.type == "isEcommerce" ? "ecommerceCart.$.quantity" :
                (data.type == "isFood" ? "foodCart.$.quantity" : "gameCart.$.quantity")
            const saveForLaterProductId = data.type == "isEcommerce" ? "ecommerceSaveForLater.productId" :
                (data.type == "isFood" ? "foodSaveForLater.productId" : "gameSaveForLater.productId")
            const updateSaveForLaterProductsQuantity = data.type == "isEcommerce" ? "ecommerceSaveForLater.$.quantity" :
                (data.type == "isFood" ? "foodSaveForLater.$.quantity" : "gameSaveForLater.$.quantity")

            const changingTerm = (data.isBack) ? [saveForLaterKey] : [cartKey]
            const key = (data.isBack) ? [cartKey] : [saveForLaterKey]
            const changingKey = (data.isBack) ? [cartProductId] : [saveForLaterProductId]
            const changingQuantity = (data.isBack) ? [updateCartProductsQuantity] : [updateSaveForLaterProductsQuantity]
            const checkingDetails = await Cart.findOne({ userId: userId });
            if (data.type == "isEcommerce") {
                const productDetails = await Products.findOne({ _id: data.productId, isDeleted: false })
                if (_.isEmpty(productDetails)) { return this.res.send({ status: 0, message: "Product details not found" }); }
            }
            if (data.type == "isFood") {
                const productDetails = await FoodProducts.findOne({ _id: data.productId, isDeleted: false })
                if (_.isEmpty(productDetails)) { return this.res.send({ status: 0, message: "Product details not found" }); }
            }
            if (data.type == "isGame") {
                const productDetails = await GameProducts.findOne({ _id: data.productId, isDeleted: false })
                if (_.isEmpty(productDetails)) { return this.res.send({ status: 0, message: "Product details not found" }); }
            }
            const value = {
                quantity: (data.quantity > 0) ? data.quantity : 1,
                productId: data.productId,
                productType: data.productType,
                attributeId: data.attributeId,
                sizeId: data.sizeId,
            }
            if (_.isEmpty(checkingDetails)) {
                const data = {
                    userId: userId,
                    [key]: [value]
                }
                const newCart = await new Model(Cart).store(data);
                if (_.isEmpty(newCart))
                    return this.res.send({ status: 0, message: "Details not saved" });
                return this.res.send({ status: 1, message: "Details added successfully" });
            }
            else {
                const cartDetails = await Cart.findOne({ userId: userId, [changingKey]: value.productId });
                if (_.isEmpty(cartDetails)) {
                    await Cart.findOneAndUpdate({ userId: userId }, { $pull: { [changingTerm]: { productId: data.productId } } });
                    const cartUpdate = await Cart.findOneAndUpdate({ userId: userId }, { $push: { [key]: value } }, { upsert: true, new: true });
                    if (_.isEmpty(cartUpdate))
                        return this.res.send({ status: 0, message: "Details not saved" });
                    return this.res.send({ status: 1, message: "Details added successfully" });
                }
                else {
                    await Cart.findOneAndUpdate({ userId: userId }, { $pull: { [changingTerm]: { productId: data.productId } } });
                    const cartUpdateDetails = await Cart.findOneAndUpdate({ userId: userId, [changingKey]: value.productId }, { $inc: { [changingQuantity]: value.quantity } }, { new: true, upsert: true })
                    if (_.isEmpty(cartUpdateDetails))
                        return this.res.send({ status: 0, message: "Details not updated" });
                    return this.res.send({ status: 1, message: "Details updated successfully" });
                }
            }
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Delete Product in Cart 
    Method: Post
    Authorisation: true
    Parameter:
    {
        "productId":"5cd01da1371dc7190b085f86",
        "type":"isEcommerce" or "isFood" or "isGame",
        "isCart": true,
    }
    Return: JSON String
    ********************************************************/

    async deleteCarts(userId, cartID) {
        console.log(userId, cartID);
        return new Promise((resolve, reject) => {
          const selectQuery = 'DELETE FROM cart WHERE userId = ? and _id = ?';
          connection.query(selectQuery, [userId, cartID], (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results.length);
            }
          });
        });
      }
    async deleteCartProducts() {
        try {
            const userId = this.req.user;
            const data = this.req.body;
            const fieldsArray = ["productId"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
                const deletionResult = await this.deleteCarts(userId, data.productId);
                return { status: 1, message: deletionResult+ "Cart item removed successfully" };
           
           
        } catch (error) {
            console.log(`error: ${error}`)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Getting Cart Details
    Method: POST
    {
        "type": "isEcommerce" or "isFood" or "isGame"
    }
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async getCartDetails() {
    try {
      const userId = this.req.user; // Assuming user ID is set in req.user (e.g., via authentication middleware)

      // Get cart details and totals
      const cartDetails = await this.getCartTotals(userId);

      if (_.isEmpty(cartDetails)) {
        return this.res.status(200).json({
          status: 0,
          message: 'Your cart is empty',
        });
      }

      // Format response to match frontend expectations
      return this.res.status(200).json({
        status: 1,
        message: 'Listing details are: ',
        data: {
          cartDetails: [cartDetails], // Wrap in array for consistency with original response
        },
      });
    } catch (error) {
      console.error('Error in getCartDetails:', error);
      return this.res.status(500).json({
        status: 0,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async getCartTotals(userId) {
  return new Promise((resolve, reject) => {
    // Query to fetch cart items, products, attributes, and aggregate totals
    const selectQuery = `
      SELECT 
        SUM(c.quantity) AS totalQuantity,
        SUM(c.quantity * p.unitprice) AS totalPrice,
        COUNT(c._id) AS totalCartItems,
        c._id AS cartId,
        p._id AS productId,
        p.name AS productName,
        p.unitprice AS price,
        p.productImage AS image,
        p.gallaryImages AS gallaryImages,
        c.quantity AS quantity,
        pa.attribute_name,
        pa.attribute_value
      FROM cart c
      JOIN products p ON c.productId = p._id
      LEFT JOIN product_attributes pa ON p._id = pa.product_id
      WHERE c.userId = ?
      GROUP BY c._id, p._id, p.name, p.unitprice, p.productImage, p.gallaryImages, c.quantity, pa.attribute_name, pa.attribute_value
    `;

    connection.query(selectQuery, [userId], (err, results) => {
      if (err) {
        return reject(new Error(`Database query failed: ${err.message}`));
      }

      if (results.length === 0) {
        return resolve({});
      }

      // Group results by cartId to combine attributes
      const cartMap = new Map();

      results.forEach((row) => {
        const cartId = Number(row.cartId); // Ensure cartId is a number

        // If cart item doesn't exist in map, initialize it
        if (!cartMap.has(cartId)) {
          cartMap.set(cartId, {
            cartId: Number(row.cartId),
            productId: Number(row.productId),
            name: row.productName,
            totalPrice: row.price,
            productImage: row.image,
            gallaryImages: row.gallaryImages ? JSON.parse(row.gallaryImages) : [], // Parse if stored as JSON string
            quantity: row.quantity,
            attributes: [], // Initialize attributes array
          });
        }

        // Add attributes (color, size, etc.) if they exist
        if (row.attribute_name && row.attribute_value) {
          cartMap.get(cartId).attributes.push({
            name: row.attribute_name,
            value: row.attribute_value,
          });
        }
      });

      // Convert Map to array for cartItems
      const cartItems = Array.from(cartMap.values());

      // Format results into the expected structure
      const cartDetails = {
        totalQuantity: results[0].totalQuantity || 0,
        totalPrice: results[0].totalPrice || 0,
        totalCartItems: results[0].totalCartItems || 0,
        cartItems,
        cartTotalRows: cartItems.length,
      };

      resolve(cartDetails);
    });
  });
}
    /****** getting cart Quantity of the particular product in the cart *******/
    async gettingCartQuantity(userId, type) {
        return new Promise(async (resolve, reject) => {
            try {
                const cartKey = type == "isEcommerce" ? "ecommerceCart" : (type == "isFood" ? "foodCart" : "gameCart")
                const cartDetails = await Cart.findOne({ userId: userId }, { [cartKey]: 1 });
                if (_.isEmpty(cartDetails)) { return this.res.send({ status: 0, message: "There is no data to display" }); }
                console.log(`cartDetails: ${JSON.stringify(cartDetails)}`)
                let quantity = 0;
                const productsArray = cartDetails[cartKey]
                await productsArray.map(data => {
                    quantity += data.quantity;
                })
                resolve(quantity)
            } catch (error) {
                reject(error)
            }
        })
    }

    /********************************************************
   Purpose: Getting order summary
   Method: POST
   {
       "type": "isEcommerce" or "isFood" or "isGame",
       "pincode":"533287"
   }
   Authorisation: true
   Return: JSON String
   ********************************************************/
    async getOrderSummary() {
        try {
            const userId = this.req.user;
            const data = this.req.body;
            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send a type value" })
            }
            if (data.type == "isEcommerce" && !data.pincode) {
                return this.res.send({ status: 0, message: "Please send a pincode details" })
            }
            /****** getting cart Total *******/
            const details = await this.gettingCartTotal(userId, data.type);
            console.log(`details: ${JSON.stringify(details)}`)
            if (_.isEmpty(details)) { return this.res.send({ status: 0, message: "There is no data to display" }); }
            const quantity = await this.gettingCartQuantity(userId, data.type);
            const userDetails = await Users.findOne({ _id: userId, isDeleted: false }, { wallet: 1 });
            if (_.isEmpty(userDetails)) { return this.res.send({ status: 0, message: "User details not found" }); }
            let data1 = { cartTotal: details.cartValue, quantity, wallet: userDetails.wallet }
            if (data.type == "isEcommerce") {
                const chargesResult = await this.getShippingCharges({ details, userPincode: data.pincode });
                if (chargesResult.status == 1) {
                    data1.shippingCharges = chargesResult.data
                } else {
                    return this.res.send({ status: 0, message: "Unable to fetch shipping charges" });
                }
            }
            if (data.type == "isFood") {
                const chargesResult = await this.getPackagingAndDelieveryCharges({ details });
                if (chargesResult.status == 1) {
                    data1.packagingCharges = chargesResult.data.packagingCharges
                    data1.deliveryCharges = chargesResult.data.deliveryCharges
                } else {
                    return this.res.send({ status: 0, message: "Unable to fetch packaging and delivery charges" });
                }
            }
            return this.res.send({ status: 1, message: "Listing details are: ", data: data1 });
        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    async getShippingCharges({ details, userPincode }) {
        return new Promise(async (resolve, reject) => {
            try {
                let shippingCharges = 0;
                const cartDetails = details.cartDetails
                for (let i = 0; i < cartDetails.length; i++) {
                    const data = {
                        "from_pincode": cartDetails[i].storeAddress.pincode,
                        "to_pincode": userPincode,
                        "shipping_length_cms": cartDetails[i].length,
                        "shipping_width_cms": cartDetails[i].width,
                        "shipping_height_cms": cartDetails[i].height,
                        "shipping_weight_kg": cartDetails[i].weight / 1000, // converting gms into Kgs
                        "order_type": "forward",
                        "payment_method": "prepaid",
                        "product_mrp": details.cartValue
                    }
                    console.log(`ithink data: ${JSON.stringify(data)}`)
                    const ithinkController = await new IthinkController();
                    const response = await ithinkController.getRateDetails({ ithinkData: data });
                    if (response.status == 1) {
                        const requiredData = response.data.data;
                        console.log(`requiredData: ${JSON.stringify(requiredData)}`)
                        const finalData = requiredData && requiredData.length > 0 ? await requiredData.find(res => {
                            return (res.prepaid == "Y" && res.cod == "Y" && res.pickup == "Y" && res.rev_pickup == "Y")
                        }) : 0;
                        console.log(`finalData: ${JSON.stringify(finalData)}`)
                        if (finalData) {
                            shippingCharges += (finalData.rate * cartDetails[i].quantity)
                        }
                    }
                }
                resolve({ status: 1, data: shippingCharges })
            } catch (error) {
                console.log("error", error)
                resolve({ status: 0, message: "Internal server error" });
            }
        })
    }

    async getPackagingAndDelieveryCharges({ details }) {
        return new Promise(async (resolve, reject) => {
            try {
                let packagingCharges = 0, deliveryCharges = 0;
                const cartDetails = details.cartDetails
                for (let i = 0; i < cartDetails.length; i++) {
                    packagingCharges += cartDetails[i].packagingCharges * cartDetails[i].quantity;
                    deliveryCharges += cartDetails[i].deliveryCharges;
                }
                resolve({ status: 1, data: { packagingCharges, deliveryCharges } })
            } catch (error) {
                console.log("error", error)
                resolve({ status: 0, message: "Internal server error" });
            }
        })
    }


}
module.exports = CartController
