const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Reto Rimac Backend API',
            version: '1.1.0',
            description: 'API para el agendamiento de citas médicas en Perú y Chile',
        },
    },
    apis: ['./src/handlers/*.ts'], // Ruta a tus archivos de controladores
};

const specs = swaggerJsdoc(options);

module.exports = specs;