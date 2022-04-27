const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// List function sends a response with the data from the dishes-data file and displays it for use.
function list(req, res) {
  res.json({ data: dishes });
}

// read finds a specific dish in the data file and responds with the matching data.
function read(req, res) {
  const foundDish = res.locals.dish;
  res.json({ data: foundDish });
}

// create makes a news dish with a name, description, price, and image_url provided in the request body and pushes it to the dishes array.
function create(req, res) {
  const {
    data: { name, description, price, image_url },
  } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// update will read an existing dish and allow changes to be made, assuming the changes are validated properly.
function update(req, res) {
  const foundDish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;

  res.json({ data: foundDish });
}

// dishExists will check if a dishId matches a dish before moving on to the next middleware.
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    next();
  }

  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  });
}

// bodyDataHas will check if the body of our request includes the specified string as a key before proceeding.
function bodyDataHas(propertyName) {
  return function checkData(req, res, next) {
    const { data = {} } = req.body;
    data[propertyName]
      ? next()
      : next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

function validateExistingId(req, res, next) {
  const dish = res.locals.dish;
  const { data: { id } = {} } = req.body;
  dish.id === id || !id
    ? next()
    : next({ status: 400, message: `Dish id does not match ${id}` });
}

function validatePrice(req, res, next) {
  const { data: { price } = {} } = req.body;
  Number.isInteger(price) && price > 0
    ? next()
    : next({
        status: 400,
        message: `Dish must have a price that is an integer greater than 0`,
      });
}



module.exports = {
  list,
  read: [dishExists, read],
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("image_url"),
    validatePrice,
    create,
  ],
  update: [
    dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("image_url"),
    validatePrice,
    validateExistingId,
    update,
  ],
};
