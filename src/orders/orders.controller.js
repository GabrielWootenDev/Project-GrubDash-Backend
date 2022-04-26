const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: orders });
}

function read(req, res) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  res.json({ data: foundOrder });
}

module.exports = {
  list,
  read
};
