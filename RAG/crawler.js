// crawler.js
import { web_fetch } from 'your-fetch-lib'; // cheerio + axios
import { OllamaEmbeddings } from "@langchain/ollama";
import { MongoClient } from "mongodb";
import { Binary } from "bson";

// Step 1: Crawl the directory tree
async function crawlSite() {
  const makes = await fetchLinks('https://charm.li/');
  for (const make of makes) {
    const years = await fetchLinks(make.url);
    for (const year of years) {
      const models = await fetchLinks(year.url);
      for (const model of models) {
        const content = await fetchPageText(model.url);
        await embedAndStore({ make, year, model, content });
      }
    }
  }
}

// Step 2: Embed + store (exactly like your add-db-embeddings.js)
async function embedAndStore({ make, year, model, content }) {
  const textToEmbed = `Make: ${make} Year: ${year} Model: ${model} | ${content}`;
  const vector = await embeddings.embedQuery(textToEmbed);
  const vectorBinary = Binary.fromFloat32Array(new Float32Array(vector));
  
  await collection.insertOne({
    make, year, model, url: model.url,
    content,
    plot_embedding_qwen3: vectorBinary  // keep field name consistent with your index
  });
}