const z = require("zod/v4");

const usernameZodSchema = z.string().min(1).max(30);
const userColorZodSchema = z.string().startsWith("#").max(9);

const userZodSchema = z.object({
    name: usernameZodSchema,
    color: userColorZodSchema,
    sockets: z.array(z.string())
});

const roomIdZodSchema = z.string().min(1).max(16).regex(/^[a-zA-Z0-9]+$/).check((ctx) => {
    if (ctx.value === "default" || ctx.value === "rules") {
        ctx.issues.push({
            code: "custom",
            message: `Invalid room ID in player object: [${ctx.value}]`,
        })
    }
});

module.exports = { 
    usernameZodSchema,
    userColorZodSchema,
    userZodSchema,
    roomIdZodSchema
};