const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-complete', 'root', 'Quang013.', {
    dialect: 'mysql',
    host: 'localhost'
});

module.exports = sequelize;