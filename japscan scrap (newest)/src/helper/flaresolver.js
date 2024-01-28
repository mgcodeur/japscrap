import fetch from "node-fetch";
import {config} from "../../config/flaresolver.js";
import fs from 'fs';
import {createFolderAndSubFolder} from './file.js';

const byPassCloudFlareAndReturnNewPage = async (context, browser, page, data) => {
    const flareSolverResponse = await fetchFlareSolverResponse(data);
    const cookies = await getCookiesInResponse(flareSolverResponse);
    const userAgent = await getUserAgent(flareSolverResponse);

    createFolderAndSubFolder(`.datas/${config.cookiesPath}/japscan/`);
    createFolderAndSubFolder(`.datas/user-agent/japscan/`);

    const timestamp = new Date().getTime();
    fs.writeFileSync(`.datas/${config.cookiesPath}/japscan/${timestamp}.json`, JSON.stringify(cookies, null, 2));
    fs.writeFileSync(`.datas/user-agent/japscan/${timestamp}.txt`, userAgent);

    context = await browser.newContext({
        userAgent: userAgent,
        storageState: {
            cookies: cookies
        }
    });

    return await context.newPage();
}

const getCookiesInResponse = (response) => (response.solution.cookies);

const fetchFlareSolverResponse = async (data) => {
    const request = await fetch(config.solverBaseUrl, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {'Content-Type': 'application/json'}
    });

    const flareSolverResponse = await request.json();

    if(flareSolverResponse.status !== 'ok') {
        throw new Error('FlareSolverr error');
    }

    return flareSolverResponse;
};

const getUserAgent = (response) => (response.solution.userAgent);

export { byPassCloudFlareAndReturnNewPage }