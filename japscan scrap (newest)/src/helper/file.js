import fs from 'fs';
import fetch from 'node-fetch';
const saveInJsonFile = async (data, fullPath) => {

    createFolderAndSubFolder(fullPath);

    await fs.writeFileSync(
        fullPath,
        JSON.stringify(data, null, 2)
    );
};

const generateFilePrefixWithFullTime = () => {
    const date = new Date();
    // const year = date.getFullYear();
    // const month = date.getMonth() + 1;
    // const dayOfMonth = date.getDate();
    // const hour = date.getHours();
    // const minutes = date.getMinutes();
    // const seconds = date.getSeconds();
    const timestamp = date.getTime();

    // return `${year}-${month}-${dayOfMonth}-${hour}-${minutes}-${seconds}-${timestamp}`;
    return timestamp;
};

const createFolderAndSubFolder = (fullPath) => {
    const folderPath = fullPath.split('/').slice(0, -1).join('/');
    fs.mkdirSync(folderPath, {recursive: true});
};

const downloadFile = async (url, path) => {
    await createFolderAndSubFolder(path);
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(path, buffer);
}

export {
    saveInJsonFile,
    createFolderAndSubFolder,
    downloadFile,
    generateFilePrefixWithFullTime
};