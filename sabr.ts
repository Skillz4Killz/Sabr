import { fromFileUrl } from "./deps.ts";
import { SabrTable } from "./table.ts";

export class Sabr {
  directoryPath = `${
    fromFileUrl(Deno.mainModule.substring(0, Deno.mainModule.lastIndexOf("/")))
  }/db/`;
  tables = new Map<string, SabrTable<unknown>>();

  /** Initializes the database which makes sure that the folder exists. */
  async init() {
    // Must make the db folder before making the tables themselves
    await Deno.mkdir(this.directoryPath).catch(() => undefined);
    // Make the folders for each table
    for (let table of this.tables) {
      await Deno.mkdir(`${this.directoryPath}/${table[1].name}`).catch(() =>
        undefined
      );
    }

    return this;
  }

  /** This method allows you to customize how to handle errors from Sabr. */
  // deno-lint-ignore no-explicit-any
  async error(...data: any[]) {
    console.error(...data);
  }

  /** Checks if a table exists. */
  hasTable(tableName: string) {
    try {
      Deno.readDirSync(`${this.directoryPath}/${tableName}`);
      return true;
    } catch {
      return false;
    }
  }

  /** Creates a new table. */
  async createTable<T>(tableName: string) {
    try {
      await Deno.mkdir(`${this.directoryPath}/${tableName}`);
      const table = new SabrTable<T>(this, tableName);
      return table;
    } catch {
      // Something went wrong
    }
  }

  /** Deletes a table. */
  deleteTable(tableName: string) {
    Deno.removeSync(`${this.directoryPath}/${tableName}`, { recursive: true });
  }
}
