import * as readline from "readline";
import {scrapeMangaDetails} from "./scrape-manga-detail.js";
import {scrapeChapter} from "./scrape-chapter.js";


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter manga slug: ', (mangaSlug) => {
    // scrapeMangaDetails(mangaSlug).then(() => {
    //     console.log('Manga details scraped successfully');
    //     rl.close();
    // }).catch((err) => {
    //     console.error(err);
    //     rl.close();
    // });

    scrapeChapter(mangaSlug).then(() => {
        console.log('Manga chapter scraped successfully');
        rl.close();
    })
});