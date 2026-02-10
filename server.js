const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const WEBFLOW_TOKEN = process.env.WEBFLOW_TOKEN;
const COLLECTION_ID = process.env.COLLECTION_ID;
const WEBFLOW_API_BASE = 'https://api.webflow.com/v2';

app.get('/', (req, res) => {
  res.json({
    status: 'Server is running',
    message: 'Webflow Form API is active'
  });
});

app.post('/api/submit-form', async (req, res) => {
  try {
    console.log('Form data received:', req.body);

    const { name, email, phone, message } = req.body;

    if (!name || !email) {
      return res.status(400).send(`
        <html>
          <body>
            <h2>Error: Name and Email are required</h2>
            <a href="javascript:history.back()">Go Back</a>
          </body>
        </html>
      `);
    }

    const response = await axios.post(
      `${WEBFLOW_API_BASE}/collections/${COLLECTION_ID}/items`,
      {
        isArchived: false,
        isDraft: false,
        fieldData: {
          name: name,
          slug: `lead-${Date.now()}`,
          email: email,
          phone: phone || '',
          message: message || ''
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        }
      }
    );

    console.log('Webflow API Response:', response.data);

    res.send(`
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 50px;
              background: #f0f0f0;
            }
            .success-box {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 500px;
              margin: 0 auto;
            }
            h1 { color: #4CAF50; }
            a {
              display: inline-block;
              margin-top: 20px;
              padding: 10px 20px;
              background: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="success-box">
            <h1>✅ Success!</h1>
            <p>Your form has been submitted successfully.</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <a href="${req.get('referer') || '/'}">Back to Form</a>
          </div>
          <script>
            // 3 seconds me automatically redirect
            setTimeout(() => {
              window.location.href = document.referrer || '/';
            }, 3000);
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).send(`
      <html>
        <body>
          <h2>❌ Error submitting form</h2>
          <p>${error.response?.data?.message || 'Something went wrong'}</p>
          <a href="javascript:history.back()">Go Back</a>
        </body>
      </html>
    `);
  }
});

app.get('/api/get-submissions', async (req, res) => {
  try {
    const response = await axios.get(
      `${WEBFLOW_API_BASE}/collections/${COLLECTION_ID}/items`,
      {
        headers: {
          'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
          'accept': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      data: response.data.items || [],
      total: response.data.items?.length || 0
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions'
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  
});