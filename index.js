const express = require('express');
const cors = require("cors");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    const dummyData = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        message: 'Hello, this is some dummy data!!!'
    };

    res.json(dummyData);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})