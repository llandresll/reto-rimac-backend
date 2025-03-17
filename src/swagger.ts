import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from 'swaggerConfig';

const app = express();

// Ruta para la documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Swagger UI is running on port ${port}`);
});