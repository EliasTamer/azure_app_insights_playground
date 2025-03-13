const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 8080;


app.get('/', (req, res) => {
  res.send('Hello from App Insights Playground!');
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});