import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB, SNS } from 'aws-sdk';

// Constantes para evitar "magic strings"
const APPOINTMENTS_TABLE = process.env.APPOINTMENTS_TABLE!;
const SNS_TOPIC_PE_ARN = process.env.SNS_TOPIC_PE_ARN!;
const SNS_TOPIC_CL_ARN = process.env.SNS_TOPIC_CL_ARN!;

// Inicializar clientes de AWS
const dynamoDb = new DynamoDB.DocumentClient();
const sns = new SNS();

// Tipos para mejorar la legibilidad y seguridad del código
type Appointment = {
    appointmentId: string;
    insuredId: string;
    countryISO: string;
    status: string;
    createdAt: string;
};

type CreateAppointmentRequest = {
    insuredId: string;
    scheduleId: number;
    countryISO: string;
};

/**
 * Valida el cuerpo de la solicitud para crear una cita.
 * @param body - Cuerpo de la solicitud.
 * @throws Error si la validación falla.
 */
const validateCreateAppointmentRequest = (body: any): body is CreateAppointmentRequest => {
    if (!body.insuredId || !body.scheduleId || !body.countryISO) {
        throw new Error('Faltan campos requeridos: insuredId, scheduleId, countryISO');
    }
    if (body.countryISO !== 'PE' && body.countryISO !== 'CL') {
        throw new Error('El campo countryISO debe ser "PE" o "CL"');
    }
    return true;
};


/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       properties:
 *         appointmentId:
 *           type: string
 *         insuredId:
 *           type: string
 *         countryISO:
 *           type: string
 *         status:
 *           type: string
 *         createdAt:
 *           type: string
 *     CreateAppointmentRequest:
 *       type: object
 *       required:
 *         - insuredId
 *         - scheduleId
 *         - countryISO
 *       properties:
 *         insuredId:
 *           type: string
 *         scheduleId:
 *           type: number
 *         countryISO:
 *           type: string
 */

/**
 * @swagger
 * /appointment:
 *   post:
 *     summary: Create an appointment
 *     description: Creates a new medical appointment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAppointmentRequest'
 *     responses:
 *       200:
 *         description: Appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
/**
 * Crea una cita médica en DynamoDB.
 * @param appointment - Datos de la cita.
 */
const createAppointment = async (appointment: Appointment): Promise<void> => {
    await dynamoDb.put({
        TableName: APPOINTMENTS_TABLE,
        Item: appointment,
    }).promise();
};

/**
 * @swagger
 * /appointment/{insuredId}:
 *   get:
 *     summary: Get appointments by insuredId
 *     description: Retrieves appointments for a given insuredId
 *     parameters:
 *       - in: path
 *         name: insuredId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the insured
 *     responses:
 *       200:
 *         description: List of appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 *       500:
 *         description: Internal server error
 */
/**
 * Publica un mensaje en el tópico de SNS correspondiente.
 * @param appointment - Datos de la cita.
 */
const publishToSNS = async (appointment: Appointment): Promise<void> => {
    const topicArn = appointment.countryISO === 'PE' ? SNS_TOPIC_PE_ARN : SNS_TOPIC_CL_ARN;
    await sns.publish({
        TopicArn: topicArn,
        Message: JSON.stringify(appointment),
    }).promise();
};

/**
 * Obtiene las citas de un asegurado desde DynamoDB.
 * @param insuredId - ID del asegurado.
 * @returns Lista de citas.
 */
const getAppointmentsByInsuredId = async (insuredId: string): Promise<Appointment[]> => {
    const result = await dynamoDb.query({
        TableName: APPOINTMENTS_TABLE,
        KeyConditionExpression: 'insuredId = :insuredId',
        ExpressionAttributeValues: {
            ':insuredId': insuredId,
        },
    }).promise();

    return result.Items as Appointment[];
};

/**
 * Maneja la creación de una cita médica.
 * @param event - Evento de API Gateway.
 * @returns Respuesta HTTP.
 */
const handleCreateAppointment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.body) {
            throw new Error('Cuerpo de la solicitud no proporcionado');
        }

        const body = JSON.parse(event.body);
        validateCreateAppointmentRequest(body);

        const appointment: Appointment = {
            appointmentId: body.scheduleId.toString(),
            insuredId: body.insuredId,
            countryISO: body.countryISO,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        await createAppointment(appointment);
        await publishToSNS(appointment);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Cita médica en proceso de agendamiento', appointment }),
        };
    } catch (error) {
        console.error('Error en handleCreateAppointment:', error);
        return {
            statusCode: error instanceof Error && error.message.includes('requeridos') ? 400 : 500,
            body: JSON.stringify({ message: error instanceof Error ? error.message : 'Error interno del servidor' }),
        };
    }
};

/**
 * Maneja la obtención de citas por insuredId.
 * @param event - Evento de API Gateway.
 * @returns Respuesta HTTP.
 */
const handleGetAppointments = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const insuredId = event.pathParameters?.insuredId;
        if (!insuredId) {
            throw new Error('El parámetro insuredId es requerido');
        }

        const appointments = await getAppointmentsByInsuredId(insuredId);

        return {
            statusCode: 200,
            body: JSON.stringify(appointments),
        };
    } catch (error) {
        console.error('Error en handleGetAppointments:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error interno del servidor' }),
        };
    }
};

/**
 * Función principal del Lambda.
 * @param event - Evento de API Gateway.
 * @returns Respuesta HTTP.
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (event.httpMethod === 'POST') {
            return await handleCreateAppointment(event);
        } else if (event.httpMethod === 'GET') {
            return await handleGetAppointments(event);
        } else {
            return {
                statusCode: 405,
                body: JSON.stringify({ message: 'Método no permitido' }),
            };
        }
    } catch (error) {
        console.error('Error en el handler:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error interno del servidor' }),
        };
    }
};