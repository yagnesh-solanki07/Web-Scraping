const puppeteer = require("puppeteer");
const XLSX = require("xlsx");
const { exec } = require("child_process");

// pagination-ready URL builder
function buildNextUrl(baseUrl, page) {
  const url = new URL(baseUrl);
  url.search = "";
  url.searchParams.set("pageSize", "100");
  url.searchParams.set("aty", "1,1,0,0");
  url.searchParams.set("page", page);
  return url.toString();
}

// robust product wait
async function waitForProducts(page, timeout = 60000) {
  try {
    await page.waitForFunction(
      () =>
        document.querySelectorAll(".productCard__bcfe4485").length > 0,
      { timeout }
    );
    return true;
  } catch {
    console.log("Products not found");
    return false;
  }
}

async function scrapeTotalWine(baseUrl, label) {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins,site-per-process",
      "--no-sandbox",
      "--disable-setuid-sandbox"
    ]
  });

  const page = await browser.newPage();

  let allProducts = [];
  let pageCount = 1;

  while (true) {
    const url = buildNextUrl(baseUrl, pageCount);
    console.log(`TotalWine ${label} – Page ${pageCount}`);

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 0
    });

    const hasProducts = await waitForProducts(page);
    if (!hasProducts) break;

    const products = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(".productCard__bcfe4485")
      ).map(card => ({
        SKU:
          card.querySelector('button[data-sku]')
            ?.getAttribute("data-sku") || "",
        Name:
          card.querySelector("h2 a")
            ?.innerText.trim() || "",
        Variant:
          card.querySelector("h2 span")
            ?.innerText.trim() || "",
        Price:
          card.querySelector(".price__ff218822")
            ?.innerText.trim() || ""
      }));
    });

    if (!products.length) break;

    allProducts.push(...products);
    pageCount++;

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`Total ${label} scraped: ${allProducts.length}`);

  const fileName = `totalwine_${label}_${Date.now()}.xlsx`;
  const worksheet = XLSX.utils.json_to_sheet(allProducts);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, label.toUpperCase());
  XLSX.writeFile(workbook, fileName);

  exec(`start "" "${fileName}"`);
  await browser.close();
}

module.exports = scrapeTotalWine;
