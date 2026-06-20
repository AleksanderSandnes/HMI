/**
 * OpenAPI 3.0 specification for the entire HMI platform.
 *
 * This document is rendered by the web-only Swagger UI page at `/api/swagger`.
 * It covers BOTH backends:
 *   - weatherAPI  (Node/Express) — auth, account, weather, API settings, notifications
 *   - growattAPI  (Spring Boot)  — solar production (Growatt) endpoints
 *
 * Per-path `servers` blocks point each operation at the correct backend so the
 * "Try it out" feature targets the right host.
 */

const weatherServers = [
  {
    url: 'https://weatherapi-sbwb.onrender.com',
    description: 'weatherAPI — production (Render)',
  },
];

const growattServers = [
  {
    url: 'https://growattapi.onrender.com',
    description: 'growattAPI — production (Render)',
  },
];

const bearerAuth = [{ bearerAuth: [] as string[] }];

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'HMI — Home Production Interface API',
    version: '1.0.0',
    description:
      'Unified API reference for the HMI platform.\n\n' +
      '- **Auth / Account / Weather / API Settings / Notifications** are served by ' +
      'the **weatherAPI** (Node/Express) — protected routes use a **Bearer JWT** ' +
      'obtained from `/api/user/login` or `/api/user/register`.\n' +
      '- **Growatt** solar endpoints are served by the **growattAPI** (Spring Boot) ' +
      'and are public at the HTTP layer (they rely on the Growatt session created ' +
      'via `/api/growatt/login`).\n\n' +
      'All endpoints target the **production** (Render) backends.',
  },
  tags: [
    { name: 'Auth', description: 'Registration and login (weatherAPI)' },
    { name: 'Account', description: 'User profile management (weatherAPI)' },
    { name: 'Weather', description: 'Weather station data (weatherAPI)' },
    {
      name: 'API Settings',
      description: 'Per-user Growatt/Weather credential storage (weatherAPI)',
    },
    {
      name: 'Notifications',
      description: 'In-app notifications and push-token registration (weatherAPI)',
    },
    { name: 'Growatt', description: 'Solar production data (growattAPI)' },
  ],
  servers: [...weatherServers, ...growattServers],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT issued by `/api/user/login` or `/api/user/register`. ' +
          'Send as `Authorization: Bearer <token>`.',
      },
    },
    schemas: {
      RegisterRequest: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', example: 'aleksander' },
          email: { type: 'string', format: 'email', example: 'you@domain.com' },
          password: { type: 'string', format: 'password', example: 'secret123' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'you@domain.com' },
          password: { type: 'string', format: 'password', example: 'secret123' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Logged in successfully' },
          token: { type: 'string', description: 'JWT, valid 30 days' },
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          username: { type: 'string' },
        },
      },
      UpdateProfileRequest: {
        type: 'object',
        required: ['username', 'email'],
        properties: {
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
      UpdatePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', format: 'password' },
          newPassword: {
            type: 'string',
            format: 'password',
            minLength: 6,
          },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ApiSettings: {
        type: 'object',
        properties: {
          weather: {
            type: 'object',
            properties: {
              stationId: { type: 'string', example: 'IOSLO123' },
              hasApiKey: { type: 'boolean' },
            },
          },
          growatt: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              plantId: { type: 'string' },
              hasPassword: { type: 'boolean' },
            },
          },
        },
      },
      UpdateApiSettingsRequest: {
        type: 'object',
        description: 'At least one of `growatt` or `weather` is required.',
        properties: {
          growatt: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              plantId: { type: 'string' },
              password: {
                type: 'string',
                format: 'password',
                description: 'Only updated when provided',
              },
            },
          },
          weather: {
            type: 'object',
            properties: {
              stationId: { type: 'string' },
              apiKey: {
                type: 'string',
                description:
                  'Only updated when provided; stored encrypted server-side',
              },
            },
          },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', example: 'solar_backfill' },
          level: {
            type: 'string',
            enum: ['info', 'success', 'warning', 'error'],
          },
          title: { type: 'string' },
          message: { type: 'string' },
          meta: { type: 'object', additionalProperties: true },
          read: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      PushTokenRequest: {
        type: 'object',
        required: ['token'],
        properties: {
          token: {
            type: 'string',
            example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          success: { type: 'boolean' },
        },
      },
      // ---- growattAPI ----
      GrowattLoginRequest: {
        type: 'object',
        required: ['account', 'password'],
        properties: {
          account: { type: 'string', description: 'Growatt account / email' },
          password: {
            type: 'string',
            format: 'password',
            description: 'Plain password; hashed to MD5 server-side',
          },
        },
      },
      EnergyRequest: {
        type: 'object',
        properties: {
          plantId: {
            type: 'string',
            description:
              'Plant id. Optional — falls back to the id stored during ' +
              '`/api/growatt/login`.',
          },
          date: {
            type: 'string',
            description:
              'Period to query. Format depends on the chart: `2023` (year), ' +
              '`2023-06` (month), `2023-06-19` (day).',
            example: '2023-06-19',
          },
        },
      },
      GrowattChartResponse: {
        type: 'object',
        description:
          'Growatt chart payload. `result` is 1 on success; `obj` holds the ' +
          'series arrays (shape varies by day/week/month/year).',
        properties: {
          result: { type: 'integer', example: 1 },
          obj: { type: 'object', additionalProperties: true },
        },
      },
    },
  },
  paths: {
    /* ----------------------------- Auth ----------------------------- */
    '/api/user/register': {
      servers: weatherServers,
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Creates a user and returns a JWT (valid 30 days).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '400': { description: 'Missing fields or user already exists' },
        },
      },
    },
    '/api/user/login': {
      servers: weatherServers,
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        description: 'Authenticates a user and returns a JWT (valid 30 days).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    /* ---------------------------- Account --------------------------- */
    '/api/user/profile': {
      servers: weatherServers,
      get: {
        tags: ['Account'],
        summary: 'Get current user (raw document, no password)',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/UserProfile' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/user/account': {
      servers: weatherServers,
      get: {
        tags: ['Account'],
        summary: 'Get current user profile',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user: { $ref: '#/components/schemas/UserProfile' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'User not found' },
        },
      },
    },
    '/api/user/account/profile': {
      servers: weatherServers,
      put: {
        tags: ['Account'],
        summary: 'Update username and email',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated' },
          '400': { description: 'Validation error / email already in use' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/user/account/password': {
      servers: weatherServers,
      put: {
        tags: ['Account'],
        summary: 'Change password',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdatePasswordRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Password updated' },
          '400': { description: 'Validation error / wrong current password' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    /* ---------------------------- Weather --------------------------- */
    '/api/weather/current': {
      servers: weatherServers,
      get: {
        tags: ['Weather'],
        summary: 'Current weather observation',
        security: bearerAuth,
        responses: {
          '200': { description: 'Current observation payload' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/weather/hourly/{date}': {
      servers: weatherServers,
      get: {
        tags: ['Weather'],
        summary: 'Hourly observations for a day',
        security: bearerAuth,
        parameters: [
          {
            name: 'date',
            in: 'path',
            required: true,
            schema: { type: 'string', example: '20230619' },
            description: 'Day in YYYYMMDD',
          },
        ],
        responses: {
          '200': { description: 'Hourly observations' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/weather/all/{date}': {
      servers: weatherServers,
      get: {
        tags: ['Weather'],
        summary: 'All observations for a day',
        security: bearerAuth,
        parameters: [
          {
            name: 'date',
            in: 'path',
            required: true,
            schema: { type: 'string', example: '20230619' },
            description: 'Day in YYYYMMDD',
          },
        ],
        responses: {
          '200': { description: 'Full-day observations' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/weather/weekly': {
      servers: weatherServers,
      get: {
        tags: ['Weather'],
        summary: 'Weekly daily-summary (7 days, current week)',
        security: bearerAuth,
        responses: {
          '200': { description: '7-day daily summaries' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/weather/weekly/{date}': {
      servers: weatherServers,
      get: {
        tags: ['Weather'],
        summary: 'Weekly daily-summary for the week containing {date}',
        security: bearerAuth,
        parameters: [
          {
            name: 'date',
            in: 'path',
            required: true,
            schema: { type: 'string', example: '20230619' },
            description: 'Any day (YYYYMMDD) in the desired week',
          },
        ],
        responses: {
          '200': { description: '7-day daily summaries' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/weather/weekly-hourly/{date}': {
      servers: weatherServers,
      get: {
        tags: ['Weather'],
        summary: 'Hourly observations across a week',
        security: bearerAuth,
        parameters: [
          {
            name: 'date',
            in: 'path',
            required: true,
            schema: { type: 'string', example: '20230619' },
            description: 'Any day (YYYYMMDD) in the desired week',
          },
        ],
        responses: {
          '200': { description: 'Weekly hourly observations' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/weather/endpoint-info': {
      servers: weatherServers,
      get: {
        tags: ['Weather'],
        summary: 'Debug: recommended upstream endpoint for a time range',
        description: 'Public utility route (no authentication).',
        parameters: [
          {
            name: 'timeRange',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['hourly', 'all', 'current', 'weekly', 'weekly-hourly'],
            },
          },
          {
            name: 'date',
            in: 'query',
            required: false,
            schema: { type: 'string', example: '20230619' },
          },
        ],
        responses: { '200': { description: 'Endpoint recommendation' } },
      },
    },
    /* -------------------------- API Settings ------------------------ */
    '/api/settings/api': {
      servers: weatherServers,
      get: {
        tags: ['API Settings'],
        summary: 'Get stored API settings (no secrets)',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    apiSettings: { $ref: '#/components/schemas/ApiSettings' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'User not found' },
        },
      },
      put: {
        tags: ['API Settings'],
        summary: 'Update Growatt and/or Weather settings',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateApiSettingsRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Updated' },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
        },
      },
      delete: {
        tags: ['API Settings'],
        summary: 'Clear all API settings',
        security: bearerAuth,
        responses: {
          '200': { description: 'Cleared' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/settings/credentials': {
      servers: weatherServers,
      get: {
        tags: ['API Settings'],
        summary: 'Get Growatt credentials (for server-to-server use)',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    credentials: {
                      type: 'object',
                      properties: {
                        account: { type: 'string' },
                        password: { type: 'string' },
                        plantId: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'No Growatt credentials found' },
        },
      },
    },
    '/api/settings/weather-credentials': {
      servers: weatherServers,
      post: {
        tags: ['API Settings'],
        summary: 'Get decrypted Weather API credentials',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    credentials: {
                      type: 'object',
                      properties: {
                        apiKey: { type: 'string' },
                        stationId: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'No Weather API credentials found' },
        },
      },
    },
    /* -------------------------- Notifications ----------------------- */
    '/api/notifications': {
      servers: weatherServers,
      get: {
        tags: ['Notifications'],
        summary: 'List notifications for the current user',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Notification' },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/notifications/count': {
      servers: weatherServers,
      get: {
        tags: ['Notifications'],
        summary: 'Unread notification count',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { count: { type: 'integer' } },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/notifications/clear': {
      servers: weatherServers,
      delete: {
        tags: ['Notifications'],
        summary: 'Clear all notifications',
        security: bearerAuth,
        responses: {
          '200': { description: 'Cleared' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/notifications/{id}': {
      servers: weatherServers,
      delete: {
        tags: ['Notifications'],
        summary: 'Dismiss a single notification',
        security: bearerAuth,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Dismissed' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/notifications/push-token': {
      servers: weatherServers,
      post: {
        tags: ['Notifications'],
        summary: 'Register an Expo push token',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PushTokenRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Registered' },
          '401': { description: 'Unauthorized' },
        },
      },
      delete: {
        tags: ['Notifications'],
        summary: 'Unregister an Expo push token',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PushTokenRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Unregistered' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    /* ----------------------------- Growatt -------------------------- */
    '/api/growatt/health': {
      servers: growattServers,
      get: {
        tags: ['Growatt'],
        summary: 'Health check',
        responses: { '200': { description: 'Service healthy' } },
      },
    },
    '/api/growatt/login': {
      servers: growattServers,
      post: {
        tags: ['Growatt'],
        summary: 'Log in to Growatt and cache the plant id (session)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GrowattLoginRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Raw Growatt login payload (string)' },
        },
      },
    },
    '/api/growatt/totalData': {
      servers: growattServers,
      post: {
        tags: ['Growatt'],
        summary: 'Lifetime/total plant data',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EnergyRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GrowattChartResponse' },
              },
            },
          },
        },
      },
    },
    '/api/growatt/dayChart': {
      servers: growattServers,
      post: {
        tags: ['Growatt'],
        summary: 'Day production chart (cache-aside)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EnergyRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GrowattChartResponse' },
              },
            },
          },
        },
      },
    },
    '/api/growatt/weekChart': {
      servers: growattServers,
      post: {
        tags: ['Growatt'],
        summary: 'Week production chart (aggregated from month data)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EnergyRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GrowattChartResponse' },
              },
            },
          },
        },
      },
    },
    '/api/growatt/monthChart': {
      servers: growattServers,
      post: {
        tags: ['Growatt'],
        summary: 'Month production chart (cache-aside)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EnergyRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GrowattChartResponse' },
              },
            },
          },
        },
      },
    },
    '/api/growatt/yearChart': {
      servers: growattServers,
      post: {
        tags: ['Growatt'],
        summary: 'Year production chart (cache-aside)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EnergyRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GrowattChartResponse' },
              },
            },
          },
        },
      },
    },
    '/api/growatt/invTotalData': {
      servers: growattServers,
      post: {
        tags: ['Growatt'],
        summary: 'Inverter total data',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EnergyRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GrowattChartResponse' },
              },
            },
          },
        },
      },
    },
  },
} as const;

export default openapiSpec;
