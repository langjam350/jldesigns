import * as cheerio from 'cheerio'; // Ensure you have cheerio installed: npm install cheerio

export function stripToContent(html: string): string {
    const $ = cheerio.load(html);
    
    // Remove title, meta, and any script/style tags
    $("head, script, style").remove();

    // Extract plain text
    const text = $("body").text();

    // Clean up whitespace and return
    return text.replace(/\s+/g, " ").trim();
}
