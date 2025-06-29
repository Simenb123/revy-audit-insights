# Testing and Continuous Integration

Unit tests are written with **Vitest** and live under the `src` folder. Run them locally with:

```bash
npm test
```

For browser behaviour there is a **cypress** suite in the `cypress` folder.

A smoke test script (`scripts/smoke-test.js`) checks that the `knowledge-search` function responds. It requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables.

For CI environments you can run `scripts/setup-ci.sh` which installs dependencies and executes the tests. Add this step to your pipeline before building the project.
