'use strict';

import { Response, NextFunction } from 'express';
import { IAppRequest } from '../app.types';
import { User } from '../models/User';

export let addParticipantToCompetition = async (req: IAppRequest, res: Response, next: NextFunction) => {
    await User.participateInCompetition(req.user._id);

    res.render('main', {
        title: 'GitHub API'
    });
};
