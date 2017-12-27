import * as moment from 'moment';
import { IUserRepo } from '../app.types';
import { UserInstance } from '../models/User';
import { GithubService } from './GithubService';

import { timeout } from './HelperService';

const START_OF_YEAR_EPOCH = Number(moment(2017, 'YYYY').startOf('year').format('X'));

export class CompetitionService {
    private githubApi: GithubService;

    constructor(private user: UserInstance) {
        if (!this.user.tokens || !this.user.tokens.length) throw new Error('No access token found on user');
        if (!this.user.username) throw new Error('No username found');

        this.githubApi = new GithubService(this.user.tokens[0].accessToken);
    }

    async participateInCompetition() {
        const allRepos = await this.githubApi.getAllUserRepositories();
        let currentBatch = [...allRepos];
        let processedAll = false;

        const totalStats = {
            linesAdded: 0,
            commits: 0,
            linesDeleted: 0
        };

        while (!processedAll) {
            const { delayedRepos, stats } = await this.processRepos(currentBatch);

            totalStats.commits += stats.commits;
            totalStats.linesAdded += stats.linesAdded;
            totalStats.linesDeleted += stats.linesDeleted;

            if (delayedRepos.length) {
                currentBatch = [...delayedRepos];
                await timeout(10000);
            } else {
                processedAll = true;
            }
        }
    }

    private async processRepos(repos: IUserRepo[]) {
        const delayedRepos = [];
        const stats = {
            linesAdded: 0,
            commits: 0,
            linesDeleted: 0
        };

        for (const repo of repos) {
            try {
                const repoStats = await this.githubApi.getCommitStats(repo.owner, repo.name);

                const myFound = repoStats.find(i => i.author.login === this.user.username);
                if (!myFound) continue;

                const weeks = myFound.weeks.filter(i => Number(i.w) > START_OF_YEAR_EPOCH);
                const { added, deleted, committed } = weeks
                    .reduce((h, i) => {
                        h.added += i.a;
                        h.deleted += i.d;
                        h.committed += i.c;

                        return h;
                    }, { added: 0, deleted: 0, committed: 0 });

                stats.linesDeleted += deleted;
                stats.linesAdded += added;
                stats.commits += committed;
            } catch (e) {
                if (e.message === 'Not ready yet') {
                    delayedRepos.push(repo);
                }
            }
        }

        return {
            delayedRepos,
            stats
        };
    }
}