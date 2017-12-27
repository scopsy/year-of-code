import { Response } from 'express';
import { IAppRequest } from '../app.types';

export let index = (req: IAppRequest, res: Response) => {
  res.render('home', {
    title: 'Home'
  });
};
