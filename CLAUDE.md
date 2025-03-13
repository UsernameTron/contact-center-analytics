# Contact Center Analytics Project Guidelines

## Commands
- Run data generators: `python agent-metrics-generator.py` or `python technology-metrics-generator.py`
- Run interaction generator: `python interaction-generator.py`
- Dashboard setup: `cd dashboard && npm install && npm start`
- Validate data schema: `python -m json.tool data_output.json > /dev/null`
- Run ETL pipeline: `python etl-pipeline.txt`

## Code Style

### Python
- Imports: Standard library first, third-party second
- Variable naming: snake_case for variables/functions, CAPS for constants
- Documentation: Docstrings with Args/Returns sections
- Error handling: Use try/except with specific error types
- Set random seeds for reproducibility in data generation

### JavaScript/TypeScript
- React components: Functional with hooks
- Naming: camelCase variables, PascalCase components
- TypeScript: Use interfaces for props and data structures
- Error handling: try/catch with fallbacks
- Component structure: props → state → effects → render

### Data Processing
- Validate inputs before processing
- Include error states in UIs
- Cache processed data where appropriate
- Document data transformations clearly