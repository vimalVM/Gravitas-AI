/** Minimal in-memory stand-in for the Supabase client, enough for route tests. */
class FakeQuery {
  constructor(rows) {
    this.rows = rows;
    this.filters = [];
    this.max = Infinity;
  }
  select() { return this; }
  order() { return this; }
  limit(n) { this.max = n; return this; }
  eq(column, value) { this.filters.push((row) => row[column] === value); return this; }
  neq(column, value) { this.filters.push((row) => row[column] !== value); return this; }
  lt(column, value) { this.filters.push((row) => row[column] < value); return this; }
  gt(column, value) { this.filters.push((row) => row[column] > value); return this; }
  result() { return this.rows.filter((row) => this.filters.every((f) => f(row))).slice(0, this.max); }
  async maybeSingle() { return { data: this.result()[0] ?? null, error: null }; }
  async single() {
    const [row] = this.result();
    return row ? { data: row, error: null } : { data: null, error: { code: 'PGRST116', message: 'not found' } };
  }
  then(resolve, reject) {
    const rows = this.result();
    return Promise.resolve({ data: rows, count: rows.length, error: null }).then(resolve, reject);
  }
}

export function createFakeSupabase({ users = {}, tables = {}, rpc = {} } = {}) {
  return {
    auth: {
      async getUser(token) {
        const user = users[token];
        return user
          ? { data: { user }, error: null }
          : { data: { user: null }, error: { name: 'AuthApiError', status: 401, message: 'invalid JWT' } };
      },
    },
    from(table) {
      return new FakeQuery(tables[table] ?? []);
    },
    async rpc(name, params) {
      if (!rpc[name]) return { data: null, error: { code: 'PGRST202', message: `missing rpc ${name}` } };
      return { data: rpc[name](params), error: null };
    },
    storage: {
      from() {
        return {
          async createSignedUrls(paths) {
            return { data: paths.map((p) => ({ path: p, signedUrl: `https://signed.test/${p}`, error: null })), error: null };
          },
          async list() { return { data: [], error: null }; },
          async upload() { return { data: {}, error: null }; },
          async remove() { return { data: [], error: null }; },
        };
      },
    },
  };
}
