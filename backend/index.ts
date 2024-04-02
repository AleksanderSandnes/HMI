import express, { Express } from 'express';
import weatherRoutes from './routes/weather';
// import growattRoutes from './routes/growatt';
// import elhubRoutes from './routes/elhub';

const app: Express = express();
const port: number = 3000;

app.use('/weather', weatherRoutes);
// app.use('/growatt', growattRoutes);
// app.use('/elhub', elhubRoutes);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});