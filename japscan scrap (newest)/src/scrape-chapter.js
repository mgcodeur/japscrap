import playwright from 'playwright';
import {config} from "../config/scraper.js";
import {getFirstPagePathToRead} from "./mixin/manga-detail-mixin.js";
import {byPassCloudFlareAndReturnNewPage} from "./helper/flaresolver.js";
import {createFolderAndSubFolder, generateFilePrefixWithFullTime} from "./helper/file.js";
import fs from "fs";
import { removeIndex } from './helper/array.js';

const scrapeChapter = async (mangaSlug) => {
    const browser = await playwright.firefox.launch(config.browser);

    browser.contexts().forEach(async context => {
        await context.clearCookies();
    });

    let context = await browser.newContext({});

    let page = await context.newPage();

    await page.goto(`${config.baseUrl}/manga/${mangaSlug}/`, { timeout: config.maxTimeout });

    await page.waitForSelector('[id*="collapse-"]')

    let mangaPath = await getFirstPagePathToRead(page);

    await page.close();

    const data = { cmd: 'request.get', url: `${config.baseUrl}${mangaPath}`, maxTimeout: config.maxTimeout,}

    page = await byPassCloudFlareAndReturnNewPage(context, browser, page, data);

    await page.goto(`${config.baseUrl}${mangaPath}`, { timeout: config.maxTimeout });

    await page.waitForSelector('#reader', { timeout: config.maxTimeout });

    const previousButton = await page.$eval('#block-left', el => el !== null);
    const nextButton = await page.$eval('#block-right', el => el !== null);

    const isFullReader = !previousButton && !nextButton;

    if (isFullReader) {
        //TODO: Implement full reader
        throw new Error('Full reader not implemented yet');
    }

    let allChapterLinks = await page.evaluate(() => Array.from(document.querySelectorAll('#chapters option')).map(item => item.value).reverse());

    for(let i = 0; i < allChapterLinks.length; i++) {
        await page.goto(`${config.baseUrl}${allChapterLinks[i]}`, { timeout: config.maxTimeout });
        await page.waitForSelector('#reader .img-fluid + canvas', { timeout: config.maxTimeout });
        mangaPath = allChapterLinks[i];
        await downLoadAllPageInVolumeOrChapter(page, mangaPath, mangaSlug);
    }

    await page.close();
    await context.close();
    await browser.close();
};

const downLoadAllPageInVolumeOrChapter = async (page, mangaPath, mangaSlug) => {
    let chapterName = await page.$eval('#chapters option[selected]', el => el.innerText.trim());
    let chapterFolderName = await page.$eval('#chapters option[selected]', el => el.innerText.trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\s+/g, '_') // Replace spaces with _
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '_') // Replace multiple - with single _
    .toLowerCase());

    const pageInChaptersOrInVolumes = await page.evaluate(() => Array.from(document.querySelectorAll('#pages option'), opt => opt.value)); // begin at 0

    for(let iteration = 1; iteration < pageInChaptersOrInVolumes.length; iteration++) {
        const currentPage = parseInt(pageInChaptersOrInVolumes[iteration]);

        await page.goto(`${config.baseUrl}${mangaPath}${currentPage}.html`, { timeout: config.maxTimeout });

        await page.waitForLoadState('domcontentloaded', { timeout: config.maxTimeout })

        await page.waitForSelector('#reader .img-fluid + canvas', { timeout: config.maxTimeout });
        await page.waitForTimeout(7000);

        
        await page.evaluate(() => {
            const stickyTopContainer = document.querySelector('.container.sticky-top');
            
            if(stickyTopContainer) {
                stickyTopContainer.remove();
            }

            const stickyBanner = document.querySelector('#stickyBanner');

            if(stickyBanner) {
                stickyBanner.remove();
            }
        });

        createFolderAndSubFolder(`${config.outputDir}/${mangaSlug}/${chapterFolderName}/`);

        await page.locator('#reader .img-fluid + canvas').screenshot({
            path: `${config.outputDir}/${mangaSlug}/${chapterFolderName}/${generateFilePrefixWithFullTime()}.png`,
            timeout: config.maxTimeout
        });

        if(
            await page.$eval('#block-right', el => el !== null && el !== undefined) &&
            pageInChaptersOrInVolumes[iteration] === pageInChaptersOrInVolumes[pageInChaptersOrInVolumes.length - 1]
        ) {
            await page.waitForSelector('#block-right', { timeout: config.maxTimeout });
            await page.evaluate(() => document.querySelector('#block-right').click());

            await page.waitForSelector('#reader .img-fluid + canvas', { timeout: config.maxTimeout });
            await page.waitForTimeout(7000);

            await page.evaluate(() => {
                const stickyTopContainer = document.querySelector('.container.sticky-top');
                
                if(stickyTopContainer) {
                    stickyTopContainer.remove();
                }
    
                const stickyBanner = document.querySelector('#stickyBanner');
    
                if(stickyBanner) {
                    stickyBanner.remove();
                }
            });
    
            createFolderAndSubFolder(`${config.outputDir}/${mangaSlug}/${chapterFolderName}/`);
    
            await page.locator('#reader .img-fluid + canvas').screenshot({
                path: `${config.outputDir}/${mangaSlug}/${chapterFolderName}/${generateFilePrefixWithFullTime()}.png`,
                timeout: config.maxTimeout
            });
        }
    }
    
    fs.writeFileSync(`${config.outputDir}/${mangaSlug}/${chapterFolderName}/chapterName.txt`, chapterName);

    return `Scraping ${mangaSlug} ${chapterName} done`;
}

export { scrapeChapter };