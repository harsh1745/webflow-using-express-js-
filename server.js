const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const WEBFLOW_TOKEN = process.env.WEBFLOW_TOKEN;
const COLLECTION_ID = process.env.COLLECTION_ID;
const WEBFLOW_API_BASE = 'https://api.webflow.com/v2';

app.get('/', (req, res) => {
  res.json({
    status: 'Server is running',
  });
});


// ======================
// Submit Form API
// ======================
app.post('/api/submit-form', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: "Name and Email are required"
      });
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
          Authorization: `Bearer ${WEBFLOW_TOKEN}`,
          'Content-Type': 'application/json',
          accept: 'application/json'
        }
      }
    );

    res.json({
      success: true,
      message: "Form submitted successfully",
      item: response.data
    });

  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: "Submission failed"
    });
  }
});


// ======================
// Get Submissions API
// ======================
app.get('/api/get-submissions', async (req, res) => {
  try {
    const response = await axios.get(
      `${WEBFLOW_API_BASE}/collections/${COLLECTION_ID}/items`,
      {
        headers: {
          Authorization: `Bearer ${WEBFLOW_TOKEN}`,
          accept: 'application/json'
        }
      }
    );

    res.json({
      success: true,
      data: response.data.items || [],
      total: response.data.items?.length || 0
    });

  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: "Failed to fetch submissions"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
