// Setup file for Jest tests
// Mock Cloudflare Worker globals

// Mock the global fetch function
global.fetch = jest.fn();

// Mock Request class
global.Request = class Request {
  constructor(input, init = {}) {
    if (typeof input === 'string') {
      this.url = input;
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers || {});
      this.body = init.body || null;
    } else {
      // Clone constructor
      this.url = input.url;
      this.method = input.method;
      this.headers = new Headers(input.headers);
      this.body = init.body !== undefined ? init.body : input.body;
    }
  }

  async formData() {
    if (this.body && this.body.entries) {
      return this.body;
    }
    return new FormData();
  }

  clone() {
    return new Request(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body
    });
  }
};

// Mock Response class
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Headers(init.headers || {});
  }

  async text() {
    return String(this.body);
  }

  async json() {
    return JSON.parse(this.body);
  }
};

// Mock Headers class
global.Headers = class Headers {
  constructor(init = {}) {
    this.map = new Map();
    if (init) {
      if (init instanceof Headers) {
        init.map.forEach((value, key) => {
          this.map.set(key.toLowerCase(), value);
        });
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => {
          this.map.set(key.toLowerCase(), String(value));
        });
      }
    }
  }

  get(name) {
    return this.map.get(name.toLowerCase()) || null;
  }

  set(name, value) {
    this.map.set(name.toLowerCase(), String(value));
  }

  has(name) {
    return this.map.has(name.toLowerCase());
  }

  delete(name) {
    this.map.delete(name.toLowerCase());
  }

  forEach(callback) {
    this.map.forEach(callback);
  }

  entries() {
    return this.map.entries();
  }

  keys() {
    return this.map.keys();
  }

  values() {
    return this.map.values();
  }
};

// Mock FormData class
global.FormData = class FormData {
  constructor() {
    this.data = new Map();
  }

  append(name, value) {
    if (this.data.has(name)) {
      const existing = this.data.get(name);
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        this.data.set(name, [existing, value]);
      }
    } else {
      this.data.set(name, value);
    }
  }

  get(name) {
    const value = this.data.get(name);
    return Array.isArray(value) ? value[0] : value;
  }

  getAll(name) {
    const value = this.data.get(name);
    return Array.isArray(value) ? value : [value];
  }

  has(name) {
    return this.data.has(name);
  }

  entries() {
    const entries = [];
    this.data.forEach((value, key) => {
      if (Array.isArray(value)) {
        value.forEach(v => entries.push([key, v]));
      } else {
        entries.push([key, value]);
      }
    });
    return entries[Symbol.iterator]();
  }
};

// Mock URL and URLSearchParams
global.URL = class URL {
  constructor(url, base) {
    const fullUrl = base ? new URL(url, base).href : url;
    const parser = new RegExp('^(https?:)//([^/]+)(/[^?]*)(\\?[^#]*)?(#.*)?$');
    const match = fullUrl.match(parser);
    
    if (!match) {
      throw new Error('Invalid URL');
    }
    
    this.protocol = match[1] || 'https:';
    this.host = match[2] || 'example.com';
    this.pathname = match[3] || '/';
    this.search = match[4] || '';
    this.hash = match[5] || '';
    this.href = fullUrl;
  }
};

global.URLSearchParams = class URLSearchParams {
  constructor(init = '') {
    this.params = new Map();
    
    if (typeof init === 'string') {
      const search = init.startsWith('?') ? init.slice(1) : init;
      if (search) {
        search.split('&').forEach(pair => {
          const [key, value = ''] = pair.split('=');
          this.params.set(decodeURIComponent(key), decodeURIComponent(value));
        });
      }
    }
  }

  get(key) {
    return this.params.get(key) || null;
  }

  set(key, value) {
    this.params.set(key, String(value));
  }

  has(key) {
    return this.params.has(key);
  }

  keys() {
    return this.params.keys();
  }

  values() {
    return this.params.values();
  }

  entries() {
    return this.params.entries();
  }
};

// Mock global LAST_MODIFIED for helpers
global.LAST_MODIFIED = new Date().toISOString();

// Helper function to create mock requests
global.createMockRequest = (url, options = {}) => {
  return new Request(url, {
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body || null
  });
};

// Helper function to create mock form data
global.createMockFormData = (data = {}) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};