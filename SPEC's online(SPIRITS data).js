
const puppeteer = require("puppeteer");
const XLSX = require("xlsx");
const { exec } = require("child_process");

const START_URL = "https://specsonline.com/product-category/spirits/?show=80&orderby=popularity";

function buildNextUrl(href) {
  const url = new URL(href);
  url.search = "";
  url.searchParams.set("show", "80");
  url.searchParams.set("orderby", "popularity");
  return url.toString();
}

// robust product wait
async function waitForProducts(page) {
  try {
    await page.waitForFunction(() => {
      return document.querySelectorAll(".products li.product").length > 0;
    }, { timeout: 30000 });
    return true;
  } catch {
    return false;
  }
}

async function scrapeWines() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null
  });

  const page = await browser.newPage();

    page.setDefaultNavigationTimeout(0);
  page.setDefaultTimeout(0);

  console.log("Complete human verification manually...");
  await page.goto(START_URL, { waitUntil: "domcontentloaded" });

  await page.waitForSelector(".products li.product", { timeout: 0 });
  console.log(" Verification passed. Starting scraping...");

  let allWines = [];
  let pageCount = 1;

  while (true) {
    console.log(`Scraping page ${pageCount}`);

    const wines = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".products li.product")).map(p => ({
        Id: p.querySelector("a.add_to_cart_button")
          ?.getAttribute("data-product_id")?.trim() || "",
        Name: p.querySelector("h2")?.innerText.trim() || "",
        Price: p.querySelector('strong[aria-label="Price"] ins')?.innerText.trim() || "",
        "Variant-Detail":
          p.querySelector(".product-size")?.innerText.trim() || ""
      }));
    });

    console.log(`Page ${pageCount}: ${wines.length} products`);
    allWines.push(...wines);

    const nextHref = await page.evaluate(() => {
      const next = document.querySelector("a.next.page-numbers");
      return next ? next.href : null;
    });

    if (!nextHref) {
      console.log("No next page. Finished.");
      break;
    }

    const nextUrl = buildNextUrl(nextHref);
    console.log(`Next URL: ${nextUrl}`);

    // in-page navigation (unchanged)
    await page.evaluate(url => {
      window.location.href = url;
    }, nextUrl);

    // robust wait + retry
    let loaded = await waitForProducts(page);

    if (!loaded) {
      console.log("Products slow, retrying once...");
      await new Promise(r => setTimeout(r, 5000));
      await page.evaluate(() => location.reload());
      loaded = await waitForProducts(page);

      if (!loaded) {
        console.log("Products did not load. Stopping safely.");
        break;
      }
    }

    await new Promise(r => setTimeout(r, 1200));
    pageCount++;
  }

  // Deduplicate (safety)
  const unique = Array.from(
    new Map(allWines.map(p => [p.Id, p])).values()
  );

  console.log(`Total wines scraped: ${unique.length}`);

  const fileName = `wines_${Date.now()}.xlsx`;
  const worksheet = XLSX.utils.json_to_sheet(unique);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Wines");
  XLSX.writeFile(workbook, fileName);

  exec(`start "" "${fileName}"`);
  await browser.close();
}

scrapeWines();
