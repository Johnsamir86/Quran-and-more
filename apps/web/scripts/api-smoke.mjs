import { readFileSync } from "node:fs";
for (const line of readFileSync(process.argv[2], "utf8").split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { createServerClient } = await import("@quranjs/api/server");
const client = createServerClient({
  clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET,
  contentScopeMode: "granular",
  services: { gatewayUrl: process.env.GATEWAY_URL, oauth2BaseUrl: process.env.OAUTH2_BASE_URL },
});
const chapters = await client.content.v4.chapters.list();
console.log("chapters:", chapters.map(c => `${c.id}:${c.nameArabic}`).join(", "));
const verses = await client.content.v4.verses.byChapter("1", { translations: [131], words: true, perPage: 7, fields: { textUthmani: true } });
console.log("verses:", verses.length, "first:", verses[0].textUthmani, "|", verses[0].translations?.[0]?.text?.slice(0, 60));
console.log("content keys:", Object.keys(client.content.v4));
console.log("auth keys:", Object.keys(client.auth.v1));
console.log("top keys:", Object.keys(client));
