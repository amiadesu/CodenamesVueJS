const z = require("zod/v4");
const { 
    usernameZodSchema,
    userColorZodSchema,
    roomIdZodSchema
} = require("../../Global/ZodSchemas/globalZodSchemas");
const {
    validTeamColors,
    validPlayerTeamColors,
    validWordColors
} = require("../utils/constants");

const validTeamColorZodSchema = z.literal(validTeamColors);
const validPlayerTeamColorZodSchema = z.literal(validPlayerTeamColors);
const validWordColorZodSchema = z.literal(validWordColors);

const packIdZodSchema = z.string().min(1);

const gameRulesZodSchemaNonStrict = z.object({
    teamAmount: z.int().min(2).max(4),
    maximumPlayers: z.int().min(1).max(10),
    teamOrder: z.array(validTeamColorZodSchema).check((ctx) => {
        const length = ctx.value.length;
    
        // Check if length is valid (2, 3, or 4)
        if (length < 2 || length > 4) {
            ctx.issues.push({
                code: "custom",
                message: "Array must have length 2, 3, or 4.",
            });
            return;
        }

        // Check for duplicates
        if (new Set(ctx.value).size !== ctx.value.length) {
            ctx.issues.push({
                code: "custom",
                message: "Array must not contain duplicates.",
            });
            return;
        }

        // Check if it's a valid permutation (all required elements are present)
        const requiredElements = ["red", "green", ...(length >= 3 ? ["blue"] : []), ...(length === 4 ? ["yellow"] : [])];
        
        const missing = requiredElements.filter((el) => !ctx.value.includes(el));
        if (missing.length > 0) {
            ctx.issues.push({
                code: "custom",
                message: `Missing required elements: ${missing.join(", ")}.`,
            });
        }
    }),
    countdownTime: z.number().gte(0.1).lte(0.5),
    firstMasterTurnTime: z.int().min(1).max(3599),
    masterTurnTime: z.int().min(1).max(3599),
    teamTurnTime: z.int().min(1).max(3599),
    extraTime: z.int().min(1).max(3599),
    freezeTime: z.boolean(),
    limitedGuesses: z.boolean(),
    guessesLimit: z.int().min(0).max(99),
    baseCards: z.int().min(1),
    extraCards: z.array(z.int()).length(4),
    blackCards: z.int().min(0),
    maxCards: z.literal([25, 30, 36, 42, 49]),
    fieldSize: z.literal(["5x5", "5x6", "6x6", "6x7", "7x7"]),
    game_mode: z.literal(["default", "traitor"]),
    wordPack: z.object({
        packId: packIdZodSchema,
        name: z.string()
    }),
    locked: z.boolean()
});

const gameRulesZodSchemaStrict = gameRulesZodSchemaNonStrict.check((ctx) => {
    data = ctx.value;
    if ((data.fieldSize === "5x5" && data.maxCards !== 25) ||
        (data.fieldSize === "5x6" && data.maxCards !== 30) ||
        (data.fieldSize === "6x6" && data.maxCards !== 36) ||
        (data.fieldSize === "6x7" && data.maxCards !== 42) ||
        (data.fieldSize === "7x7" && data.maxCards !== 49)) {
        ctx.issues.push({
            code: "custom",
            message: `Max cards amount (${data.maxCards}) doesn't go along with field size (${data.fieldSize}).`,
        });
    }
    if (data.baseCards > data.maxCards) {
        ctx.issues.push({
            code: "custom",
            message: `Base cards amount (${data.baseCards}) exceeds max cards amount (${data.maxCards}).`,
        });
    }
    data.extraCards.forEach((cardAmount) => {
        if (cardAmount < 1 - data.baseCards || cardAmount > data.maxCards) {
            ctx.issues.push({
                code: "custom",
                message: `Extra cards amount (${cardAmount}) is out of bounds: [${1 - data.baseCards}, ${data.maxCards}]`,
            });
        }
    });
    if (data.blackCards > data.maxCards - data.teamAmount) {
        ctx.issues.push({
            code: "custom",
            message: `Black cards amount (${data.blackCards}) exceeds max possible value: ${data.maxCards - data.teamAmount}.`,
        });
    }
});

const clueTextZodSchema = z.string().regex(/^.{1,30} - 10|[0-9]$/);

const clueZodSchema = z.object({
    text: clueTextZodSchema,
    id: z.int().min(0)
});

const objectIdZodSchema = z.string().regex(/^[a-f\d]{24}$/i); // MongoDB ObjectID
const playerIdZodSchema = z.uuidv4();

const playerZodSchema = z.object({
    name: usernameZodSchema,
    color: userColorZodSchema,
    id: playerIdZodSchema,
    roomId: roomIdZodSchema,
    state: z.object({
        teamColor: validPlayerTeamColorZodSchema,
        master: z.boolean(),
        selecting: z.string()
    }),
    online: z.boolean(),
    host: z.boolean()
});

const selectorZodSchema = z.object({
    id: playerIdZodSchema,
    color: userColorZodSchema
});

const wordZodSchema = z.object({
    text: z.string().min(1),
    color: validWordColorZodSchema,
    hiddenColor: validWordColorZodSchema.optional(),
    selectedBy: z.any(),
    selectable: z.boolean(),
    revealed: z.boolean()
});

const chatMessageZodSchema = z.string().regex(/.{1,160}/);

module.exports = {
    validTeamColorZodSchema,
    validPlayerTeamColorZodSchema,
    validWordColorZodSchema,
    packIdZodSchema,
    gameRulesZodSchemaNonStrict,
    gameRulesZodSchemaStrict,
    clueTextZodSchema,
    clueZodSchema,
    playerIdZodSchema,
    playerZodSchema,
    selectorZodSchema,
    wordZodSchema,
    chatMessageZodSchema
};