// import duckdb-wasm
import * as duckdb from "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@latest/+esm";

// declare variable db
let db;

// Initialize DuckDB with custom worker creation
async function initDuckDB() {
  try {
    // receive the bundles of files required to run duckdb in the browser
    // this is the compiled wasm code, the js and worker scripts
    // worker scripts are js scripts ran in background threads (not the same thread as the ui)
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    // select bundle is a function that selects the files that will work with your browser
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    // creates storage and an address for the main worker
    const worker_url = URL.createObjectURL(
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
// Function to process the uploaded file and run queries
async function processFile() {
  try {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files ? fileInput.files[0] : null;

    const queryInput = document.getElementById("queryInput");
    let query = queryInput.value;

    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    console.log("File loaded:", file.name);

    if (!db) {
      console.error("DuckDB-Wasm is not initialized");
      return;
    }

    const conn = await db.connect();
    console.log("Database connection established");

    const fileType = file.name.split(".").pop()?.toLowerCase() || "";

    if (fileType === "csv" || fileType === "parquet" || fileType === "json") {
      // Register the file in DuckDB's virtual file system
      const virtualFileName = `/${file.name}`;
      await db.registerFileBuffer(virtualFileName, new Uint8Array(arrayBuffer));

      let table_ref = "";
      if (fileType === "csv") {
        table_ref = `read_csv_auto('${virtualFileName}', header = true)`;
        //query = `SELECT * FROM read_csv_auto('${virtualFileName}', header = true)`;
      } else if (fileType === "parquet") {
        table_ref = `read_parquet('${virtualFileName}')`;
        //query = `SELECT * FROM read_parquet('${virtualFileName}')`;
      } else if (fileType === "json") {
        table_ref = `read_json_parquet('${virtualFileName}')`;
        //query = `SELECT * FROM read_json_auto('${virtualFileName}')`;
      }

      console.log("incoming query: ", query);
      query = query.replace("myTable", table_ref);
      console.log("modified query: ", query);

      // Execute the query
      //await conn.query(query);
      //console.log("File data loaded into DuckDB");

      // Query the data and display results
      //const result = await conn.query("SELECT * FROM my_table LIMIT 10");
      const result = await conn.query(query);
      const resultSchema = result.schema.fields.map((field) => field.name);
      console.log(
        "query result as arrow table:",
        result.schema.fields.map((field) => field.name)
      );
      const resultList = result.toArray();
      console.log("query result as json:", resultList);

      let resultTable = document.getElementById("resultTable");
      resultTable.innerHTML = "";
      let resultHeaderRow = document.createElement("tr");
      resultTable.appendChild(resultHeaderRow);
      resultSchema.forEach((columnName) => {
        let th = document.createElement("th");
        th.innerText = columnName;
        resultHeaderRow.appendChild(th);
      });

      resultList.forEach((resultItem) => {
        let tr = document.createElement("tr");
        resultTable.appendChild(tr);
        resultSchema.forEach((columnName) => {
          let td = document.createElement("td");
          td.innerText = resultItem[columnName];
          tr.appendChild(td);
        });
      });
    } else {
      alert("Unsupported file format");
    }

    await conn.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error processing file or querying data:", error);
  }
}

// Initialize DuckDB on page load
document.addEventListener("DOMContentLoaded", () => {
  initDuckDB();

  window.processFile = processFile;
});
