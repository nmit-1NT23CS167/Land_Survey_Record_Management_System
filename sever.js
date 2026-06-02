
// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 5500;

// MongoDB connection
mongoose.connect("connection string/", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Mongoose schema
const SurveySchema = new mongoose.Schema({
    plot_number: String,
    owner_name: String,
    area: String,
    lat: String,
    lng: String,
    state: String,
    country: String,
    date: String
});

const Survey = mongoose.model('Survey', SurveySchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

// Insert Route
app.post('/insert', async (req, res) => {
    const newSurvey = new Survey(req.body);
    await newSurvey.save();
    res.send("Record inserted successfully! <a href='/'>Go Back</a>");
});

// Search Route
app.post('/search', async (req, res) => {
    const query = {};
    if (req.body.plot_number) query.plot_number = req.body.plot_number;
    if (req.body.owner_name) query.owner_name = req.body.owner_name;
    if (req.body.area) query.area = req.body.area;
    if (req.body.state) query.state = req.body.state;
    if (req.body.country) query.country = req.body.country;
    if (req.body.date) query.date = req.body.date;

    const results = await Survey.find(query);
    res.render('results', { records: results });
});

//Update
app.post('/update', async (req, res) => {
    const { plot_number, owner_name, area, lat, lng, date } = req.body;

    try {
        const result = await Survey.updateOne(
            { plot_number },
            {
                $set: {
                    ...(owner_name && { owner_name }),
                    ...(area && { area }),
                    ...(lat && { lat }),
                    ...(lng && { lng }),
                    ...(date && { date })
                }
            }
        );

        if (result.modifiedCount > 0) {
            res.send('Record updated successfully.');
        } else {
            res.send('No matching record found or no changes made.');
        }
    } catch (err) {
        res.status(500).send('Update failed: ' + err.message);
    }
});

//Delete
app.post('/delete', async (req, res) => {
    const { plot_number } = req.body;

    try {
        const result = await Survey.deleteOne({ plot_number });

        if (result.deletedCount > 0) {
            res.send('Record deleted successfully.');
        } else {
            res.send('No record found with that plot number.');
        }
    } catch (err) {
        res.status(500).send('Delete failed: ' + err.message);
    }
});

// Start server
app.listen(5500, '0.0.0.0', () => {
    console.log("Server started on all interfaces");
});

