const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' }); // Adjust path if needed

const User = require('./models/UserModel');

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const users = await User.find({});
        console.log('Users found:', users.length);
        users.forEach(u => {
            console.log(`- ${u.name} (${u.email}) [${u.role}]`);
        });

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUsers();
