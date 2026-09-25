const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

const generarPasswordHash = (password) => bcrypt.hash(password, SALT_ROUNDS);
const verificarPassword = (password, passwordHash) => bcrypt.compare(password, passwordHash);

module.exports = { SALT_ROUNDS, generarPasswordHash, verificarPassword };
