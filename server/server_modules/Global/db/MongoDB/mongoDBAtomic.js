// @ts-check
const crypto = require("crypto");

const userSchema = require("../../MongoDBSchemas/User");

const {
    deleteAfterMNumber,
    updateAfterMNumber,
    deleteAfterS,
    updateAfterS,
    expireAfterS,
    deleteAfterMs,
    updateAfterMs,
    expireAfterMs,
    messagesLimitNumber,
    cluesLimitNumber,
    LOCK_TTL
} = require("../../utils/constants");

class MongoDBAtomic {
    constructor() {
        this.client = null;
    }

    async init(mongoDBClient) {
        if (!mongoDBClient) throw new Error('MongoDB client is required');
        this.client = mongoDBClient;
        this.User = this.client.model("User", userSchema);
    }

    async createUser(userId) {
        try {
            const resultVersion = await this.getUserData(userId, "__v");
            if (resultVersion.success && resultVersion.value !== null) {
                return {
                    success: true,
                    message: "User already exists",
                    newUser: false,
                    realUserID: userId
                };
            }

            const newUser = await this.User();

            if (!newUser) {
                throw new Error("Couldn't create user");
            }

            await newUser.save();

            return {
                success: true,
                message: "User created successfully",
                newUser: true,
                realUserID: newUser._id.toString()
            };
        } catch (error) {
            if (error.code === 11000) { // Dublicate Key Error code
                console.log("Dublicate key detected:", error.message);
                return { success: false, error: error.message, retryable: true };
            }
            console.log("Error while creating user:", error);
            return { success: false, error: error.message };
        }
    }

    async getUserData(userId, key) {
        try {
            const result = await this.User.findOne({ _id: userId })
                .select(`${key} -_id`)
                .lean()
                .exec();

            const value = result ? result[key] : null;

            return { success: true, value: value };
        } catch (error) {
            console.log("Error while getting user data:", error);
            return { success: false, error: error.message };
        }
    }

    async getFullUserData(userId) {
        try {
            const result = await this.User.findOne({ _id: userId })
                .lean()
                .exec();

            return { success: true, value: result };
        } catch (error) {
            console.log("Error while getting user data:", error);
            return { success: false, error: error.message };
        }
    }

    async setUserData(userId, key, value) {
        try {
            let updatedUser = null;
            if (key) {
                updatedUser = await this.User.findOneAndUpdate(
                    { _id: userId },
                    { $set: { [key]: value } },
                    { 
                        new: true,
                        upsert: false
                    }
                ).exec();
            }
            else {
                // Update multiple keys at once
                // Maybe should add some checks for this...
                updatedUser = await this.User.findOneAndUpdate(
                    { _id: userId },
                    { $set: value },
                    { 
                        new: true,
                        upsert: false
                    }
                ).exec();
            }
        
            if (!updatedUser) {
                throw new Error('User not found');
            }
        
            return { success: true, message: "Setted user data successfully" };
        } catch (error) {
            console.log("Error while setting user data:", error);
            return { success: false, error: error.message };
        }
    }

    async updateUserData(userId, newData) {
        try {
            const updatedUser = await this.User.findOneAndUpdate(
                { _id: userId },
                { $set: newData },
                {
                    new: true,
                    upsert: false
                }
            ).exec();
        
            if (!updatedUser) {
                throw new Error('User not found');
            }
        
            return { success: true, message: "Updated user data successfully" };
        } catch (error) {
            console.log("Error while updating user data:", error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new MongoDBAtomic();