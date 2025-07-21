const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

/* This API implements two core entities: (1) Destination entity with GET /destinations (list) and /destinations/:id (detail) endpoints for data retrieval plus POST /destinations for creation, 
and (2) Preference entity with GET /preferences/:userId (list) and /preferences/:userId/:label (detail) endpoints for retrieval along with POST /preferences for creation, supplemented by testing endpoints. */

const data = {
  destinations: [
    { id: 1, name: "Marrakesh", climate: "arid", budget: "medium", bestTime: "Spring/Fall" },
    { id: 2, name: "Phuket", climate: "tropical", budget: "medium", bestTime: "November-April" },
    { id: 3, name: "Rome", climate: "mediterranean", budget: "high", bestTime: "April-June" },
    { id: 4, name: "New York", climate: "continental", budget: "high", bestTime: "April-June/September-November" },
    { id: 5, name: "Rio de Janeiro", climate: "tropical", budget: "medium", bestTime: "December-March" }
  ],
  userPreferences: {},
  preferenceCount: 0
};
// I use it to wipe all data back to default when things get messy during tests.

app.post('/test/reset', (req, res) => {
  data.destinations = [
    { id: 1, name: "Marrakesh", climate: "arid", budget: "medium", bestTime: "Spring/Fall" },
    { id: 2, name: "Phuket", climate: "tropical", budget: "medium", bestTime: "November-April" },
    { id: 3, name: "Rome", climate: "mediterranean", budget: "high", bestTime: "April-June" },
    { id: 4, name: "New York", climate: "continental", budget: "high", bestTime: "April-June/September-November" },
    { id: 5, name: "Rio de Janeiro", climate: "tropical", budget: "medium", bestTime: "December-March" }
  ];
  data.userPreferences = {};
  data.preferenceCount = 0;
  res.status(200).send();
});

app.get('/destinations', (req, res) => {
  res.json(data.destinations.map(d => ({ id: d.id, name: d.name })));
});

app.get('/destinations/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID format" });
  
  const destination = data.destinations.find(d => d.id === id);
  if (!destination) return res.status(404).json({ error: "Destination not found" });
  res.json(destination);
});

app.post('/destinations', (req, res) => {
  const { name, climate, budget, bestTime } = req.body;
  if (!name || !climate || !budget || !bestTime) {
    return res.status(400).json({ error: "All fields required" });
  }

  const newDestination = {
    id: data.destinations.length + 1,
    name,
    climate,
    budget,
    bestTime
  };
  data.destinations.push(newDestination);
  res.status(201).json(newDestination);
});

app.post('/preferences', (req, res) => {
  const { userId, climate, budget } = req.body;
  if (!userId || !climate || !budget) {
    return res.status(400).json({ error: "All fields required" });
  }

  data.preferenceCount++;
  const label = `Preference ${data.preferenceCount}`;
  data.userPreferences[label] = { userId, climate, budget };

  res.status(201).json({ label });
});

// Handy when I'm testing preferences over and over without restarting the server.

app.post('/preferences/reset', (req, res) => {
    data.userPreferences = {};
    data.preferenceCount = 0;
    res.status(200).send();
  });

app.get('/preferences/:userId', (req, res) => {
  const userId = req.params.userId;
  const prefs = Object.entries(data.userPreferences)
    .filter(([_, v]) => v.userId === userId)
    .map(([label, data]) => ({
      label,
      climate: data.climate,
      budget: data.budget
    }));

  res.json(prefs.length ? prefs : []);
});

app.get('/preferences/:userId/:label', (req, res) => {
  const { userId, label } = req.params;
  const pref = data.userPreferences[label];

  if (!pref || pref.userId !== userId) {
    return res.status(404).json({ error: "Preference not found" });
  }

  res.json({
    label,
    climate: pref.climate,
    budget: pref.budget
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

module.exports = app;

if (require.main === module) {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}