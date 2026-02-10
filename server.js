const express = require('express');
const cors = require('cors');
const Airtable = require('airtable');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

// ======================
// Airtable Config
// ======================
const base = new Airtable({
  apiKey: process.env.AIRTABLE_TOKEN
}).base(process.env.AIRTABLE_BASE_ID);

const TABLE = process.env.AIRTABLE_TABLE_NAME;

// ======================
// Health Check
// ======================
app.get('/', (req, res) => {
  res.json({ status: 'Server running with Airtable' });
});

// ======================
// Submit Form → Airtable
// ======================
// app.post('/api/submit-form', async (req, res) => {
//   try {
//     const { name, email, phone, message } = req.body;

//     if (!name || !email) {
//       return res.json({
//         success: false,
//         error: "Name and Email required"
//       });
//     }

//     await base(TABLE).create([
//       {
//         fields: {
//           Name: name,
//           Email: email,
//           Phone: phone || '',
//           Message: message || ''
//         }
//       }
//     ]);

//     res.json({
//       success: true,
//       message: "Saved to Airtable"
//     });

//   } catch (error) {
//     console.error(error);
//     res.json({
//       success: false,
//       error: "Airtable save failed"
//     });
//   }
// });
// ======================
// Submit Form → Airtable (No Duplicate Email)
// ======================
app.post('/api/submit-form', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email) {
      return res.json({
        success: false,
        error: "Name and Email required"
      });
    }

    // ======================
    // Check Duplicate Email
    // ======================
    const existingRecords = [];

    await base(TABLE)
      .select({
        filterByFormula: `{Email} = "${email}"`
      })
      .eachPage(function page(records, fetchNextPage) {
        records.forEach(record => existingRecords.push(record));
        fetchNextPage();
      });

    if (existingRecords.length > 0) {
      return res.json({
        success: false,
        error: "Email already exists"
      });
    }

    // ======================
    // Create Record
    // ======================
    await base(TABLE).create([
      {
        fields: {
          Name: name,
          Email: email,
          Phone: phone || '',
          Message: message || ''
        }
      }
    ]);

    res.json({
      success: true,
      message: "Saved to Airtable"
    });

  } catch (error) {
    console.error("Airtable Error:", error);
    res.json({
      success: false,
      error: "Airtable save failed"
    });
  }
});


// ======================
// Get Data from Airtable
// ======================
app.get('/api/get-submissions', async (req, res) => {
  try {
    const records = [];

    await base(TABLE)
      .select({ sort: [{ field: "Created", direction: "desc" }] })
      .eachPage(function page(recordsPage, fetchNextPage) {
        recordsPage.forEach(record => {
          records.push({
            id: record.id,
            fieldData: {
              name: record.get('Name'),
              email: record.get('Email'),
              phone: record.get('Phone'),
              message: record.get('Message')
            },
            createdOn: record._rawJson.createdTime
          });
        });

        fetchNextPage();
      });

    res.json({
      success: true,
      data: records,
      total: records.length
    });

  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      error: "Failed to fetch Airtable data"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
