import { server$ } from "@builder.io/qwik-city";
import type { Page } from "puppeteer";
import puppeteer from "puppeteer";

export type BrowserAction = ClickAction | InputAction | NavigateAction;

export type ClickAction = {
  action: "click";
  selector: string;
};

export type InputAction = {
  action: "input";
  selector: string;
  text: string;
};

export type NavigateAction = {
  action: "navigate";
  url: string;
};

export function parseActions(str: string) {
  return JSON.parse(str) as BrowserAction[];
}

const headless = false;

async function getMinimalPageHtml(page: Page) {
  return await page.evaluate(() => {
    const main =
      document.querySelector("main") || document.querySelector("body")!;
    // main = main.cloneNode(true) as HTMLElement;

    main.querySelectorAll("script").forEach((el) => el.remove());
    main.querySelectorAll("style").forEach((el) => el.remove());
    main.querySelectorAll("link").forEach((el) => el.remove());
    main.querySelectorAll("meta").forEach((el) => el.remove());
    main.querySelectorAll("title").forEach((el) => el.remove());
    main.querySelectorAll("noscript").forEach((el) => el.remove());
    main.querySelectorAll("iframe").forEach((el) => el.remove());
    main.querySelectorAll("img").forEach((el) => el.remove());
    main.querySelectorAll("svg").forEach((el) => el.remove());
    main.querySelectorAll("video").forEach((el) => el.remove());
    main.querySelectorAll("audio").forEach((el) => el.remove());
    main.querySelectorAll("canvas").forEach((el) => el.remove());
    main.querySelectorAll("object").forEach((el) => el.remove());
    main.querySelectorAll("[aria-hidden=true]").forEach((el) => el.remove());

    for (const attr of ["class", "target", "rel", "ping", "style"]) {
      [main as Element]
        .concat(Array.from(main.querySelectorAll(`[${attr}]`)))
        .forEach((el) => el.removeAttribute(attr));
    }

    main.querySelectorAll("*").forEach((el) => {
      // Remove data-* attrs
      if (el instanceof HTMLElement) {
        Object.keys(el.dataset).forEach((dataKey) => {
          delete el.dataset[dataKey];
        });
      }

      Array.from(el.attributes).forEach((attr) => {
        // Google adds a bunch of js* attrs
        if (attr.name.startsWith("js")) {
          el.removeAttribute(attr.name);
        }
      });

      // // Unwrap empty divs and spans
      if (["div", "span"].includes(el.tagName.toLowerCase())) {
        // Check has no attributes
        if (!el.attributes.length) {
          el.replaceWith(...[document.createTextNode(" "), ...el.childNodes]);
        }
      }
    });

    // Add all values to the HTML directly
    main.querySelectorAll("input,textarea,select").forEach((_el) => {
      const el = _el as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement;
      if (el.value) {
        el.setAttribute("value", el.value);
      }
    });

    return {
      html: main.innerHTML.replace(/\s+/g, " ").trim(),
      url: location.href,
    };
  });
}

const debugBrowser =
  process.env.DEBUG === "true" || process.env.DEBUG_BROWSER === "true";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getPageContents = server$(
  async (url: string, prevActions: BrowserAction[] = [], maxLength = 20000) => {
    const browser = await puppeteer.launch({ headless });
    let page = await browser.newPage();
    browser.on("targetcreated", async () => {
      page = (await browser.pages()).at(-1)!;
    });

    if (debugBrowser) {
      page.on("console", (message) =>
        console.log(
          `${message.type().substring(0, 3).toUpperCase()} ${message.text()}`
        )
      );
    }
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1080, height: 1024 });

    await page.goto(url, {
      waitUntil: "networkidle2",
    });

    if (debugBrowser) {
      console.log("actions", prevActions);
    }
    for (const action of prevActions) {
      if (action.action === "navigate") {
        if (action.url === url) {
          continue;
        }
        await page.goto(action.url, {
          waitUntil: "networkidle2",
        });
      } else if (action.action === "click") {
        await page.click(action.selector).catch(async (err) => {
          console.warn("error clicking", err);
          // Fall back to programmatic click, e.g. for a hidden element
          await page.evaluate((selector) => {
            const el = document.querySelector(selector) as HTMLElement;
            el?.click();
          }, action.selector);
        });
      } else if (action.action === "input") {
        await page.type(action.selector, action.text);
      }
      await delay(1000);
      await page
        .waitForNetworkIdle({
          timeout: 2000,
        })
        .catch(() => {
          // Errors are thrown on timeout, but we don't care about that
        });
    }

    const { html, url: currentUrl } = await getMinimalPageHtml(page);

    if (!debugBrowser) {
      await page.close();
      await browser.close();
    }

    return { html: html.slice(0, maxLength), url: currentUrl };
  }
);
