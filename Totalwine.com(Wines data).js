const puppeteer = require("puppeteer");
const XLSX = require("xlsx");
const { exec } = require("child_process");

const START_URL =
  "https://www.totalwine.com/wine/c/c0020?&pageSize=72&aty=1,1,0,0";

//pagination-ready URL builder
function buildNextUrl(baseUrl, page) {
  const url = new URL(baseUrl);
  url.search = "";
  url.searchParams.set("pageSize", "72");
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

async function scrapeWines() {
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

  let allWines = [];
  let pageCount = 1;

  while (true) {
    const url = buildNextUrl(START_URL, pageCount);
    console.log(`Scraping page ${pageCount}`);

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 0
    });

    const hasProducts = await waitForProducts(page);
    if (!hasProducts) break;

    const wines = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(".productCard__bcfe4485")
      ).map(card => ({
        SKU:
          card.querySelector('button[data-sku]')
            ?.getAttribute("data-sku") || "",
        Name:
          card.querySelector("h2 a")
            ?.innerText.trim() || "",
        "Variant-Detail":
          card.querySelector("h2 span")
            ?.innerText.trim() || "",
        Price:
          card.querySelector(".price__ff218822")
            ?.innerText.trim() || ""
      }));
    });

    if (!wines.length) {
      console.log("No products, stopping.");
      break;
    }

    allWines.push(...wines);

    pageCount++;
    await new Promise(r => setTimeout(r, 1200)); // polite delay
  }

  // deduplicate by SKU
  // const unique = Array.from(
  //   new Map(allWines.map(p => [p.SKU, p])).values()
  // );

  console.log(`Total wines scraped: ${allWines.length}`);

  const fileName = `wines_${Date.now()}.xlsx`;
  const worksheet = XLSX.utils.json_to_sheet(allWines);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Wines");
  XLSX.writeFile(workbook, fileName);

  exec(`start "" "${fileName}"`);
  await browser.close();
}

scrapeWines();
