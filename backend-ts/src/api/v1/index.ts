import { Router } from 'express';
import { authRouter } from './auth';
import { usersRouter } from './users';
import { jobsRouter } from './jobs';
import { applicationsRouter } from './applications';
import { savedJobsRouter } from './savedJobs';
import { recommendationsRouter } from './recommendations';
import { notificationsRouter } from './notifications';
import { metaRouter } from './meta';

export const apiV1Router = Router();

apiV1Router.use('/auth', authRouter);
apiV1Router.use('/users', usersRouter);
apiV1Router.use('/jobs', jobsRouter);
apiV1Router.use('/applications', applicationsRouter);
apiV1Router.use('/saved-jobs', savedJobsRouter);
apiV1Router.use('/recommendations', recommendationsRouter);
apiV1Router.use('/notifications', notificationsRouter);
apiV1Router.use('/meta', metaRouter);
