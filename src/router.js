const HTTP_METHOD = require('./http-method');
require('./helpers')();

function Router() {

    const PARAMETER_REGEXP = /([:*])(\w+)/g;
    const WILDCARD_REGEXP = /\*/g;
    const REPLACE_VARIABLE_REGEXP = '([^\/]+)';
    const REPLACE_WILDCARD = '(?:.*)';
    const FOLLOWED_BY_SLASH_REGEXP = '(?:\/$|$)';
    const MATCH_REGEXP_FLAGS = '';

    var _routes = [];
    var _defaultHandler = null;

    var qsToObj = function (url) {
        let _url = new URL(url);
        let _params = new URLSearchParams(_url.search);
        let query = Array.from(_params.keys()).reduce((sum, value) => {
            return Object.assign({ [value]: _params.get(value) }, sum);
        }, {});
        return query;
    };

    var formDataToObj = function (formData) {
        var o = {};
        for (var pair of formData.entries()) {
            o[pair[0]] = pair[1];
        }
        return o;
    };

    var clean = function (s) {
        if (s instanceof RegExp) return s;
        return s.replace(/\/+$/, '').replace(/^\/+/, '^/');
    };

    var extractRouteParameters = function (match, names) {
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

    var replaceDynamicURLParts = function (route) {
        var paramNames = [], regexp;

        if (route instanceof RegExp) {
            regexp = route;
        } else {
            regexp = new RegExp(
                route.replace(PARAMETER_REGEXP, function (full, dots, name) {
                    paramNames.push(name);
                    return REPLACE_VARIABLE_REGEXP;
                }).replace(WILDCARD_REGEXP, REPLACE_WILDCARD) + FOLLOWED_BY_SLASH_REGEXP, MATCH_REGEXP_FLAGS);
        }
        return { regexp, paramNames };
    };

    var getUrlDepth = function (url) {
        return url.replace(/\/$/, '').split('/').length;
    };

    var compareUrlDepth = function (urlA, urlB) {
        return getUrlDepth(urlB) - getUrlDepth(urlA);
    };

    var matchRoutes = function (request, form, routes = []) {
        let requestUrl = new URL(request.url);

        return routes
            .map(route => {
                var { regexp, paramNames } = replaceDynamicURLParts(clean(route.route));
                var match = requestUrl.pathname.replace(/^\/+/, '/').match(regexp);

                if (match && route.method !== request.method) {
                    match = false;
                }

                var params = extractRouteParameters(match, paramNames);

                params = Object.assign({}, params, qsToObj(request.url));
                var body = null;

                const contentType = request.headers.get('content-type');
                if (request.method === HTTP_METHOD.POST && contentType === 'application/x-www-form-urlencoded') {
                    body = form ? formDataToObj(form) : form;
                }

                return match ? { match, url: request.url, request, route, params, body, query: params } : false;
            })
            .filter(m => m);
    };

    var _match = function (request, formData) {
        return matchRoutes(request, formData, _routes)[0] || false;
    };

    var _add = function (route, method = HTTP_METHOD.GET, handler = null, hooks = null) {
        if (typeof route === 'string') {
            route = encodeURI(route);
        }
        _routes.push(
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

    var _get = function (...args) {
        if (args.length >= 2) {
            if (args[0] === '/') {
                let func = args[1];

                if (typeof args[1] === 'object') {
                    func = args[1].uses;
                }

                _defaultHandler = { handler: func, hooks: args[2] };
            } else {
                _add(args[0], HTTP_METHOD.GET, args[1], args[2]);
            }
        } else if (typeof args[0] === 'object') {
            let orderedRoutes = Object.keys(args[0]).sort(compareUrlDepth);

            orderedRoutes.forEach(route => {
                _on(route, args[0][route]);
            });
        }
        return this;
    };

    var _post = function (...args) {
        if (args.length >= 2) {
            if (args[0] === '/') {
                let func = args[1];

                if (typeof args[1] === 'object') {
                    func = args[1].uses;
                }

                _defaultHandler = { handler: func, hooks: args[2] };
            } else {
                _add(args[0], HTTP_METHOD.POST, args[1], args[2]);
            }
        } else if (typeof args[0] === 'object') {
            let orderedRoutes = Object.keys(args[0]).sort(compareUrlDepth);

            orderedRoutes.forEach(route => {
                _on(route, args[0][route]);
            });
        }
        return this;
    };

    var _put = function (...args) {
        if (args.length >= 2) {
            if (args[0] === '/') {
                let func = args[1];

                if (typeof args[1] === 'object') {
                    func = args[1].uses;
                }

                _defaultHandler = { handler: func, hooks: args[2] };
            } else {
                _add(args[0], HTTP_METHOD.PUT, args[1], args[2]);
            }
        } else if (typeof args[0] === 'object') {
            let orderedRoutes = Object.keys(args[0]).sort(compareUrlDepth);

            orderedRoutes.forEach(route => {
                _on(route, args[0][route]);
            });
        }
        return this;
    };

    var _delete = function (...args) {
        if (args.length >= 2) {
            if (args[0] === '/') {
                let func = args[1];

                if (typeof args[1] === 'object') {
                    func = args[1].uses;
                }

                _defaultHandler = { handler: func, hooks: args[2] };
            } else {
                _add(args[0], HTTP_METHOD.DELETE, args[1], args[2]);
            }
        } else if (typeof args[0] === 'object') {
            let orderedRoutes = Object.keys(args[0]).sort(compareUrlDepth);

            orderedRoutes.forEach(route => {
                _on(route, args[0][route]);
            });
        }
        return this;
    };

    var _on = function (...args) {
        if (typeof args[0] === 'function') {
            _defaultHandler = { handler: args[0], hooks: args[1] };
        } else if (args.length >= 2) {
            if (args[0] === '/') {
                let func = args[1];

                if (typeof args[1] === 'object') {
                    func = args[1].uses;
                }

                _defaultHandler = { handler: func, hooks: args[2] };
            } else {
                _add(args[0], args[1], args[2], args[3]);
            }
        } else if (typeof args[0] === 'object') {
            let orderedRoutes = Object.keys(args[0]).sort(compareUrlDepth);

            orderedRoutes.forEach(route => {
                _on(route, args[0][route]);
            });
        }
        return this;
    };

    var _else = function(defaultHandler) {
        _defaultHandler = defaultHandler;
    };

    var _route = async function (request) {

        return new Promise(async (resolve, reject) => {
            try {
                var handler, m;

                let formData = null;
                const contentType = request.headers.get('content-type');
                if (request.method === HTTP_METHOD.POST && contentType === 'application/x-www-form-urlencoded') {
                    formData = await request.formData();
                }

                m = _match(request, formData);

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
    };

    return {

        get: _get,

        post: _post,

        put: _put,

        delete: _delete,

        on: _on,

        else: _else,

        route: _route,
    }
}; //end Router

module.exports = new Router();
