/**
 * Helper script to generate bcrypt password hashes for seed data
 * 
 * Usage: node data/generate-password-hashes.js
 * 
 * This will output bcrypt hashes that you can use in seed-users.json
 */

const bcrypt = require('bcryptjs');

const password = 'password123'; // Default password for all seed users
const rounds = 10;

console.log('Generating bcrypt hash for password:', password);
console.log('Rounds:', rounds);
console.log('');

const hash = bcrypt.hashSync(password, rounds);
console.log('Generated hash:');
console.log(hash);
console.log('');
console.log('Copy this hash and replace the placeholder passwords in seed-users.json');
console.log('All users will have the password: password123');



