const puppeteer = require("puppeteer");
const XLSX = require("xlsx");
const { exec } = require("child_process");

const START_URL =
  "https://www.totalwine.com/spirits/c/c0030?pageSize=5&aty=1,1,0,0";

// LOW delays (human-safe)
function delay(min = 1200, max = 2200) {
  return new Promise(r =>
    setTimeout(r, Math.random() * (max - min) + min)
  );
}

async function scrapeTotalWineOneTab() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox"
    ]
  });

  const page = await browser.newPage();
  const results = [];
  const scrapedSKUs = new Set();
  let pageNo = 1;

  console.log("ONE-TAB AUTO MODE STARTED");

  await page.goto(START_URL, {
    waitUntil: "domcontentloaded",
    timeout: 0
  });

  // ===================== LISTING LOOP =====================
  while (true) {
    console.log(`Listing page ${pageNo}`);
    await page.waitForSelector(".productCard__bcfe4485");

    // Capture first SKU (for next-page detection)
    const firstSKU = await page.evaluate(() => {
      const btn = document.querySelector(
        '.productCard__bcfe4485 button[data-sku]'
      );
      return btn ? btn.getAttribute("data-sku") : "";
    });

    // Collect ALL products on this listing page
    const products = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".productCard__bcfe4485"))
        .map(card => {
          const skuBtn = card.querySelector('button[data-sku]');
          const nameEl = card.querySelector("h2 a");
          const priceEl = card.querySelector(".price__ff218822");
          const linkEl = card.querySelector("a");

          return {
            SKU: skuBtn ? skuBtn.getAttribute("data-sku") : "N/A",
            Name: nameEl ? nameEl.innerText.trim() : "N/A",
            Price: priceEl ? priceEl.innerText.trim() : "N/A",
            URL: linkEl ? linkEl.href : "N/A"
          };
        })
        .filter(p => p.SKU !== "N/A" && p.URL !== "N/A");
    });

    console.log(`Products found: ${products.length}`);

    // ===================== DETAIL LOOP =====================
    for (const product of products) {
      if (scrapedSKUs.has(product.SKU)) continue;

      console.log(`SKU ${product.SKU}`);

      await page.goto(product.URL, {
        waitUntil: "domcontentloaded",
        timeout: 0
      });

      // ---------- CAPTCHA PAUSE ----------
      while (true) {
        const isCaptcha = await page.evaluate(() =>
          document.body.innerText.toLowerCase().includes("captcha")
        );

        if (!isCaptcha) break;

        console.log("CAPTCHA detected — solve it manually");
        await delay(3000, 5000);
      }

      // ---------- SCRAPE DETAILS ----------
      try {
        await page.waitForSelector('[data-at="product-name-title"]');

        const details = await page.evaluate(() => {
          const getAttr = label => {
            const lbl = [...document.querySelectorAll(".odtLabel__e5fc92f3")]
              .find(el => el.innerText.trim() === label);
            const val = lbl ? lbl.nextElementSibling : null;

            return val
              ? (val.querySelector("a")
                  ? val.querySelector("a").innerText.trim()
                  : val.innerText.trim()) || "N/A"
              : "N/A";
          };

          return {
            Country: getAttr("Country"),
            State: getAttr("State"),
            Brand: getAttr("Brand"),
            "Spirits Type": getAttr("Spirits Type"),
            "Spirits Style": getAttr("Spirits Style"),
            ABV: getAttr("ABV"),
            Taste: getAttr("Taste")
          };
        });

        results.push({
          SKU: product.SKU,
          Name: product.Name,
          Price: product.Price,
          Country: details.Country,
          State: details.State,
          Brand: details.Brand,
          "Spirits Type": details["Spirits Type"],
          "Spirits Style": details["Spirits Style"],
          ABV: details.ABV,
          Taste: details.Taste
        });

        scrapedSKUs.add(product.SKU);
      } catch (err) {
        console.log("Failed SKU:", product.SKU);
      }

      // ---------- BACK TO LISTING ----------
      await page.goBack({
        waitUntil: "domcontentloaded",
        timeout: 0
      });

      await page.waitForSelector(".productCard__bcfe4485");
      await delay();
    }

    // ===================== NEXT LISTING PAGE =====================
    const hasNext = await page.evaluate(() => {
      const btn = document.querySelector(
        'a[data-at="product-search-pagination-nextlink"]'
      );
      return btn && !btn.hasAttribute("disabled");
    });

    if (!hasNext) {
      console.log("No more listing pages");
      break;
    }

    console.log("Moving to next listing page");

    await page.evaluate(() => {
      document
        .querySelector('a[data-at="product-search-pagination-nextlink"]')
        .scrollIntoView({ block: "center" });
      document
        .querySelector('a[data-at="product-search-pagination-nextlink"]')
        .click();
    });

    // Wait until listing content changes
    await page.waitForFunction(
      prev => {
        const btn = document.querySelector(
          '.productCard__bcfe4485 button[data-sku]'
        );
        return btn && btn.getAttribute("data-sku") !== prev;
      },
      { timeout: 0 },
      firstSKU
    );

    pageNo++;
    await delay(2500, 4000);
  }

  // ===================== SAVE =====================
  const fileName = `totalwine_one_tab_${Date.now()}.xlsx`;
  const ws = XLSX.utils.json_to_sheet(results);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DATA");
  XLSX.writeFile(wb, fileName);

  exec(`start "" "${fileName}"`);
  await browser.close();

  console.log("DONE — ONE TAB, FULLY AUTOMATIC (CAPTCHA MANUAL)");
}

scrapeTotalWineOneTab();
