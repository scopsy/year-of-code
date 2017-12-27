interface IAuthToken {
    accessToken: string;
    kind: string;
}

export interface ICompetitionData {
    commits: number;
    linesAdded: number;
    linesDeleted: number;
}

export interface IUser {
    _id: string;
    email: string;

    github: string;
    tokens: IAuthToken[];
    username: string;

    profile: {
        bio: string;
        name: string;
        gender: string;
        location: string;
        website: string;
        picture: string;
    };

    competitionData: ICompetitionData;
}

export interface IAppRequest extends Request {
    user?: IUser;
}

export interface IUserRepo {
    owner: string;
    name: string;
}