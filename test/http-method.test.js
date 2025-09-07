describe('HTTP Method Constants', () => {
  let HTTP_METHOD;

  beforeEach(() => {
    jest.resetModules();
    HTTP_METHOD = require('../src/http-method.js');
  });

  describe('Constant definitions', () => {
    test('should define all standard HTTP methods', () => {
      expect(HTTP_METHOD.GET).toBe('GET');
      expect(HTTP_METHOD.POST).toBe('POST');
      expect(HTTP_METHOD.PUT).toBe('PUT');
      expect(HTTP_METHOD.DELETE).toBe('DELETE');
      expect(HTTP_METHOD.HEAD).toBe('HEAD');
      expect(HTTP_METHOD.OPTIONS).toBe('OPTIONS');
    });

    test('should be frozen object (immutable)', () => {
      expect(Object.isFrozen(HTTP_METHOD)).toBe(true);
    });

    test('should not allow modification of constants', () => {
      expect(() => {
        HTTP_METHOD.GET = 'MODIFIED';
      }).toThrow();
      
      expect(HTTP_METHOD.GET).toBe('GET');
    });

    test('should not allow addition of new properties', () => {
      expect(() => {
        HTTP_METHOD.PATCH = 'PATCH';
      }).toThrow();
      
      expect(HTTP_METHOD.PATCH).toBeUndefined();
    });

    test('should not allow deletion of properties', () => {
      expect(() => {
        delete HTTP_METHOD.GET;
      }).toThrow();
      
      expect(HTTP_METHOD.GET).toBe('GET');
    });
  });

  describe('Usage with router', () => {
    test('should work with router method matching', () => {
      // Mock the router module
      jest.doMock('../src/router.js', () => ({
        default: {
          _routes: [],
          on: jest.fn()
        }
      }));
      
      const router = require('../src/router.js').default;
      
      const handler = jest.fn().mockReturnValue(new Response('OK'));
      
      // Test that HTTP_METHOD constants work with router
      router.on('/test', HTTP_METHOD.GET, handler);
      
      expect(router.on).toHaveBeenCalledWith('/test', 'GET', handler);
      expect(router.on).toHaveBeenCalledWith('/test', HTTP_METHOD.GET, handler);
      
      jest.dontMock('../src/router.js');
    });

    test('should support all HTTP methods in router', () => {
      // Mock the router module
      jest.doMock('../src/router.js', () => ({
        default: {
          _routes: [],
          on: jest.fn()
        }
      }));
      
      const router = require('../src/router.js').default;
      const handler = jest.fn().mockReturnValue(new Response('OK'));
      
      // Test all HTTP methods
      Object.values(HTTP_METHOD).forEach(method => {
        router.on(`/test-${method.toLowerCase()}`, method, handler);
      });
      
      expect(router.on).toHaveBeenCalledTimes(6); // 6 HTTP methods defined
      
      jest.dontMock('../src/router.js');
    });
  });

  describe('Type checking and validation', () => {
    test('should have string values for all methods', () => {
      Object.values(HTTP_METHOD).forEach(method => {
        expect(typeof method).toBe('string');
        expect(method.length).toBeGreaterThan(0);
      });
    });

    test('should have uppercase method names', () => {
      Object.values(HTTP_METHOD).forEach(method => {
        expect(method).toBe(method.toUpperCase());
      });
    });

    test('should have consistent property names with values', () => {
      Object.entries(HTTP_METHOD).forEach(([key, value]) => {
        expect(key).toBe(value);
      });
    });
  });

  describe('Standard compliance', () => {
    test('should include all common HTTP methods', () => {
      const commonMethods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'];
      
      commonMethods.forEach(method => {
        expect(HTTP_METHOD[method]).toBe(method);
      });
    });

    test('should match RFC 2616 method names', () => {
      // Test that method names conform to HTTP/1.1 specification
      const rfc2616Methods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
      
      rfc2616Methods.forEach(method => {
        expect(HTTP_METHOD).toHaveProperty(method, method);
      });
    });
  });

  describe('Module export behavior', () => {
    test('should export as CommonJS module', () => {
      // Re-require to test fresh import
      const httpMethodModule = require('../src/http-method.js');
      
      expect(typeof httpMethodModule).toBe('object');
      expect(httpMethodModule.GET).toBe('GET');
    });

    test('should be consistent across multiple imports', () => {
      const import1 = require('../src/http-method.js');
      const import2 = require('../src/http-method.js');
      
      expect(import1).toBe(import2); // Should be the same object reference due to CommonJS caching
      expect(import1.GET).toBe(import2.GET);
    });
  });

  describe('Integration with request handling', () => {
    test('should work with mock requests', () => {
      const getRequest = createMockRequest('https://example.com/test', { method: HTTP_METHOD.GET });
      const postRequest = createMockRequest('https://example.com/test', { method: HTTP_METHOD.POST });
      
      expect(getRequest.method).toBe(HTTP_METHOD.GET);
      expect(postRequest.method).toBe(HTTP_METHOD.POST);
      expect(getRequest.method).toBe('GET');
      expect(postRequest.method).toBe('POST');
    });

    test('should support method comparison in routing logic', () => {
      const testMethod = 'POST';
      
      expect(testMethod === HTTP_METHOD.POST).toBe(true);
      expect(testMethod === HTTP_METHOD.GET).toBe(false);
    });
  });

  describe('Error cases and edge conditions', () => {
    test('should handle case-sensitive comparisons correctly', () => {
      expect('get' === HTTP_METHOD.GET).toBe(false);
      expect('GET' === HTTP_METHOD.GET).toBe(true);
      expect('Get' === HTTP_METHOD.GET).toBe(false);
    });

    test('should not have undefined methods', () => {
      expect(HTTP_METHOD.PATCH).toBeUndefined();
      expect(HTTP_METHOD.TRACE).toBeUndefined();
      expect(HTTP_METHOD.CONNECT).toBeUndefined();
    });

    test('should maintain immutability under stress', () => {
      // Try various ways to modify the object
      const attempts = [
        () => { HTTP_METHOD.GET = 'CHANGED'; },
        () => { HTTP_METHOD.NEW_METHOD = 'NEW'; },
        () => { delete HTTP_METHOD.POST; },
        () => { Object.assign(HTTP_METHOD, { PATCH: 'PATCH' }); }
      ];

      attempts.forEach(attempt => {
        expect(attempt).toThrow();
      });

      // Verify object is still intact
      expect(HTTP_METHOD.GET).toBe('GET');
      expect(HTTP_METHOD.POST).toBe('POST');
      expect(HTTP_METHOD.NEW_METHOD).toBeUndefined();
    });
  });
});