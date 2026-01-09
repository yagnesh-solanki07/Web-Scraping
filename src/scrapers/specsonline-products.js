const puppeteer = require("puppeteer");
const XLSX = require("xlsx");
const { exec } = require("child_process");

function buildNextUrl(href) {
  const url = new URL(href);
  url.search = "";
  url.searchParams.set("show", "60");
  url.searchParams.set("orderby", "popularity");
  return url.toString();
}

async function waitForProducts(page) {
  try {
    await page.waitForFunction(
      () => document.querySelectorAll(".products li.product").length > 0,
      { timeout: 30000 }
    );
    return true;
  } catch {
    return false;
  }
}

async function scrapeSpecsOnline(url, label) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".products li.product", { timeout: 0 });

  console.log(`SpecsOnline ${label} scraping started`);

  let allProducts = [];
  let pageCount = 1;

  while (true) {
    console.log(`Page ${pageCount}`);

    const products = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".products li.product")).map(p => ({
        Id: p.querySelector("a.add_to_cart_button")
          ?.getAttribute("data-product_id") || "",
        Name: p.querySelector("h2")?.innerText.trim() || "",
        Price: p.querySelector('strong[aria-label="Price"] ins')
          ?.innerText.trim() || "",
        Variant: p.querySelector(".product-size")?.innerText.trim() || ""
      }))
    );

    allProducts.push(...products);

    const nextHref = await page.evaluate(() => {
      const next = document.querySelector("a.next.page-numbers");
      return next ? next.href : null;
    });

    if (!nextHref) break;

    const nextUrl = buildNextUrl(nextHref);

    // in-page navigation (SAFE)
    await page.evaluate((url) => {
      window.location.href = url;
    }, nextUrl);

    // retry-safe wait
    let loaded = await waitForProducts(page);

    if (!loaded) {
      console.log("Products slow, retrying once...");
      await new Promise(r => setTimeout(r, 8000));
      await page.reload({ waitUntil: "domcontentloaded" });
      loaded = await waitForProducts(page);

      if (!loaded) {
        console.log("Products not loading. Stopping.");
        break;
      }
    }


    if (!(await waitForProducts(page))) break;

    pageCount++;
      await new Promise(r => setTimeout(r, 8000));

  }

  const unique = Array.from(
    new Map(allProducts.map(p => [p.Id, p])).values()
  );

  console.log(`Total ${label}: ${unique.length}`);

  const fileName = `specsonline_${label}_${Date.now()}.xlsx`;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(unique);
  XLSX.utils.book_append_sheet(wb, ws, label);
  XLSX.writeFile(wb, fileName);

  exec(`start "" "${fileName}"`);
  await browser.close();
}

module.exports = scrapeSpecsOnline;
