# **API de Agendamiento de Citas Médicas**

Esta API permite a los asegurados agendar citas médicas en centros médicos de Perú y Chile. Está desarrollada con **Serverless Framework** en **AWS** y utiliza servicios como **Lambda**, **DynamoDB**, **SNS**, **SQS**, **RDS** y **EventBridge**.

---

## **Tabla de Contenidos**

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Requisitos](#requisitos)
4. [Instalación](#instalación)
5. [Configuración](#configuración)
6. [Despliegue](#despliegue)
7. [Endpoints](#endpoints)
8. [Ejemplos de Uso](#ejemplos-de-uso)
9. [Pruebas](#pruebas)
10. [Estructura del Proyecto](#estructura-del-proyecto)
11. [Documentación Swagger](#documentación-swagger)

---

## **Descripción del Proyecto**

El proyecto consiste en una API backend que permite a los asegurados agendar citas médicas. Los asegurados pueden seleccionar un centro médico, una especialidad, un médico y una fecha y hora para su cita. La API procesa la solicitud y almacena la información en una base de datos RDS (MySQL) según el país del asegurado (Perú o Chile).

---

## **Tecnologías Utilizadas**

- **Serverless Framework**: Para la gestión y despliegue de la infraestructura en AWS.
- **AWS Lambda**: Para la ejecución del código backend.
- **DynamoDB**: Para almacenar el estado de las citas médicas.
- **SNS (Simple Notification Service)**: Para enviar mensajes a colas SQS según el país.
- **SQS (Simple Queue Service)**: Para procesar las solicitudes de agendamiento de citas.
- **RDS (Relational Database Service)**: Para almacenar la información de las citas en una base de datos MySQL.
- **EventBridge**: Para notificar la conformidad del agendamiento.
- **TypeScript**: Para el desarrollo del código backend.
- **Jest**: Para pruebas unitarias.

---

## **Requisitos**

- **Node.js**: Versión 18.x o superior.
- **Serverless Framework**: Instalado globalmente (`npm install -g serverless`).
- **AWS CLI**: Configurado con credenciales válidas (`aws configure`).
- **Cuenta de AWS**: Con permisos suficientes para crear y gestionar recursos.

---

## **Instalación**

1. Clona el repositorio:

    ```bash
    git clone https://github.com/llandresll/reto-rimac-backend.git
    cd reto-rimac-backend
    ```

2. Instala las dependencias:

    ```bash
    npm install
    ```

## **Configuración**

1. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables de entorno:

    ```plaintext
    # Variables de entorno para RDS (MySQL)
    RDS_HOST=my-database.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com
    RDS_USER=admin
    RDS_PASSWORD=my-secret-password
    RDS_DATABASE=appointments_db

    # Variables de entorno para SNS (Simple Notification Service)
    SNS_TOPIC_PE_ARN=arn:aws:sns:us-east-1:123456789012:SNSTopicPE
    SNS_TOPIC_CL_ARN=arn:aws:sns:us-east-1:123456789012:SNSTopicCL

    # Variables de entorno para SQS (Simple Queue Service)
    SQS_PE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/SQS_PE
    SQS_CL_URL=https://sqs.us-east-1.amazonaws.com/123456789012/SQS_CL

    # Variables de entorno para DynamoDB (Opcionales)
    DYNAMODB_TABLE=AppointmentsTable
    ```

2. Asegúrate de que las credenciales de AWS estén configuradas correctamente:

    ```bash
    aws 
    ```

## **Despliegue**

Para desplegar la aplicación en AWS, ejecuta el siguiente comando:

```
serverless deploy
```

Esto desplegará todos los recursos definidos en el archivo serverless.yml (Lambdas, DynamoDB, SNS, SQS, etc.).

## **Endpoints**

La API expone los siguientes endpoints:

1. POST /appointment: Registra una nueva cita médica.
2. GET /appointment/{insuredId}: Obtiene el listado de citas médicas por código de asegurado.

## **Ejemplos de Uso**

1. Crear una cita médica (POST)

- URL: /appointment
- Método: POST
- Body:

    ```json
    {
        "insuredId": "12345",
        "scheduleId": 100,
        "countryISO": "PE"
    }
    ```
    
- Respuesta Exitosa:

    ```json
    {
        "message": "Cita médica en proceso de agendamiento",
        "appointment": {
            "appointmentId": "100",
            "insuredId": "12345",
            "countryISO": "PE",
            "status": "pending",
            "createdAt": "2024-05-10T12:34:56.789Z"
        }
    }
    ```
    
2. Listar citas por asegurado (GET)

- URL: /appointment/{insuredId}
- Método: GET
- Respuesta Exitosa:

    ```json
    [
        {
            "appointmentId": "100",
            "insuredId": "12345",
            "countryISO": "PE",
            "status": "pending",
            "createdAt": "2024-05-10T12:34:56.789Z"
        },
        {
            "appointmentId": "101",
            "insuredId": "12345",
            "countryISO": "CL",
            "status": "completed",
            "createdAt": "2024-05-11T10:20:30.456Z"
        }
    ]
    ```

## **Pruebas**

Para ejecutar las pruebas unitarias, usa el siguiente comando:

```bash
npm test
```

## **Estructura del Proyecto**

```
reto-rimac-backend/
├── src/
│   ├── handlers/            # Handlers de Lambda
│   │   └── appointment.ts   # Handler para agendar y listar citas
│   ├── models/              # Modelos de datos
│   │   └── appointment.ts   # Modelo de cita médica
│   └── tests/               # Pruebas unitarias
│       └── appointment.test.ts
├── serverless.yml           # Configuración de Serverless Framework
├── tsconfig.json            # Configuración de TypeScript
├── package.json             # Dependencias del proyecto
├── .env                     # Variables de entorno
└── README.md                # Documentación del proyecto
````

## **Documentación Swagger**

Para generar y visualizar la documentación Swagger de la API, sigue estos pasos:

1. Ejecuta el siguiente comando para iniciar el servidor de Swagger:

    ```bash
    npm run swagger
    ```

2. Abre tu navegador y visita la siguiente URL para ver la documentación Swagger:

    ```
    http://localhost:3000/api-docs
    ```

Esto te permitirá ver y probar los endpoints de la API directamente desde la interfaz de Swagger UI.