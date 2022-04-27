const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (!foundOrder) {
    next({status: 404, message: `Order Id ${orderId} not found`});
  }
  res.locals.order = foundOrder;
  next()
}

function list(req, res) {
  res.json({ data: orders });
}

function read(req, res) {
  const foundOrder = res.locals.order;
  res.json({ data: foundOrder });
}

function create(req, res) {
  const {
    data: { deliverTo, mobileNumber, dishes },
  } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    data[propertyName]
      ? next()
      : next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

function dishesValidation(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  res.locals.dishes = dishes;
  Array.isArray(dishes) && dishes.length > 0
    ? next()
    : next({ status: 400, message: "Order must include atleast one dish" });
}

function dishesQuantityValidation(req, res, next) {
  const dishes = res.locals.dishes;
  dishes.map((dish, index) => !dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity) ? next({status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0`}) : null)
  next();
}

function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newDishes = dishes.filter((dish) => dish.quantity > 0)

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = newDishes;

  res.json({ data: order });
}


module.exports = {
  list,
  read: [orderExists, read],
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesValidation,
    dishesQuantityValidation,
    create,
  ],
  update: [orderExists, update]
};
