require('./helpers')();

/**
 * SampleController
 */
class SampleController {

    async index(req) {
        let res = {
            res: '<html><body><a href="https://github.com/anderly/cloudflare-worker-routing/blob/master/src/sample-controller.js#L8-L14" target="_blank" title="See the source that generated this on GitHub">SampleController@index</a></body></html>',
            headers: { 'content-type': 'text/html' },
        };
        return response(res);
    }

    async show(req) {
        let res = {
            res: '<html><body><a href="https://github.com/anderly/cloudflare-worker-routing/blob/master/src/sample-controller.js#L16-L22" target="_blank" title="See the source that generated this on GitHub">SampleController@show</a>: id=' + req.params.id + '</body></html>',
            headers: { 'content-type': 'text/html' },
        };
        return response(res);
    }

    async store(req) {
        return response('SampleController@store: Posted Data = ' + Object.keys(req.body).map(key => key + '=' + encodeURIComponent(req.body[key])).join('&'));
    }

    async update(req) {
        return response('SampleController@update: id=' + req.params.id);
    }

    async destroy(req) {
        return response('SampleController@destroy: id=' + req.params.id);
    }
}

module.exports = new SampleController();
