// server.js
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('./models/user'); // Assuming you have a User model
const { sendResetEmail } = require('./emailService'); // Email service to send emails

const app = express();
app.use(express.json());

app.post('/api/users/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Store hashed token in DB and set expiry
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();

    // Send email with reset link (to be implemented in emailService.js)
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    sendResetEmail(user.email, resetUrl);

    res.send({ message: 'Password reset link sent' });
  } catch (error) {
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password,12);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '1h' }); // Replace 'your_jwt_secret' with your actual secret
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Password reset request endpoint
app.post('/api/password-reset-request', async (req, res) => {
  // Your password reset request logic here
});

// Password reset endpoint
app.post('/api/users/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const hashedToken = await bcrypt.hash(token, 10);
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send({ error: 'Password reset token is invalid or has expired' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.send({ message: 'Password has been changed' });
  } catch (error) {
    res.status(500).send({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
