import { load } from "cheerio";

// Simple function to get static website contents
export async function getWebsiteContents(url: string) {
  const html = await fetch(url).then((response) => response.text());
  const $ = load(html);
  const body = $("body");
  body.find("script").remove();
  body.find("style").remove();
  body.find("link").remove();
  body.find("meta").remove();
  body.find("title").remove();
  body.find("noscript").remove();
  body.find("iframe").remove();
  body.find("img").remove();
  body.find("svg").remove();
  body.find("video").remove();
  body.find("audio").remove();
  body.find("canvas").remove();
  body.find("object").remove();

  return body.html()?.replace(/\s+/g, " ").trim();
}
