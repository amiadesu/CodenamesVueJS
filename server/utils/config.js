// @ts-check
const dotenv = require('dotenv');
const z = require("zod/v4");
dotenv.config({ path: '.env.dev' });

const envSchema = z.object({
    MONGO_DB_URL: z.string().min(1),
    REDIS_LOGIN: z.string().default(""),
    REDIS_PASSWORD: z.string().default(""),
    REDIS_HOST: z.string().min(1),
    REDIS_PORT: z.string().transform(Number),
    REDIS_BD: z.string().transform(Number).default(0),
    REDIS_CONNECT_TIMEOUT: z.string().transform(Number).default(5000), // 5000 ms
    CORS_ORIGINS: z.string().transform((s) => s.split(',')),
    CORS_METHODS: z.string().transform((s) => s.split(',')).prefault("GET,POST"),
    CORS_CREDENTIALS: z.string().transform(Boolean).default(true),
    CORS_OPTION_SUCCESS_STATUS: z.string().transform(Number).default(200),
    SERVER_URL: z.string(),
    NODE_ENV: z.enum(['development', 'production']).default('development'),
});

const env = envSchema.parse(process.env);

const config = {
    mognoDB: { baseUrl: env.MONGO_DB_URL },
    redis: {
        clientOptions: {
            username: env.REDIS_LOGIN,
            password: env.REDIS_PASSWORD,
            database: env.REDIS_BD,
            socket: {
                host: env.REDIS_HOST,
                port: env.REDIS_PORT,
                connectTimeout: env.REDIS_CONNECT_TIMEOUT
            }
        }
    },
    cors: {
        options: {
            origins: env.CORS_ORIGINS,
            methods: env.CORS_METHODS,
            credentials: env.CORS_CREDENTIALS,
            optionSuccessStatus: env.CORS_OPTION_SUCCESS_STATUS
        }
    },
    server: {
        url: env.SERVER_URL
    },
    isProduction: env.NODE_ENV === 'production',
};

module.exports = {
    config
};