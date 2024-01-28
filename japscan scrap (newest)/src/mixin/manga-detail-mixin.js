const getFirstPagePathToRead = async (page) => {
    return await page.evaluate(() => {
        const collapses = document.querySelectorAll('[id*="collapse-"]');
        return collapses[collapses.length - 1].lastElementChild.querySelector('a').getAttribute('href');
    })
};

export { getFirstPagePathToRead };