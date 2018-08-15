const HTTP_METHOD = require('./http-method');
require('./helpers')();

/**
 * SampleController
 */
function SampleController() {

    return {
        index: async function (req) {
            let res = {
                res: '<html><body><a href="https://github.com/anderly/cloudflare-worker-routing/blob/master/src/sample-controller.js#L10-L16" target="_blank" title="See the source that generated this on GitHub">SampleController@index</a></body></html>',
                headers: { 'content-type': 'text/html' },
            };
            return response(res);
        },
        show: async function (req) {
            let res = {
                res: '<html><body><a href="https://github.com/anderly/cloudflare-worker-routing/blob/master/src/sample-controller.js#L17-L23" target="_blank" title="See the source that generated this on GitHub">SampleController@show</a>: id=' + req.params.id + '</body></html>',
                headers: { 'content-type': 'text/html' },
            };
            return response(res);
        },
        store: async function (req) {
            return response('SampleController@store: Posted Data = ' + Object.keys(req.body).map(key => key + '=' + encodeURIComponent(req.body[key])).join('&'));
        },
        update: async function (req) {
            return response('SampleController@update: id=' + req.params.id);
        },
        destroy: async function (req) {
            return response('SampleController@destroy: id=' + req.params.id);
        }
    };
}

module.exports = new SampleController();
