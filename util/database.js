const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-complete', 'root', 'Quang013.', {
    dielect: 'mysql',
    host: 'localhost'
});

module.exports = sequelize;