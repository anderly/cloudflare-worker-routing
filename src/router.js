const HTTP_METHOD = require('./http-method');
require('./helpers')();

class Router {

    constructor() {

        this.PARAMETER_REGEXP = /([:*])(\w+)/g;
        this.WILDCARD_REGEXP = /\*/g;
        this.REPLACE_VARIABLE_REGEXP = '([^\/]+)';
        this.REPLACE_WILDCARD = '(?:.*)';
        this.FOLLOWED_BY_SLASH_REGEXP = '(?:\/$|$)';
        this.MATCH_REGEXP_FLAGS = '';

        this.name = name; // this is public
        this._routes = [];
        this._defaultHandler = null;

        this._qsToObj = (url) => {
            let _url = new URL(url);
            let _params = new URLSearchParams(_url.search);
            let query = Array.from(_params.keys()).reduce((sum, value) => {
                return Object.assign({ [value]: _params.get(value) }, sum);
            }, {});
            return query;
        };

        this._formDataToObj = (formData) => {
            var o = {};
            for (var pair of formData.entries()) {
                o[pair[0]] = pair[1];
            }
            return o;
        };

        this._clean = (s) => {
            if (s instanceof RegExp) return s;
            return s.replace(/\/+$/, '').replace(/^\/+/, '^/');
        };

        this._extractRouteParameters = (match, names) => {
            if (names.length === 0) return null;
            if (!match) return null;
            return match
                .slice(1, match.length)
                .reduce((params, value, index) => {
                    if (params === null) params = {};
                    params[names[index]] = decodeURIComponent(value);
                    return params;
                }, null);
        };

        this._replaceDynamicURLParts = (route) => {
            var paramNames = [], regexp;

            if (route instanceof RegExp) {
                regexp = route;
            } else {
                regexp = new RegExp(
                    route.replace(this.PARAMETER_REGEXP, function (full, dots, name) {
                        paramNames.push(name);
                        return this.REPLACE_VARIABLE_REGEXP;
                    }).replace(this.WILDCARD_REGEXP, this.REPLACE_WILDCARD) + this.FOLLOWED_BY_SLASH_REGEXP, this.MATCH_REGEXP_FLAGS);
            }
            return { regexp, paramNames };
        };

        this._getUrlDepth = (url) => {
            return url.replace(/\/$/, '').split('/').length;
        };

        this._compareUrlDepth = (urlA, urlB) => {
            return this._getUrlDepth(urlB) - this._getUrlDepth(urlA);
        };

        this._matchRoutes = (request, form, routes = []) => {
            let requestUrl = new URL(request.url);

            return routes
                .map(route => {
                    var { regexp, paramNames } = this._replaceDynamicURLParts(this._clean(route.route));
                    var match = requestUrl.pathname.replace(/^\/+/, '/').match(regexp);

                    if (match && route.method !== request.method) {
                        match = false;
                    }

                    var params = this._extractRouteParameters(match, paramNames);

                    params = Object.assign({}, params, this._qsToObj(request.url));
                    var body = null;

                    const contentType = request.headers.get('content-type');
                    if (request.method === HTTP_METHOD.POST && contentType === 'application/x-www-form-urlencoded') {
                        body = form ? this._formDataToObj(form) : form;
                    }

                    return match ? { match, url: request.url, request, route, params, body, query: params } : false;
                })
                .filter(m => m);
        };

        this._match = (request, formData) => {
            return this._matchRoutes(request, formData, this._routes)[0] || false;
        };

        this._add = (route, method = HTTP_METHOD.GET, handler = null, hooks = null) => {
            if (typeof route === 'string') {
                route = encodeURI(route);
            }
            this._routes.push(
                typeof handler === 'object' ? {
                    route,
                    method: method,
                    handler: handler.uses,
                    name: handler.as,
                    hooks: hooks || handler.hooks
                } : { route, method, handler, hooks: hooks }
            );

            return _add;
        };

    } //end constructor

    /**
     * GET request
     * @param {*} args
     */
    get(...args) {
        if (args.length >= 2) {
            if (args[0] === '/') {
                let func = args[1];

                if (typeof args[1] === 'object') {
                    func = args[1].uses;
                }

                this._defaultHandler = { handler: func, hooks: args[2] };
            } else {
                this._add(args[0], HTTP_METHOD.GET, args[1], args[2]);
            }
        } else if (typeof args[0] === 'object') {
            let orderedRoutes = Object.keys(args[0]).sort(this._compareUrlDepth);

            orderedRoutes.forEach(route => {
                this.on(route, args[0][route]);
            });
        }
        return this;

    } //end get

    /**
     * POST request
     * @param {*} args
     */
    post(...args) {
        if (args.length >= 2) {
            if (args[0] === '/') {
                let func = args[1];

                if (typeof args[1] === 'object') {
                    func = args[1].uses;
                }

                this._defaultHandler = { handler: func, hooks: args[2] };
            } else {
                this._add(args[0], HTTP_METHOD.POST, args[1], args[2]);
            }
        } else if (typeof args[0] === 'object') {
            let orderedRoutes = Object.keys(args[0]).sort(compareUrlDepth);

            orderedRoutes.forEach(route => {
                this.on(route, args[0][route]);
            });
        }
        return this;

    } //end post

    /**
     * PUT request
     * @param {*} args
     */
    put(...args) {
        if (args.length >= 2) {
            if (args[0] === '/') {
                let func = args[1];

                if (typeof args[1] === 'object') {
                    func = args[1].uses;
                }

                this._defaultHandler = { handler: func, hooks: args[2] };
            } else {
                this._add(args[0], HTTP_METHOD.PUT, args[1], args[2]);
            }
        } else if (typeof args[0] === 'object') {
            let orderedRoutes = Object.keys(args[0]).sort(compareUrlDepth);

            orderedRoutes.forEach(route => {
                this.on(route, args[0][route]);
            });
        }
        return this;

    } //end put

    /**
     * DELETE request
     * @param {*} args
     */
    delete(...args) {
        if (args.length >= 2) {
            if (args[0] === '/') {
                let func = args[1];

                if (typeof args[1] === 'object') {
                    func = args[1].uses;
                }

                this._defaultHandler = { handler: func, hooks: args[2] };
            } else {
                this._add(args[0], HTTP_METHOD.DELETE, args[1], args[2]);
            }
        } else if (typeof args[0] === 'object') {
            let orderedRoutes = Object.keys(args[0]).sort(compareUrlDepth);

            orderedRoutes.forEach(route => {
                this._on(route, args[0][route]);
            });
        }
        return this;

    } //end delete

    /**
     * General route
     * @param {*} args
     */
    on(...args) {
        if (typeof args[0] === 'function') {
            _defaultHandler = { handler: args[0], hooks: args[1] };
        } else if (args.length >= 2) {
            if (args[0] === '/') {
                let func = args[1];

                if (typeof args[1] === 'object') {
                    func = args[1].uses;
                }

                this._defaultHandler = { handler: func, hooks: args[2] };
            } else {
                this._add(args[0], args[1], args[2], args[3]);
            }
        } else if (typeof args[0] === 'object') {
            let orderedRoutes = Object.keys(args[0]).sort(compareUrlDepth);

            orderedRoutes.forEach(route => {
                this._on(route, args[0][route]);
            });
        }
        return this;

    } //end on

    /**
     * Register a default not found handler
     * @param {*} defaultHandler
     */
    else(defaultHandler) {
        this._defaultHandler = defaultHandler;
    }

    /**
     * Route the request
     * @param {*} request
     */
    async route(request) {

        return new Promise(async (resolve, reject) => {
            try {
                var handler, m;

                let formData = null;
                const contentType = request.headers.get('content-type');
                if (request.method === HTTP_METHOD.POST && contentType === 'application/x-www-form-urlencoded') {
                    formData = await request.formData();
                }

                m = this._match(request, formData);

                if (m) {
                    handler = m.route.handler;

                    resolve(handler(m));
                }
                // Pass-through as no match
                resolve(fetch(request));
                // Or, return a 404
                //let url = new URL(request.url);
                //resolve(_defaultHandler || response(`No matching round found for url: ${url.pathname}`, 404, 'Not Found', {}));
            } catch (ex) {
                reject(ex);
            }
        });

    } //end route

} //end Class Router

export default new Router();
