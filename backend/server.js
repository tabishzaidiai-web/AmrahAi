const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.use(cors());
app.use(express.json());

// Middleware to validate Supabase JWT
const validateAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ message: 'Invalid token' });

  req.user = user;
  next();
};

const generateRoutes = require('./routes/generate');
const stripeRoutes = require('./routes/stripe');
const paypalRoutes = require('./routes/paypal');

app.use('/api', validateAuth, generateRoutes);
app.use('/api/stripe', validateAuth, stripeRoutes);
app.use('/api/paypal', validateAuth, paypalRoutes);

app.listen(port, () => {
  console.log(`Maison server running on port ${port}`);
});
