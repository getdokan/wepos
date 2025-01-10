import fs from 'fs';
import { execSync } from 'child_process';
import { Browser, BrowserContextOptions, Page } from '@playwright/test';

export const helpers = {
    // capitalize first letter of a string [also capitalize after hyphen]
    capitalizeWords: (str: string) => str.replace(/\b\w/g, char => char.toUpperCase()).replace(/-\w/g, char => char.toUpperCase()),

    // capitalize first letter of each word
    capitalizeEachWord: (str: string) =>
        str
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' '),

    // capitalize
    capitalize: (word: string) => word[0]?.toUpperCase() + word.substring(1).toLowerCase(),

    // returns a random number between min (inclusive) and max (exclusive)
    getRandomArbitrary: (min: number, max: number) => Math.random() * (max - min) + min,

    // returns a random integer number between min (inclusive) and max (exclusive)
    getRandomArbitraryInteger: (min: number, max: number) => Math.floor(Math.random() * (max - min) + min),

    getRandomNumber: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,

    // random number between 0 and 1000
    randomNumber: () => Math.floor(Math.random() * 1000),

    // random array element
    randomItem: (arr: string | any[]) => arr[Math.floor(Math.random() * arr.length)],

    // remove array element
    removeItem: (arr: any[], removeItem: any) => arr.filter(item => item !== removeItem),

    // get count in array
    getCount: (array: any[], element: any) => array.filter(n => n === element).length,

    // is sub array
    isSubArray: (parentArray: any[], subArray: any[]) => subArray.every(el => parentArray.includes(el)),

    // check if object is empty
    isObjEmpty: (obj: object) => Object.keys(obj).length === 0,

    // opens the url in the default browser
    openUrl: (url: string) => open(url),

    // opens test report in the default browser
    openReport: () => open('playwright-report/html-report/index.html'),

    // string between two tags
    stringBetweenTags: (str: string): string => {
        const res = str.split(/<p>(.*?)<\/p>/g);
        return res[1] as string;
    },

    // escape regex
    escapeRegex: (str: string): string => {
        const escapePatten = /[.*+\-?^$|(){}[\]\\]/g; // Special Regex Characters: ., *, +,-, ?, ^, $, |, (, ), {, }, [, ], \, ],
        return str.replace(escapePatten, '\\$&'); // $& means the whole matched string
    },

    // convert string to regex
    stringToRegex: (str: string): RegExp => new RegExp(str),

    // convert string to price format
    price: (str: string): number =>
        parseFloat(
            str
                .replace(/[^\d\-.,\\s]/g, '')
                .replace(/,/g, '.')
                .replace(/\.(?=.*\.)/g, ''),
        ),

    // price as string
    priceString: (num: number, choice: string): string => (choice === 'US' ? Number(num).toLocaleString('es-US') : Number(num).toLocaleString('es-ES')),

    // remove dollar sign
    removeCurrencySign: (str: string): string => str.replace(/[^\d\-.,\\s]/g, ''),

    // round to two decimal
    roundToTwo(num: string | number) {
        return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
    },

    // calculate percentage
    percentage(number: number, percentage: number) {
        // return this.roundToTwo(number * (percentage / 100));
        return number * (percentage / 100);
    },

    percentageWithRound(number: number, percentage: number) {
        return this.roundToTwo(number * (percentage / 100));
        // return number * (percentage / 100);
    },

    // calculate percentage
    percentage1(number: number, percentage: number) {
        return (number * (percentage / 100)).toFixed(2);
    },

    // string to slug
    slugify(str: string) {
        return (
            str
                .toString() // Cast to string (optional)
                .normalize('NFKD') // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase() // Convert the string to lowercase letters
                .trim() // Remove whitespace from both sides of a string (optional)
                .replace(/\s+/g, '-') // Replace spaces with -
                .replace(/[^\w-]+/g, '') // Remove all non-word chars
                // .replace(/\_/g, '-')           		// Replace _ with -
                .replace(/--+/g, '-') // Replace multiple - with single -
                .replace(/-$/g, '')
        ); // Remove trailing -
    },

    // check file existence
    fileExists(filePath: string) {
        return fs.existsSync(filePath);
    },

    // read file
    readFile(filePath: string) {
        return fs.readFileSync(filePath, 'utf8');
    },

    // read json
    readJson(filePath: string) {
        if (fs.existsSync(filePath)) {
            return JSON.parse(this.readFile(filePath));
        }
    },

    // read a single json data
    readJsonData(filePath: string, propertyName: string) {
        const data = this.readJson(filePath);
        return data[propertyName];
    },

    // write a single json data
    writeJsonData(filePath: string, property: string, value: string) {
        const jsonData = this.readJson(filePath);
        jsonData[property] = value;
        this.writeFile(filePath, JSON.stringify(jsonData, null, 2));
    },

    // write file
    writeFile(filePath: string, content: string) {
        fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    },

    // delete file
    deleteFile(filePath: string) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    },

    // append file
    appendFile(filePath: string, content: string) {
        fs.appendFileSync(filePath, content, { encoding: 'utf8' });
    },

    // rename file
    renameFile(newFilePath: string, oldFilePath: string) {
        fs.renameSync(newFilePath, oldFilePath);
    },

    // replace data in file
    replaceData(filePath: string, data: string, replaceData: string) {
        const fileData = this.readFile(filePath);
        const updatedData = fileData.replace(data, replaceData);
        this.writeFile(filePath, updatedData);
    },

    // create env
    createEnvVar(key: string, value: string) {
        console.log(`${key}=${value}`);
        const content = '\n' + `${key}=${value}`;
        process.env[key] = value;
        this.appendFile('.env', content); // for local testing
    },

    // append content to .env file
    appendEnv(content: string) {
        content += '\n';
        this.appendFile('.env', content);
    },

    // write env json
    writeEnvJson(property: string, value: string) {
        const filePath = 'utils/data.json';
        let envData: { [key: string]: string } = {};
        if (fs.existsSync(filePath)) {
            envData = this.readJson(filePath);
        }
        envData[property] = value;
        this.writeFile(filePath, JSON.stringify(envData, null, 2));
    },

    // execute command
    async exeCommand(command: string) {
        const output = execSync(command, { encoding: 'utf-8' });
        console.log(output);
    },

    // create a new page
    async createPage(browser: Browser, options?: BrowserContextOptions | undefined) {
        const browserContext = await browser.newContext(options);
        return browserContext.newPage();
    },

    // close pages
    async closePages(pages: Page[]): Promise<void> {
        for (const page of pages) {
            await page.close();
        }
    },

    // rgb (rgb(r, g, b)) to hex (#rrggbb) color
    rgbToHex(rgb: string): string {
        const [r, g, b]: number[] = rgb.match(/\d+/g)!.map(Number);
        return `#${((1 << 24) + (r! << 16) + (g! << 8) + b!).toString(16).slice(1).toUpperCase()}`;
    },

    // hex (#rrggbb) to rgb (rgb(r, g, b)) color
    hexToRgb(hex: string): string {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return `rgb(${r}, ${g}, ${b})`;
    },
};
