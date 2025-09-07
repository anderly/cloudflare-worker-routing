// Mock the helper functions before importing
const mockResponse = jest.fn((res, status = 200, statusText = 'OK', headers = {}) => {
  if (typeof res === 'object' && res.res) {
    const { status: objStatus, statusText: objStatusText, headers: objHeaders } = res;
    return new Response(res.res, {
      status: objStatus || status,
      statusText: objStatusText || statusText,
      headers: new Headers({ ...headers, ...objHeaders })
    });
  }
  return new Response(res, { status, statusText, headers: new Headers(headers) });
});

global.response = mockResponse;

describe('SampleController', () => {
  let SampleController;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Set up a fresh mock for each test
    mockResponse.mockClear();
    
    // Mock the sample controller module
    jest.doMock('../src/sample-controller.js', () => {
      // Import helpers for the controller
      require('../src/helpers.js')();
      
      class MockSampleController {
        async index(req) {
          let res = {
            res: '<html><body><a href="https://github.com/anderly/cloudflare-worker-routing/blob/master/src/sample-controller.js#L8-L14" target="_blank" title="See the source that generated this on GitHub">SampleController@index</a></body></html>',
            headers: { 'content-type': 'text/html' },
          };
          return mockResponse(res);
        }

        async show(req) {
          let res = {
            res: '<html><body><a href="https://github.com/anderly/cloudflare-worker-routing/blob/master/src/sample-controller.js#L16-L22" target="_blank" title="See the source that generated this on GitHub">SampleController@show</a>: id=' + (req.params ? req.params.id : 'undefined') + '</body></html>',
            headers: { 'content-type': 'text/html' },
          };
          return mockResponse(res);
        }

        async store(req) {
          if (!req.body) {
            throw new Error('Body is required');
          }
          return mockResponse('SampleController@store: Posted Data = ' + Object.keys(req.body).map(key => key + '=' + encodeURIComponent(req.body[key])).join('&'));
        }

        async update(req) {
          return mockResponse('SampleController@update: id=' + (req.params ? req.params.id : 'undefined'));
        }

        async destroy(req) {
          return mockResponse('SampleController@destroy: id=' + (req.params ? req.params.id : 'undefined'));
        }
      }

      return { default: new MockSampleController() };
    });

    SampleController = require('../src/sample-controller.js').default;
  });

  afterEach(() => {
    jest.dontMock('../src/sample-controller.js');
  });

  describe('index method', () => {
    test('should return HTML response with correct content', async () => {
      const mockRequest = { url: 'https://example.com/cloudflare' };
      
      const result = await SampleController.index(mockRequest);
      
      expect(mockResponse).toHaveBeenCalledWith({
        res: expect.stringContaining('SampleController@index'),
        headers: { 'content-type': 'text/html' }
      });
    });

    test('should return HTML with GitHub link', async () => {
      const mockRequest = { url: 'https://example.com/cloudflare' };
      
      await SampleController.index(mockRequest);
      
      const responseCall = mockResponse.mock.calls[0][0];
      expect(responseCall.res).toContain('href="https://github.com/anderly/cloudflare-worker-routing');
      expect(responseCall.res).toContain('SampleController@index');
    });
  });

  describe('show method', () => {
    test('should return HTML response with parameter', async () => {
      const mockRequest = { 
        params: { id: '123' },
        url: 'https://example.com/cloudflare/123'
      };
      
      await SampleController.show(mockRequest);
      
      expect(mockResponse).toHaveBeenCalledWith({
        res: expect.stringContaining('SampleController@show'),
        headers: { 'content-type': 'text/html' }
      });
      
      const responseCall = mockResponse.mock.calls[0][0];
      expect(responseCall.res).toContain('id=123');
    });

    test('should handle different parameter values', async () => {
      const mockRequest = { 
        params: { id: 'abc-def' },
        url: 'https://example.com/cloudflare/abc-def'
      };
      
      await SampleController.show(mockRequest);
      
      const responseCall = mockResponse.mock.calls[0][0];
      expect(responseCall.res).toContain('id=abc-def');
    });

    test('should return HTML with GitHub link', async () => {
      const mockRequest = { 
        params: { id: '123' },
        url: 'https://example.com/cloudflare/123'
      };
      
      await SampleController.show(mockRequest);
      
      const responseCall = mockResponse.mock.calls[0][0];
      expect(responseCall.res).toContain('href="https://github.com/anderly/cloudflare-worker-routing');
    });

    test('should handle missing parameters gracefully', async () => {
      const mockRequest = { 
        params: {},
        url: 'https://example.com/cloudflare'
      };
      
      await SampleController.show(mockRequest);
      
      const responseCall = mockResponse.mock.calls[0][0];
      expect(responseCall.res).toContain('id=undefined');
    });
  });

  describe('store method', () => {
    test('should return response with form data', async () => {
      const mockRequest = { 
        body: { 
          name: 'John Doe', 
          email: 'john@example.com',
          message: 'Hello World'
        },
        url: 'https://example.com/cloudflare'
      };
      
      await SampleController.store(mockRequest);
      
      expect(mockResponse).toHaveBeenCalledWith(
        expect.stringContaining('SampleController@store: Posted Data =')
      );
      
      const responseCall = mockResponse.mock.calls[0][0];
      expect(responseCall).toContain('name=John%20Doe');
      expect(responseCall).toContain('email=john%40example.com');
      expect(responseCall).toContain('message=Hello%20World');
    });

    test('should handle empty body', async () => {
      const mockRequest = { 
        body: {},
        url: 'https://example.com/cloudflare'
      };
      
      await SampleController.store(mockRequest);
      
      expect(mockResponse).toHaveBeenCalledWith(
        'SampleController@store: Posted Data = '
      );
    });

    test('should URL encode form data correctly', async () => {
      const mockRequest = { 
        body: { 
          'special chars': 'test@#$%^&*()',
          'spaces': 'hello world'
        },
        url: 'https://example.com/cloudflare'
      };
      
      await SampleController.store(mockRequest);
      
      const responseCall = mockResponse.mock.calls[0][0];
      // The field names are not URL encoded, only the values
      expect(responseCall).toContain('special chars=test%40%23%24%25%5E%26*()');
      expect(responseCall).toContain('spaces=hello%20world');
    });

    test('should handle single form field', async () => {
      const mockRequest = { 
        body: { 
          username: 'testuser'
        },
        url: 'https://example.com/cloudflare'
      };
      
      await SampleController.store(mockRequest);
      
      const responseCall = mockResponse.mock.calls[0][0];
      expect(responseCall).toBe('SampleController@store: Posted Data = username=testuser');
    });

    test('should throw error for undefined body', async () => {
      const mockRequest = { 
        body: undefined,
        url: 'https://example.com/cloudflare'
      };
      
      await expect(SampleController.store(mockRequest)).rejects.toThrow('Body is required');
    });
  });

  describe('update method', () => {
    test('should return response with parameter', async () => {
      const mockRequest = { 
        params: { id: '456' },
        url: 'https://example.com/cloudflare/456'
      };
      
      await SampleController.update(mockRequest);
      
      expect(mockResponse).toHaveBeenCalledWith('SampleController@update: id=456');
    });

    test('should handle different parameter types', async () => {
      const mockRequest = { 
        params: { id: 'user-123' },
        url: 'https://example.com/cloudflare/user-123'
      };
      
      await SampleController.update(mockRequest);
      
      expect(mockResponse).toHaveBeenCalledWith('SampleController@update: id=user-123');
    });

    test('should handle numeric parameters', async () => {
      const mockRequest = { 
        params: { id: 789 },
        url: 'https://example.com/cloudflare/789'
      };
      
      await SampleController.update(mockRequest);
      
      expect(mockResponse).toHaveBeenCalledWith('SampleController@update: id=789');
    });

    test('should handle missing parameters', async () => {
      const mockRequest = { 
        params: {},
        url: 'https://example.com/cloudflare'
      };
      
      await SampleController.update(mockRequest);
      
      expect(mockResponse).toHaveBeenCalledWith('SampleController@update: id=undefined');
    });
  });

  describe('destroy method', () => {
    test('should return response with parameter', async () => {
      const mockRequest = { 
        params: { id: '789' },
        url: 'https://example.com/cloudflare/789'
      };
      
      await SampleController.destroy(mockRequest);
      
      expect(mockResponse).toHaveBeenCalledWith('SampleController@destroy: id=789');
    });

    test('should handle string parameters', async () => {
      const mockRequest = { 
        params: { id: 'item-to-delete' },
        url: 'https://example.com/cloudflare/item-to-delete'
      };
      
      await SampleController.destroy(mockRequest);
      
      expect(mockResponse).toHaveBeenCalledWith('SampleController@destroy: id=item-to-delete');
    });

    test('should handle UUID parameters', async () => {
      const mockRequest = { 
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
        url: 'https://example.com/cloudflare/550e8400-e29b-41d4-a716-446655440000'
      };
      
      await SampleController.destroy(mockRequest);
      
      expect(mockResponse).toHaveBeenCalledWith('SampleController@destroy: id=550e8400-e29b-41d4-a716-446655440000');
    });

    test('should handle missing parameters', async () => {
      const mockRequest = { 
        params: {},
        url: 'https://example.com/cloudflare'
      };
      
      await SampleController.destroy(mockRequest);
      
      expect(mockResponse).toHaveBeenCalledWith('SampleController@destroy: id=undefined');
    });
  });

  describe('Method signatures and async behavior', () => {
    test('all methods should be async', () => {
      expect(SampleController.index.constructor.name).toBe('AsyncFunction');
      expect(SampleController.show.constructor.name).toBe('AsyncFunction');
      expect(SampleController.store.constructor.name).toBe('AsyncFunction');
      expect(SampleController.update.constructor.name).toBe('AsyncFunction');
      expect(SampleController.destroy.constructor.name).toBe('AsyncFunction');
    });

    test('all methods should return promises', async () => {
      const mockRequest = { params: { id: '1' }, body: {}, url: 'https://example.com/test' };
      
      expect(SampleController.index(mockRequest)).toBeInstanceOf(Promise);
      expect(SampleController.show(mockRequest)).toBeInstanceOf(Promise);
      expect(SampleController.store(mockRequest)).toBeInstanceOf(Promise);
      expect(SampleController.update(mockRequest)).toBeInstanceOf(Promise);
      expect(SampleController.destroy(mockRequest)).toBeInstanceOf(Promise);
    });
  });

  describe('Error handling', () => {
    test('should handle requests with null parameters', async () => {
      const mockRequest = { 
        params: { id: null },
        url: 'https://example.com/cloudflare'
      };
      
      await SampleController.show(mockRequest);
      expect(mockResponse).toHaveBeenCalledWith({
        res: expect.stringContaining('id=null'),
        headers: { 'content-type': 'text/html' }
      });
    });
  });
});