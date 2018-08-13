const HTTP_METHOD = require('./http-method');
require('./helpers')();

/**
 * SampleController
 */
function SampleController() {

    return {
        index: async function (req) {
            return response('SampleController@index');
        },
        show: async function (req) {
            return response('SampleController@show: id=' + req.params.id);
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
