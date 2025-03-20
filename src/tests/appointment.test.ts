import { handler } from '../handlers/appointment';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDB, SNS, config as AWSConfig } from 'aws-sdk';
import dotenv from 'dotenv';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

// Configurar la región para AWS SDK
AWSConfig.update({ region: process.env.AWS_REGION || 'us-east-1' });

// Mock de DynamoDB.DocumentClient
const mockDynamoDb = {
    put: jest.fn().mockReturnThis(),
    query: jest.fn().mockReturnThis(),
    promise: jest.fn(),
};

// Mock de SNS
const mockSns = {
    publish: jest.fn().mockReturnThis(),
    promise: jest.fn(),
};

describe('Appointment Handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create an appointment successfully', async () => {
        // Configurar los mocks
        mockDynamoDb.put().promise.mockResolvedValue({});
        mockSns.publish().promise.mockResolvedValue({});

        const event: APIGatewayProxyEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({
                insuredId: '123',
                scheduleId: 456,
                countryISO: 'PE',
            }),
            headers: {},
            path: '/appointments',
            isBase64Encoded: false,
            queryStringParameters: null,
            pathParameters: null,
            stageVariables: null,
            resource: '',
            multiValueHeaders: {},
            multiValueQueryStringParameters: null,
            requestContext: {} as any,
        };

        const result = await handler(event);
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).message).toBe('Cita médica en proceso de agendamiento');
        expect(mockDynamoDb.put).toHaveBeenCalled();
        expect(mockSns.publish).toHaveBeenCalled();
    });

    it('should get appointments by insuredId successfully', async () => {
        // Configurar el mock para devolver una lista de citas
        mockDynamoDb.query().promise.mockResolvedValue({
            Items: [
                {
                    appointmentId: '456',
                    insuredId: '123',
                    countryISO: 'PE',
                    status: 'pending',
                },
            ],
        });

        const event: APIGatewayProxyEvent = {
            httpMethod: 'GET',
            body: null,
            path: '/appointments/123',
            headers: {},
            isBase64Encoded: false,
            queryStringParameters: null,
            pathParameters: { insuredId: '123' },
            stageVariables: null,
            resource: '',
            multiValueHeaders: {},
            multiValueQueryStringParameters: null,
            requestContext: {} as any,
        };

        const result = await handler(event);
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual([
            {
                appointmentId: '456',
                insuredId: '123',
                countryISO: 'PE',
                status: 'pending',
            },
        ]);
        expect(mockDynamoDb.query).toHaveBeenCalled();
    });

    it('should return 405 for unsupported HTTP methods', async () => {
        const event: APIGatewayProxyEvent = {
            httpMethod: 'PUT',
            body: JSON.stringify({}),
            path: '/appointments',
            headers: {},
            isBase64Encoded: false,
            queryStringParameters: null,
            pathParameters: null,
            stageVariables: null,
            resource: '',
            multiValueHeaders: {},
            multiValueQueryStringParameters: null,
            requestContext: {} as any,
        };

        const result = await handler(event);
        expect(result.statusCode).toBe(405);
        expect(JSON.parse(result.body).message).toBe('Método no permitido');
    });

    it('should return 400 if request body is missing for POST', async () => {
        const event: APIGatewayProxyEvent = {
            httpMethod: 'POST',
            body: null,
            headers: {},
            path: '/appointments',
            isBase64Encoded: false,
            queryStringParameters: null,
            pathParameters: null,
            stageVariables: null,
            resource: '',
            multiValueHeaders: {},
            multiValueQueryStringParameters: null,
            requestContext: {} as any,
        };

        const result = await handler(event);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe('Cuerpo de la solicitud no proporcionado');
    });
});