# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
## Database: Vector search with MongoDB (setup)

This project includes helper scripts and examples to store user embeddings and run vector (k-NN) searches using MongoDB Atlas Search.

- **Files added**:
  - `src/db/mongo.mjs`: connection helper (reads `MONGODB_URI` and `MONGODB_DB` from `.env`).
  - `scripts/seed-db.mjs`: seeds example users with mock normalized embeddings and prints a sample Atlas Search index JSON.
  - `src/db/findSimilarUsers.mjs`: example query that runs an Atlas Search k-NN aggregation to find top-K similar users.

### Quick start

1. Create an Atlas cluster (or use an existing MongoDB). For vector search you should use MongoDB Atlas with Search/Vector support.
2. Create a `.env` file in the project root with at least:

```
MONGODB_URI=<your mongodb connection string>
MONGODB_DB=parallels
EMBEDDING_DIM=1536
```

3. Install the runtime deps if you plan to run scripts (the project uses `optionalDependencies` for `mongodb` and `dotenv`).

```
npm install
```

4. Seed the database (this will insert sample users with mock embeddings):

```
node scripts/seed-db.mjs
```

5. Create an Atlas Search index for vector search (Atlas UI → Search → Create Search Index). Use the following sample mapping JSON and set `dimensions` to match `EMBEDDING_DIM`:

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "embedding": {
        "type": "knnVector",
        "dimensions": 1536
      }
    }
  }
}
```

6. Run the example k-NN query. You can either pass a `--userId` (to find neighbors around an existing user) or `--vector` with a comma-separated vector.

```
node src/db/findSimilarUsers.mjs --userId <someObjectId> --k 5
node src/db/findSimilarUsers.mjs --vector "0.1,0.2,0.3,..." --k 5
```

Notes:
- The example scripts seed mock (random) embeddings. Replace with real embeddings from your embedding model (OpenAI, etc.) and ensure vectors are the same dimension and normalization strategy you choose.
- The aggregation uses the Atlas Search `knnBeta` operator; this requires an Atlas Search index configured as shown above. If you run a local MongoDB without Atlas Search, the `$search` stage will fail.
