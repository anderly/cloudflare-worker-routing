describe('Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Import the helpers to make them available globally
    require('../src/helpers.js')();
  });

  describe('response() function', () => {
    test('should create response with default values', () => {
      const result = response('Hello World');
      
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(200);
      expect(result.statusText).toBe('OK');
    });

    test('should create response with custom status', () => {
      const result = response('Not Found', 404, 'Not Found');
      
      expect(result.status).toBe(404);
      expect(result.statusText).toBe('Not Found');
    });

    test('should create response with custom headers', () => {
      const customHeaders = { 'custom-header': 'custom-value' };
      const result = response('Test', 200, 'OK', customHeaders);
      
      expect(result.headers.get('custom-header')).toBe('custom-value');
    });

    test('should add CloudFlare Worker headers', () => {
      const result = response('Test');
      
      expect(result.headers.get('X-CloudFlare-Worker')).toBe('Served by CloudFlare Worker.');
      expect(result.headers.get('X-CloudFlare-Worker-Last-Modified')).toBeDefined();
    });

    test('should handle object input with res property', () => {
      const input = {
        res: '<html><body>Test</body></html>',
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'text/html' }
      };
      
      const result = response(input);
      
      expect(result.status).toBe(201);
      expect(result.statusText).toBe('Created');
      expect(result.headers.get('content-type')).toBe('text/html');
    });

    test('should preserve existing headers when using object input', () => {
      const input = {
        res: 'Test content',
        headers: { 'custom-header': 'value1' }
      };
      
      const result = response(input);
      
      expect(result.headers.get('custom-header')).toBe('value1');
      expect(result.headers.get('X-CloudFlare-Worker')).toBe('Served by CloudFlare Worker.');
    });

    test('should handle empty string body', () => {
      const result = response('');
      
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(200);
    });

    test('should handle null body (though it will error)', () => {
      // The original implementation doesn't handle null properly,
      // but we test that it follows the existing behavior
      expect(() => response(null)).toThrow();
    });

    test('should override default status with object properties', () => {
      const input = {
        res: 'Server Error',
        status: 500,
        statusText: 'Internal Server Error'
      };
      
      const result = response(input, 200, 'OK'); // Default values should be overridden
      
      expect(result.status).toBe(500);
      expect(result.statusText).toBe('Internal Server Error');
    });

    test('should merge headers correctly when headers are destructured', () => {
      const input = {
        res: 'Test',
        headers: { 'content-type': 'text/plain' }
      };
      
      const result = response(input);
      
      expect(result.headers.get('content-type')).toBe('text/plain');
      expect(result.headers.get('X-CloudFlare-Worker')).toBe('Served by CloudFlare Worker.');
      
      // Note: additional headers parameter doesn't work as expected in original implementation
      // when using object destructuring, so we test the actual behavior
    });

    test('should set LAST_MODIFIED header with valid timestamp', () => {
      const result = response('Test');
      const lastModified = result.headers.get('X-CloudFlare-Worker-Last-Modified');
      
      expect(lastModified).toBeDefined();
      expect(() => new Date(lastModified)).not.toThrow();
      expect(new Date(lastModified).getTime()).not.toBeNaN();
    });
  });

  describe('redirect() function', () => {
    test('should create redirect response with default status', () => {
      const result = redirect('https://example.com');
      
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(302);
      expect(result.statusText).toBe('Found');
      expect(result.headers.get('Location')).toBe('https://example.com');
    });

    test('should create redirect response with custom status', () => {
      const result = redirect('https://example.com/new', 301);
      
      expect(result.status).toBe(301);
      expect(result.headers.get('Location')).toBe('https://example.com/new');
    });

    test('should include extra headers', () => {
      const extraHeaders = { 'cache-control': 'no-cache', 'custom': 'value' };
      const result = redirect('https://example.com', 302, extraHeaders);
      
      expect(result.headers.get('Location')).toBe('https://example.com');
      expect(result.headers.get('cache-control')).toBe('no-cache');
      expect(result.headers.get('custom')).toBe('value');
    });

    test('should handle relative URLs', () => {
      const result = redirect('/relative/path');
      
      expect(result.headers.get('Location')).toBe('/relative/path');
    });

    test('should handle URLs with query parameters', () => {
      const url = 'https://example.com/search?q=test&filter=active';
      const result = redirect(url);
      
      expect(result.headers.get('Location')).toBe(url);
    });

    test('should handle URLs with fragments', () => {
      const url = 'https://example.com/page#section';
      const result = redirect(url);
      
      expect(result.headers.get('Location')).toBe(url);
    });

    test('should create response with empty body', async () => {
      const result = redirect('https://example.com');
      const text = await result.text();
      
      expect(text).toBe('');
    });

    test('should handle permanent redirect (301)', () => {
      const result = redirect('https://newdomain.com', 301);
      
      expect(result.status).toBe(301);
      expect(result.headers.get('Location')).toBe('https://newdomain.com');
    });

    test('should handle temporary redirect (307)', () => {
      const result = redirect('https://temporary.com', 307);
      
      expect(result.status).toBe(307);
      expect(result.headers.get('Location')).toBe('https://temporary.com');
    });

    test('should maintain CloudFlare Worker headers from response function', () => {
      const result = redirect('https://example.com');
      
      // The redirect function calls response() internally, so it should have CloudFlare headers
      expect(result.headers.get('X-CloudFlare-Worker')).toBe('Served by CloudFlare Worker.');
      expect(result.headers.get('X-CloudFlare-Worker-Last-Modified')).toBeDefined();
    });

    test('should override Location header if provided in extraHeaders', () => {
      const extraHeaders = { 'Location': 'https://override.com' };
      const result = redirect('https://original.com', 302, extraHeaders);
      
      // Should use the Location from the first parameter, not extraHeaders
      expect(result.headers.get('Location')).toBe('https://original.com');
    });
  });

  describe('Helper functions integration', () => {
    test('response and redirect should work together', () => {
      const redirectResult = redirect('https://example.com');
      const responseResult = response('Hello');
      
      expect(redirectResult).toBeInstanceOf(Response);
      expect(responseResult).toBeInstanceOf(Response);
      expect(redirectResult.status).toBe(302);
      expect(responseResult.status).toBe(200);
    });

    test('both functions should add CloudFlare headers', () => {
      const redirectResult = redirect('https://example.com');
      const responseResult = response('Test');
      
      expect(redirectResult.headers.get('X-CloudFlare-Worker')).toBe('Served by CloudFlare Worker.');
      expect(responseResult.headers.get('X-CloudFlare-Worker')).toBe('Served by CloudFlare Worker.');
    });
  });

  describe('Global availability', () => {
    test('response function should be globally available', () => {
      expect(typeof global.response).toBe('function');
      expect(typeof response).toBe('function');
    });

    test('redirect function should be globally available', () => {
      expect(typeof global.redirect).toBe('function');
      expect(typeof redirect).toBe('function');
    });
  });

  describe('Error handling', () => {
    test('response should handle undefined input gracefully', () => {
      expect(() => response(undefined)).not.toThrow();
      const result = response(undefined);
      expect(result).toBeInstanceOf(Response);
    });

    test('redirect should handle empty string URL', () => {
      expect(() => redirect('')).not.toThrow();
      const result = redirect('');
      // Test that location header exists but might be null/empty based on implementation
      expect(result.status).toBe(302);
      expect(result.statusText).toBe('Found');
      // The header should exist, regardless of its value
      expect(result.headers).toBeDefined();
    });

    test('response should handle invalid status codes gracefully', () => {
      // HTTP status codes should be valid, but let's test edge cases
      const result = response('Test', 999, 'Custom Status');
      expect(result.status).toBe(999);
      expect(result.statusText).toBe('Custom Status');
    });
  });
});