import { server$ } from "@builder.io/qwik-city";
import type { Page, Browser } from "puppeteer";
import puppeteer from "puppeteer";

export type ActionStep =
  | ClickAction
  | InputAction
  | NavigateAction
  | AskAction
  | TerminateAction;

export type ClickAction = {
  action: "click";
  selector: string;
};

export type AskAction = {
  action: "ask";
  question: "string";
};

export type TerminateAction = {
  action: "terminate";
  reason: "string";
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

const headless = false;

function decodeEntities(encodedString: string) {
  const translateRe = /&(nbsp|amp|quot|lt|gt);/g;
  const translate: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    quot: '"',
    lt: "<",
    gt: ">",
  };
  return encodedString
    .replace(translateRe, function (match, entity) {
      return translate[entity];
    })
    .replace(/&#(\d+);/gi, function (match, numStr) {
      const num = parseInt(numStr, 10);
      return String.fromCharCode(num);
    });
}

async function getMinimalPageHtml(page: Page) {
  return await page.evaluate(() => {
    let main =
      document.querySelector("main") || document.querySelector("body")!;
    main = main.cloneNode(true) as HTMLElement;

    const selectorsToDelete = [
      "script",
      "style",
      "link",
      "meta",
      "header",
      "title",
      "noscript",
      "iframe",
      "img",
      "svg",
      "video",
      "audio",
      "canvas",
      "object",
      "[aria-hidden=true]",
    ];

    for (const element of selectorsToDelete) {
      main.querySelectorAll(element).forEach((el) => el.remove());
    }

    for (const attr of ["class", "target", "rel", "ping", "style"]) {
      [main as Element]
        .concat(Array.from(main.querySelectorAll(`[${attr}]`)))
        .forEach((el) => el.removeAttribute(attr));
    }

    function removeNthQueryParams(url: string, n: number) {
      // Parse the URL using the URL constructor
      const parsedUrl = new URL(url, location.origin);

      // Get the search parameters from the parsed URL
      const searchParams = parsedUrl.searchParams;

      // Convert the search parameters to an array of key-value pairs
      const paramsArray = Array.from(searchParams.entries());

      // Clear all existing search parameters
      searchParams.forEach((value, key) => {
        searchParams.delete(key);
      });

      // Add back only the first n query parameters
      for (let i = 0; i < Math.min(n, paramsArray.length); i++) {
        const [key, value] = paramsArray[i];
        searchParams.append(key, value);
      }

      return parsedUrl.href;
    }

    main.querySelectorAll("*").forEach((el) => {
      if (el instanceof HTMLAnchorElement) {
        // Only keep the first two query params, to avoid pulling in high entropy
        // tracking params that eat up lots of tokens that are usually later in the URL
        const href = el.getAttribute("href");
        if (href) {
          const numParams = href.match(/&/g)?.length;
          if (typeof numParams === "number" && numParams > 1) {
            el.setAttribute("href", removeNthQueryParams(href, 2));
          }
        }
      }

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

      // Unwrap empty divs and spans
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

let persistedBrowser: Browser | undefined;
let persistedPage: Page | undefined;

function modifySelector(selector: string) {
  return decodeEntities(selector).replace("href=", "href^=");
}

export const getPageContents = server$(
  async (
    url: string,
    allActions: ActionStep[] = [],
    persist = false,
    maxLength = 18000
  ) => {
    const hasExistingBrowser = !!persistedBrowser;
    url = decodeEntities(url);

    console.log({
      persist,
      hasExistingBrowser,
      hasExistingPage: !!persistedPage,
    });

    const browser =
      persist && persistedBrowser
        ? persistedBrowser
        : await puppeteer.launch({
            headless,
          });
    let page =
      persist && persistedPage ? persistedPage : await browser.newPage();

    const actions = persist ? allActions.slice(-1) : allActions;

    if (!hasExistingBrowser) {
      browser.on("targetcreated", async () => {
        page = (await browser.pages()).at(-1)!;
        persistedPage = page;
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

      if (persist) {
        persistedBrowser = browser;
        persistedPage = page;
      }
    }

    if (debugBrowser) {
      console.log("actions", actions);
    }
    for (const action of actions) {
      if (action.action === "navigate") {
        if (action.url === url) {
          continue;
        }
        await page.goto(decodeEntities(action.url), {
          waitUntil: "networkidle2",
        });
      } else if (action.action === "click") {
        const selector = modifySelector(action.selector);
        await page.click(selector).catch(async (err) => {
          console.warn("error clicking", err);
          // Fall back to programmatic click, e.g. for a hidden element
          await page.evaluate((selector) => {
            const el = document.querySelector(selector) as HTMLElement;
            el?.click();
          }, selector);
        });
      } else if (action.action === "input") {
        await page
          .type(modifySelector(action.selector), action.text)
          .catch((err) => {
            // Ok to continue, often means selector not valid
            console.warn("error typing", err);
          });
      }
      await delay(500);
      await page
        .waitForNetworkIdle({
          timeout: 1000,
        })
        .catch(() => {
          // Errors are thrown on timeout, but we don't care about that
        });
    }

    const { html, url: currentUrl } = await getMinimalPageHtml(page);

    if (!persist && !debugBrowser) {
      await page.close();
      await browser.close();
    }

    return { html: html.slice(0, maxLength), url: currentUrl };
  }
);
