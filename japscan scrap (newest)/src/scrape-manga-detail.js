import playwright from 'playwright';
import {downloadFile, saveInJsonFile} from "./helper/file.js";
import {config} from "../config/scraper.js";
import {cleanObject} from "./helper/object.js";

const scrapeMangaDetails = async (mangaSlug) => {
    const browser = await playwright.chromium.launch(config.browser);
    const page = await browser.newPage();

    page.__proto__.getMangaDetailByXPath = async (text) => {
        return await page.evaluate((text) => {
            const el = document.evaluate(
                `//span[contains(text(), "${text}")]`,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;

            return el ? el.nextSibling.textContent.trim().replace(/\s+/g, ' ') : '';
        }, text).catch(() => '');
    }

    await page.goto(`${config.baseUrl}/manga/${mangaSlug}/`);

    await page.waitForSelector('#main');

    const mangaDetails = {
        title: await page.$eval('#main h1', (el) => el.textContent),
        image: await page.$eval('#main img', (el) => el.src),
        originalName: await page.getMangaDetailByXPath('Nom Original:'),
        alternativeName: await page.getMangaDetailByXPath('Nom(s) Alternatif(s):'),
        type: await page.$eval('//span[contains(text(), "Type:")]', (el) => el.nextElementSibling.nextElementSibling.textContent.trim()),
        status: await page.getMangaDetailByXPath('Statut:'),
        publishedAt: await page.getMangaDetailByXPath('Date Sortie:'),
        demographic: await page.getMangaDetailByXPath('Démographique:'),
        gender: await page.getMangaDetailByXPath('Genre(s):'),
        artist: await page.getMangaDetailByXPath('Artiste(s):'),
        author: await page.getMangaDetailByXPath('Auteur(s):'),
        volumeVo: await page.getMangaDetailByXPath('Volumes VO:'),
        volumeVf: await page.getMangaDetailByXPath('Volumes VF:'),
        recommendedAge: await page.getMangaDetailByXPath('Âge conseillé'),
        synopsis: await page.$eval('//div[contains(text(), "Synopsis:")]', (el) => el.nextElementSibling.textContent.trim()),
    };

    await downloadFile(mangaDetails.image, `${config.outputDir}/${mangaSlug}/details/${mangaSlug}.webp`);

    mangaDetails.image = `${mangaSlug}.webp`;

    await saveInJsonFile(
        cleanObject(mangaDetails),
        `${config.outputDir}/${mangaSlug}/details/detail.json`
    );

    await browser.close();
};

export { scrapeMangaDetails };