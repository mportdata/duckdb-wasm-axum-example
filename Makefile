# Define variables for commands and paths
TS_SRC = frontend/app.ts
JS_OUT = static/app.js

# Default target: Transpile TypeScript and run Rust
all: build run

# 
build:
	bun rspack

# Target to run the Rust application
run:
	cargo run

# Clean up the generated JavaScript
clean:
	rm -rf $(JS_OUT)
