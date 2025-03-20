/**
 * Interfaz que representa una cita médica.
 */
export interface Appointment {
    appointmentId: string; // Identificador único de la cita
    insuredId: string; // ID del asegurado
    countryISO: string; // Código ISO del país (PE o CL)
    status: 'pending' | 'completed'; // Estado de la cita
    createdAt: string; // Fecha de creación de la cita
}
export interface AppointmentResponse {
    appointmentId: string; // Identificador único de la cita
    insuredId: string; // ID del asegurado
    countryISO: string; // Código ISO del país (PE o CL)
    status: 'pending' | 'completed'; // Estado de la cita
}

/**
 * Valida si un objeto cumple con la estructura de una cita médica.
 * @param data - Objeto a validar.
 * @returns `true` si el objeto es una cita válida, `false` en caso contrario.
 */
export function isValidAppointment(data: any): data is Appointment {
    return (
        typeof data.appointmentId === 'string' &&
        typeof data.insuredId === 'string' &&
        (data.countryISO === 'PE' || data.countryISO === 'CL') &&
        (data.status === 'pending' || data.status === 'completed') &&
        typeof data.createdAt === 'string'
    );
}

/**
 * Crea un objeto de tipo Appointment.
 * @param appointmentId - Identificador de la cita.
 * @param insuredId - ID del asegurado.
 * @param countryISO - Código ISO del país.
 * @returns Un objeto de tipo Appointment.
 */
export function createAppointment(
    appointmentId: string,
    insuredId: string,
    countryISO: string
): Appointment {
    return {
        appointmentId,
        insuredId,
        countryISO,
        status: 'pending', // Estado inicial de la cita
        createdAt: new Date().toISOString(), // Fecha de creación
    };
}