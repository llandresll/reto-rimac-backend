import { SQSHandler } from 'aws-lambda';
import mysql from 'mysql2/promise';
import { Appointment, isValidAppointment } from '../models/appointment';

/**
 * Función para procesar mensajes de la cola SQS_PE y almacenar en RDS (Perú).
 * @param event - Evento de SQS.
 */
export const handler: SQSHandler = async (event) => {
    try {
        // Crear conexión a la base de datos RDS
        const connection = await mysql.createConnection({
            host: process.env.RDS_HOST,
            user: process.env.RDS_USER,
            password: process.env.RDS_PASSWORD,
            database: process.env.RDS_DATABASE,
        });

        // Procesar cada mensaje de la cola
        for (const record of event.Records) {
            const messageBody = JSON.parse(record.body);

            // Validar que el mensaje sea una cita válida
            if (!isValidAppointment(messageBody)) {
                console.error('Mensaje no válido en SQS_PE:', messageBody);
                continue; // Saltar este mensaje y continuar con el siguiente
            }

            const appointment: Appointment = messageBody;

            // Insertar la cita en la base de datos
            await connection.execute(
                `INSERT INTO appointments (appointmentId, insuredId, countryISO, status, createdAt)
         VALUES (?, ?, ?, ?, ?)`,
                [
                    appointment.appointmentId,
                    appointment.insuredId,
                    appointment.countryISO,
                    appointment.status,
                    appointment.createdAt,
                ]
            );

            console.log('Cita almacenada en RDS (Perú):', appointment);
        }

        // Cerrar la conexión a la base de datos
        await connection.end();
    } catch (error) {
        console.error('Error en el handler de appointment_pe:', error);
        throw error; // Re-lanzar el error para que SQS reintente el mensaje
    }
};