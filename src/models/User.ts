import * as mongoose from 'mongoose';
import { IUser } from '../app.types';
import { CompetitionService } from '../services/CompetitionService';


export type UserModel = mongoose.Model<UserInstance> & {
    participateInCompetition: (userId: string) => Promise<any>;
};

export type UserInstance = mongoose.Document & IUser & {

};

const defaultNumberValue = {
    type: Number,
    default: 0
};

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true
    },

    github: String,
    username: String,
    tokens: Array,

    profile: {
        bio: String,
        name: String,
        gender: String,
        location: String,
        website: String,
        picture: String
    },
    competitionData: {
        commits: defaultNumberValue,
        linesAdded: defaultNumberValue,
        linesDeleted: defaultNumberValue
    }
}, { timestamps: true });

userSchema.statics = {
    participateInCompetition: async function(userId: string) {
        const user = await User.findById(userId);
        const compService = new CompetitionService(user);

        await compService.participateInCompetition();
    }
};

export const User = mongoose.model<UserInstance, UserModel>('User', userSchema);
export default User;