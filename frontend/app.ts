import * as duckdb from "@duckdb/duckdb-wasm";

let db: duckdb.AsyncDuckDB | null = null;

async function initDuckDB(): Promise<void> {
    try {
        // receive the bundles of files required to run duckdb in the browser
        const JSDELIVR_BUNDLES: duckdb.DuckDBBundles = duckdb.getJsDelivrBundles();

        // select bundle is a function that selects the files that will work with your browser
        const bundle: duckdb.DuckDBBundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

        // creates storage and an address for the main worker
        const worker_url: string = URL.createObjectURL(
            new Blob([`importScripts("${bundle.mainWorker}");`], {
                type: "text/javascript",
            })
        );

        // creates the worker and logger required for an instance of duckdb
        const worker = new Worker(worker_url);
        const logger = new duckdb.ConsoleLogger();
        db = new duckdb.AsyncDuckDB(logger, worker);

        // loads the web assembly module into memory and configures it
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

        // revoke the object url now no longer needed
        URL.revokeObjectURL(worker_url);
        console.log("DuckDB-Wasm initialized successfully.");
    } catch (error) {
        console.error("Error initializing DuckDB-Wasm:", error);
    }
}

// Function to process the uploaded file and run queries
(window as any).processFile = async function processFile(): Promise<void> {
    try {
      const fileInput = document.getElementById("fileInput") as HTMLInputElement;
      const file = fileInput.files ? fileInput.files[0] : null;
  
      if (!file) {
        alert("Please select a file first.");
        return;
      }
  
      const arrayBuffer: ArrayBuffer = await file.arrayBuffer();
      console.log("File loaded:", file.name);
  
      if (!db) {
        console.error("DuckDB-Wasm is not initialized");
        return;
      }
  
      const conn = await db.connect();
      console.log("Database connection established");
  
      const fileType: string = file.name.split(".").pop()?.toLowerCase() || "";
  
      if (fileType === "csv" || fileType === "parquet" || fileType === "json") {
        // Register the file in DuckDB's virtual file system
        const virtualFileName = `/${file.name}`;
        await db.registerFileBuffer(virtualFileName, new Uint8Array(arrayBuffer));
  
        let query = "";
        if (fileType === "csv") {
          query = `CREATE TABLE my_table AS SELECT * FROM read_csv_auto('${virtualFileName}')`;
        } else if (fileType === "parquet") {
          query = `CREATE TABLE my_table AS SELECT * FROM read_parquet('${virtualFileName}')`;
        } else if (fileType === "json") {
          query = `CREATE TABLE my_table AS SELECT * FROM read_json_auto('${virtualFileName}')`;
        }
  
        // Execute the query
        await conn.query(query);
        console.log("File data loaded into DuckDB");
  
        // Query the data and display results
        const result = await conn.query("SELECT * FROM my_table LIMIT 10");
        document.getElementById("results")!.innerText = JSON.stringify(result, null, 2);
      } else {
        alert("Unsupported file format");
      }
  
      await conn.close();
      console.log("Database connection closed");
    } catch (error) {
      console.error("Error processing file or querying data:", error);
    }
  };
  
  // Initialize DuckDB on page load
  document.addEventListener("DOMContentLoaded", () => {
    initDuckDB();
  });
