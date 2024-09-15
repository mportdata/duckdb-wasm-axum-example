
mod modules;

use axum::{
    routing::get,
    Router
};
use modules::handlers::index;

#[tokio::main]
async fn main() {
    let app = Router::new().route("/", get(index));
    // run our app with hyper, listening globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}


