const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// The first 5 functions are our major handlers, the rest are middleware for validation and data tracking;
function list(req, res) {
  res.json({ data: orders });
}

function read(req, res) {
  const foundOrder = res.locals.order;
  res.json({ data: foundOrder });
}

// create makes a news order with an id, deliverTo, mobileNumber, and dishes provided in the request body and pushes it to the dishes array.
function create(req, res) {
  //this data is the data from our request body, destructured for easier access.
  const {
    data: { deliverTo, mobileNumber, dishes },
  } = res.locals.bodyData;

  //we create a newOrder with information from our request body and a randomized id and push it into the orders array to create a new entry.
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}


function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newDishes = dishes.filter((dish) => dish.quantity > 0);

  // for the update we are changing each property of the order object to the corresponding ones in the request body.
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = newDishes;

  res.json({ data: order });
}

function destroy(req, res, next) {
  const index = res.locals.orderIndex;
  // `splice()` returns an array of the deleted elements, even if it is one element
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

// only use in destroy but I wanted to keep single responsibility in mind, this function finds the index of the designated order from the orderId.
function findIndex(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  res.locals.orderIndex = index;
  next();
}

// orderExists searches our orders array to find a matching order Id and returns the complete order object for use in many other functions.
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (!foundOrder) {
    next({ status: 404, message: `Order Id ${orderId} not found` });
  }
  res.locals.order = foundOrder;
  next();
}

// Will check the body data object to find keys matching the specified propertyName.

function bodyDataHasDeliverTo(req, res, next) {
  const { data = {} } = req.body;
  res.locals.bodyData = req.body;
  data["deliverTo"]
    ? next()
    : next({ status: 400, message: `Order must include a deliverTo property` });
}

function bodyDataHasMobileNumber(req, res, next) {
  const { data = {} } = req.body;
  res.locals.bodyData = req.body;
  data["mobileNumber"]
    ? next()
    : next({ status: 400, message: `Order must include a mobileNumber property` });
}

function bodyDataHasDishes(req, res, next) {
  const { data = {} } = req.body;
  res.locals.bodyData = req.body;
  data["dishes"]
    ? next()
    : next({ status: 400, message: `Order must include a dishes property` });
}

//both dish validations handle seperate responsibilites as you cant have dishesQuantity without validating dishes in exist and are an array first.
function dishesValidation(req, res, next) {
  const {
    data: { dishes },
  } = res.locals.bodyData;
  res.locals.dishes = dishes;
  Array.isArray(dishes) && dishes.length > 0
    ? next()
    : next({ status: 400, message: "Order must include atleast one dish" });
}

function dishesQuantityValidation(req, res, next) {
  const dishes = res.locals.dishes;
  const validateDishes = dishes.map((dish, index) =>
    !dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity)
      ? next({
          status: 400,
          message: `Dish ${index} must have a quantity that is an integer greater than 0`,
        })
      : null
  );
  next();
}
//attempts to match our orderId with the id in our update, otherwise returns an error if it cannot
function validateExistingId(req, res, next) {
  const order = res.locals.order;
  const { data: { id } = {} } = req.body;
  order.id === id || !id
    ? next()
    : next({ status: 400, message: `Order id does not match ${id}` });
}

// checks the order.status for "delivered"
function isOrderDelivered(req, res, next) {
  const order = res.locals.order;
  if (order.status === "delivered") {
    next({ status: 400, message: "A delivered order cannot be changed" });
  }
  next();
}

//checks the data in our request body to ensure any updates include validStatus of 1 of 4 options.
function validateStatus(req, res, next) {
  const { data: order } = req.body;
  const validStatus = [
    "pending",
    "preparing",
    "out-for-delivery",
    "delievered",
  ];
  !order.status || !validStatus.includes(order.status)
    ? next({
        status: 400,
        message:
          "Order must have a status of pending, preparing, out-for-delivery, delivered",
      })
    : next();
}

//ensures a pending order cannot be deleted with destroy by checking for "pending" in the order.status
function isOrderPending(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "pending") {
    next({ status: 400, message: "Cannot delete a non-pending order" });
  }
  next();
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    bodyDataHasDeliverTo,
    bodyDataHasMobileNumber,
    bodyDataHasDishes,
    dishesValidation,
    dishesQuantityValidation,
    create,
  ],
  update: [
    orderExists,
    isOrderDelivered,
    validateStatus,
    bodyDataHasDeliverTo,
    bodyDataHasMobileNumber,
    bodyDataHasDishes,
    dishesValidation,
    dishesQuantityValidation,
    validateExistingId,
    update,
  ],
  delete: [orderExists, findIndex, isOrderPending, destroy],
};
