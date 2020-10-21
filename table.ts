import { Sabr } from "./sabr.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

export class SabrTable<T> {
  /** The name of the table. Defaults to "sabr" */
  name = "sabr";
  /** The main sabr class */
  sabr: Sabr;

  constructor(sabr: Sabr, name: string) {
    this.sabr = sabr;
    this.name = name;

    this.sabr.tables.set(name, this);
  }

  /** Get all documents from a table. */
  async getAll(returnArray = false) {
    const files = Deno.readDirSync(
      Deno.realPathSync(`${this.sabr.directoryPath}${this.name}`),
    );

    const data = new Map<string, T>();

    for (const file of files) {
      if (!file.name || !file.isFile) continue;

      try {
        // Substring remove the file type `.json` from file.name
        const name = file.name.substring(0, file.name.lastIndexOf("."));
        const json = await this.get(name);
        if (json) data.set(name, json);
      } catch (error) {
        this.sabr.error(
          `[Sabr Error: getAll]: Unable to read file ${this.sabr.directoryPath}${this.name}/${file.name}`,
          error,
        );
      }
    }

    return returnArray ? [...data.values()] : data;
  }

  /** Get a document from a table. */
  async get(id: string): Promise<T | undefined> {
    try {
      const data = await Deno.readFile(
        `${this.sabr.directoryPath}${this.name}/${id}.json`,
      );
      return JSON.parse(decoder.decode(data));
    } catch (error) {
      this.sabr.error(
        `[Sabr Error: get] Unable to read file file://${this.sabr.directoryPath}${this.name}/${id}.json`,
        error,
      );
    }
  }

  /** Checks if a document exists. */
  has(id: string) {
    try {
      Deno.readFileSync(`${this.sabr.directoryPath}${this.name}/${id}.json`);
      return true;
    } catch {
      return false;
    }
	}

  /** Creates a new document into a table. */
  create(id: string, data: Record<string, unknown> = {}) {
    const encoded = encoder.encode(JSON.stringify({ id, ...data }));
    return Deno.writeFileSync(
      `${this.sabr.directoryPath}${this.name}/${id}.json`,
      encoded,
    );
  }

  /** Updates a documents data. If this document does not exist, it will create the document. */
  async update(id: string, data: Record<string, unknown> = {}) {
		const existing = await this.get(id) || {};
    return this.create(id, existing ? { ...existing, ...data } : data);
  }

  /** Deletes a document from the table. */
  delete(id: string) {
    Deno.removeSync(`${this.sabr.directoryPath}${this.name}/${id}.json`);
  }
}
