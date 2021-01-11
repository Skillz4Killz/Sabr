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
  async getAll(returnArray?: false): Promise<Map<string, T>>;
  async getAll(returnArray?: true): Promise<T[]>;
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

  /** Get all documents from a table that match a filter */
  async findMany(
    filter: Record<string, unknown> | ((value: T) => boolean),
    returnArray?: false,
  ): Promise<Map<string, T>>;
  async findMany(
    filter: Record<string, unknown> | ((value: T) => boolean),
    returnArray?: true,
  ): Promise<T[]>;
  async findMany(
    filter: Record<string, unknown> | ((value: T) => boolean),
    returnArray = false,
  ) {
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
        if (json) {
          if (typeof filter === "function") {
            if (filter(json)) data.set(name, json);
          } else {
            const invalid = Object.keys(filter).find((key) =>
              (json as Record<string, unknown>)[key] !== filter[key]
            );
            if (!invalid) data.set(name, json);
          }
        }
      } catch (error) {
        this.sabr.error(
          `[Sabr Error: findMany]: Unable to read file ${this.sabr.directoryPath}${this.name}/${file.name}`,
          error,
        );
      }
    }

    return returnArray ? [...data.values()] : data;
  }

  /** Gets the first document from a table that match a filter */
  async findOne(filter: Record<string, unknown> | ((value: T) => boolean)) {
    for await (
      const file of Deno.readDir(
        Deno.realPathSync(`${this.sabr.directoryPath}${this.name}`),
      )
    ) {
      if (!file.name || !file.isFile) continue;

      try {
        // Substring remove the file type `.json` from file.name
        const name = file.name.substring(0, file.name.lastIndexOf("."));
        const json = await this.get(name);
        if (json) {
          if (typeof filter === "function") {
            if (filter(json)) return json;
          } else {
            const invalid = Object.keys(filter).find((key) =>
              (json as Record<string, unknown>)[key] !== filter[key]
            );
            if (!invalid) return json;
          }
        }
      } catch (error) {
        this.sabr.error(
          `[Sabr Error: findOne]: Unable to read file ${this.sabr.directoryPath}${this.name}/${file.name}`,
          error,
        );
      }
    }
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
  create(id: string, data: Partial<T> = {}) {
    if (this.has(id)) {
      this.sabr.error(
        `[Sabr Error: create] Cannot create already existing file file://${this.sabr.directoryPath}${this.name}/${id}.json`,
      );
    }

    const encoded = encoder.encode(JSON.stringify({ id, ...data }));
    return Deno.writeFileSync(
      `${this.sabr.directoryPath}${this.name}/${id}.json`,
      encoded,
    );
  }

  /** Updates a documents data. If this document does not exist, it will create the document. */
  async update(id: string, data: Partial<T> = {}) {
    const existing = await this.get(id) || {};
    return this.create(id, existing ? { ...existing, ...data } : data);
  }

  /** Gets the first document from a table that match a filter */
  async updateOne(
    filter: Partial<T> | ((value: T) => boolean),
    data: Partial<T>,
  ) {
    for await (
      const file of Deno.readDir(
        Deno.realPathSync(`${this.sabr.directoryPath}${this.name}`),
      )
    ) {
      if (!file.name || !file.isFile) continue;

      try {
        // Substring remove the file type `.json` from file.name
        const name = file.name.substring(0, file.name.lastIndexOf("."));
        const json = await this.get(name);
        if (json) {
          if (typeof filter === "function") {
            if (filter(json)) return this.update(name, data);
          } else {
            const invalid = Object.keys(filter).find((key) =>
            // deno-lint-ignore no-explicit-any
              (json as Record<string, unknown>)[key] !== (filter as any)[key]
            );
            if (!invalid) return this.update(name, data);
          }
        }
      } catch (error) {
        this.sabr.error(
          `[Sabr Error: updateOne]: Unable to read file ${this.sabr.directoryPath}${this.name}/${file.name}`,
          error,
        );
      }
    }
  }

  /** Deletes a document from the table. */
  delete(id: string) {
    Deno.removeSync(`${this.sabr.directoryPath}${this.name}/${id}.json`);
  }

  /** Deletes one document in a table that match a filter */
  async deleteOne(filter: Partial<T> | ((value: T) => boolean)) {
    const files = Deno.readDirSync(
      Deno.realPathSync(`${this.sabr.directoryPath}${this.name}`),
    );

    for (const file of files) {
      if (!file.name || !file.isFile) continue;

      try {
        // Substring remove the file type `.json` from file.name
        const name = file.name.substring(0, file.name.lastIndexOf("."));
        const json = await this.get(name);
        if (json) {
          if (typeof filter === "function") {
            return this.delete(name);
          } else {
            const invalid = Object.keys(filter).find((key) =>
            // deno-lint-ignore no-explicit-any
            (json as Record<string, unknown>)[key] !== (filter as any)[key]
            );
            if (!invalid) return this.delete(name);
          }
        }
      } catch (error) {
        this.sabr.error(
          `[Sabr Error: deleteMany]: Unable to read file ${this.sabr.directoryPath}${this.name}/${file.name}`,
          error,
        );
      }
    }
  }

  /** Deletes all documents in a table that match a filter */
  async deleteMany(filter: Partial<T> | ((value: T) => boolean)) {
    const files = Deno.readDirSync(
      Deno.realPathSync(`${this.sabr.directoryPath}${this.name}`),
    );

    for (const file of files) {
      if (!file.name || !file.isFile) continue;

      try {
        // Substring remove the file type `.json` from file.name
        const name = file.name.substring(0, file.name.lastIndexOf("."));
        const json = await this.get(name);
        if (json) {
          if (typeof filter === "function") {
            this.delete(name);
          } else {
            const invalid = Object.keys(filter).find((key) =>
            // deno-lint-ignore no-explicit-any
              (json as Record<string, unknown>)[key] !== (filter as any)[key]
            );
            if (!invalid) this.delete(name);
          }
        }
      } catch (error) {
        this.sabr.error(
          `[Sabr Error: deleteMany]: Unable to read file ${this.sabr.directoryPath}${this.name}/${file.name}`,
          error,
        );
      }
    }
  }
}
