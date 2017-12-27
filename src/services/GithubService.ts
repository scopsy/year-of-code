import * as request from 'request-promise';
import { IUserRepo } from '../app.types';

const GITHUB_ROOT = 'https://api.github.com';
const GITHUB_REPO_LIMIT = 30;

export class GithubService {
    private headers = {
        'User-Agent': 'year-of-code',
        'Authorization': undefined
    };

    /**
     * @param {string} token - the user accessToken from oauth signup
     * Using it to avoid rate-limit issues
     */
    constructor(private token: string) {
        if (!token) throw new Error('Token must be provided');

        this.headers.Authorization = `token ${this.token}`;
    }

    /**
     * Retrieves all user repositories
     * if user have more than the GITHUB_REPO_LIMIT repos,
     * paginate on all repositories
     *
     * @returns { Promise<IUserRepo[]> }
     */
    async getAllUserRepositories(): Promise<IUserRepo[]> {
        let items = [];
        let doneFetching = false;
        let page = 1;

        while (!doneFetching) {
            const bulk = await this.fetchRepoBulk(page);
            if (bulk.length < GITHUB_REPO_LIMIT) doneFetching = true;

            items = items.concat(bulk);
            page++;
        }

        return items;
    }

    /**
     * Fetches all commit stats for a single repo
     * @param {string} owner
     * @param {string} repo
     * @returns {Promise<any>}
     */
    async getCommitStats(owner: string, repo: string) {
        const response = await this.apiGetaway(`/repos/${owner}/${repo}/stats/contributors`);

        if (response.statusCode === 204) {
            throw new Error('No content found');
        }

        if (response.statusCode === 202) {
            throw new Error('Not ready yet');
        }

        return JSON.parse(response.body);
    }

    private async fetchRepoBulk(page = 1): Promise<IUserRepo[]> {
        const response = await this.apiGetaway('/user/repos?page=' + page);

        return JSON.parse(response.body).map((i) => {
            return {
                name: i.name,
                owner: i.owner.login
            };
        });
    }

    private async apiGetaway(url) {
        return await request.get(GITHUB_ROOT + url, {
            headers: this.headers,
            resolveWithFullResponse: true
        });
    }
}