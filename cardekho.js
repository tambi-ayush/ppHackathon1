let puppeteer = require('puppeteer');
let fs = require('fs');
let xlsx=require('xlsx');
let path = require('path');
let carName = "variants";
let brandName = " Hyundai";
let currentPath = process.cwd();
let PDFDocument=require('pdfkit');
let mainFolder = path.join(currentPath, brandName.trim());
fs.mkdirSync(mainFolder);
var fullFilesPathArr = [];
(async function fn() {
    let browserObj = await puppeteer.launch({ headless: false, defaultViewport: null, args: ["--start-maximized", "--disable-notifications"] });
    let page = await browserObj.newPage();
    await page.goto("https://www.google.com");
    await page.type("input[title='Search']", "cardekho");
    await page.keyboard.press('Enter', { delay: 100 });
    await waitAndClick("h3[class='LC20lb DKV0Md']", page);
    await page.waitForTimeout(500);
    await waitAndClick("a[title='New Car']", page);
    await waitAndClick("li[title='By Model']", page);
    await waitAndClick("input[placeholder='Select Brand']", page);
    var brandArr = await page.$$("li[class='gs_ta_choice']");
    console.log("drop down menu");
    for (var i = 0; i < brandArr.length; i++) {
        let brand = await page.evaluate(function (elem) {
            return elem.textContent;
        }, brandArr[i]);
        if (brand == brandName) {
            console.log("brand name is " + brand);
            //await page.click(brandArr[i]);--> it will throw the error
            await page.evaluate(function (elem) { return elem.click(); }, brandArr[i]);
            await page.click(".gsc_col-md-4.gsc_col-sm-4.gsc_col-xs-12 button[name='go']");
            break;
        }
    }
    await page.waitForSelector(".gsc_col-sm-12.gsc_col-xs-12.gsc_col-md-8.listView.holder.posS h3 a");
    var carArr = await page.$$(".gsc_col-sm-12.gsc_col-xs-12.gsc_col-md-8.listView.holder.posS h3 a");
    let linkArr = [];

    for (var i = 0; i < carArr.length; i++) {
        let carfileName = await page.evaluate(function (elem) { return elem.textContent; }, carArr[i]);
        fullFilesPathArr.push(path.join(mainFolder, carfileName.trim() + ".xlsx"));
        let temp_link = await page.evaluate(function (elem) {
            return elem.getAttribute('href');
        }, carArr[i]);
        linkArr.push(temp_link);
    }
    for (var i = 0; i < linkArr.length; i++) {
        var mainUrl = `https://www.cardekho.com${linkArr[i]}`;
        await page.goto(mainUrl);
        await waitAndClick("div[class='BottomLinkViewAll arrowDnUp']", page);

        await page.waitForSelector(".allvariant.contentHold tbody tr td span[class='kmpl']");
        var variantsArr = await page.$$(".allvariant.contentHold tbody tr td span[class='kmpl']");
        await page.waitForSelector(".allvariant.contentHold tbody tr td a");
        var variantsArr2 = await page.$$(".allvariant.contentHold tbody tr td a");
        await page.waitForSelector(".allvariant.contentHold tbody tr td[class='pricevalue']");
        var priceArr = await page.$$(".allvariant.contentHold tbody tr td[class='pricevalue']");
        let arr=[];
        for (var j = 0; j < variantsArr.length; j++) {
            let name = await page.evaluate(function (elem) { return elem.getAttribute('title'); }, variantsArr2[j]);
            let detailText = await page.evaluate(function (elem) { return elem.textContent; }, variantsArr[j]);
            let detailTextArr = detailText.split(",");
            let money = await page.evaluate(function (elem) { return elem.textContent; }, priceArr[j]);
            let obj = {
                Model: name,
                Engine_Capacity: detailTextArr[0],
                Driving_type: detailTextArr[1],
                Fuel_type: detailTextArr[2],
                Mileage: detailTextArr[3],
                Price: money
            };
            arr.push(obj);
        }
        let newWB=xlsx.utils.book_new();
        let newWS=xlsx.utils.json_to_sheet(arr);
        xlsx.utils.book_append_sheet(newWB,newWS,"nayi sheet");
        xlsx.writeFile(newWB,fullFilesPathArr[i]);
    }
})();

function waitAndClick(selector, page) {
    return new Promise(function (resolve, reject) {
        let waitPepPromise = page.waitForSelector(selector, { visible: true });
        waitPepPromise.then(function () {
            let pepResultPromise = page.click(selector);
            return pepResultPromise;
        }).then(function () {
            resolve();
        }).catch(function (err) {
            resolve();
        })
    })
}

