const { chromium } = require("playwright");
const XLSX = require("xlsx");

const CATEGORY_URL = "https://www.totalwine.com/wine/c/c0020";
const STORE_ID = 1108;
const PAGE_SIZE = 150;

(async () => {
  const browser = await chromium.launch({ headless: false });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
  });

  const page = await context.newPage();

  // 1️⃣ Load category page
  await page.goto(CATEGORY_URL, { waitUntil: "domcontentloaded" });

  // 2️⃣ Allow scripts, cookies, SW, consent to initialize
  await page.waitForTimeout(6000);

//   Add before API loop:
console.log("⚠️ Solve CAPTCHA manually if shown");
await page.waitForTimeout(60000);


// After CAPTCHA → 403 disappears

  let pageNo = 1;
  let allProducts = [];
  const seenIds = new Set();

  while (true) {
    const result = await page.evaluate(
      async ({ pageNo, PAGE_SIZE, STORE_ID }) => {
        const url = `/search/api/product/categories/v2/categories/c0020/products?page=${pageNo}&pageSize=${PAGE_SIZE}&state=US-CA&shoppingMethod=INSTORE_PICKUP,DELIVERY&userShoppingMethod=INSTORE_PICKUP&allStoresCount=true&storeId=${STORE_ID}&batch=true`;

        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {
            accept: "application/json, text/plain, */*",
          },
        });

        const contentType = res.headers.get("content-type") || "";

        // ❗ If HTML is returned, stop
        if (!contentType.includes("application/json")) {
          const text = await res.text();
          return {
            error: "NOT_JSON",
            status: res.status,
            preview: text.slice(0, 200),
          };
        }

        return res.json();
      },
      { pageNo, PAGE_SIZE, STORE_ID }
    );

    // ❌ HTML / blocked response
    if (result?.error === "NOT_JSON") {
      console.error("❌ Non-JSON response detected");
      console.error("Status:", result.status);
      console.error("Preview:", result.preview);
      break;
    }

    const products = result?.products || [];
    console.log(`📦 Page ${pageNo}: ${products.length}`);

    if (!products.length) break;

for (const p of products) {
  if (seenIds.has(p.id)) {
    console.log("🔁 Duplicate skipped:", p.name);
    continue;
  }
  seenIds.add(p.id);
  allProducts.push(p);
}
    pageNo++;

    await page.waitForTimeout(800); // anti-rate-limit
  }

  await browser.close();

  // 3️⃣ Save to Excel
  if (allProducts.length) {
    const sheet = XLSX.utils.json_to_sheet(
      allProducts.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand?.name,
        price: p.price?.regular,
        size: p.volume,
        alcohol: p.alcoholPercentage,
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "TotalWine");

    XLSX.writeFile(wb, "totalwine_products.xlsx");
    console.log("✅ DONE: totalwine_products.xlsx");
  } else {
    console.log("⚠️ No products saved");
  }
})();
