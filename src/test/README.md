# Test utilities

## Supabase mocking

`setupSupabaseMock` registers a mock Supabase client and exposes the `fromMock` and `invokeMock` spies. `createQueryResponse` helps create chainable query objects returned from `fromMock`.

```ts
import { setupSupabaseMock, createQueryResponse } from '@/test/mockSupabaseClient';

const { fromMock } = setupSupabaseMock();
fromMock.mockReturnValue(createQueryResponse([]));
```
