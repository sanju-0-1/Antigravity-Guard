require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const promoteToAdmin = async (email) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      console.log('User not found');
    } else {
      console.log(`Success: ${user.username} is now an admin.`);
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
};

// Replace with your email to promote yourself
const emailToPromote = process.argv[2];
if (!emailToPromote) {
  console.log('Please provide an email: node makeAdmin.js user@example.com');
  process.exit(1);
}

promoteToAdmin(emailToPromote);
