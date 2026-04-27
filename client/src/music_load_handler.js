import express from 'express';
import {sequelize} from "../../models";

const app = express();

try {
    await sequelize.authenticate();
    console.log('Connected');
} catch (err) {
    console.error(err);
    await sequelize.close();
}

app.listen(8000, () => {
    console.log('Handler working on port 8000');
})