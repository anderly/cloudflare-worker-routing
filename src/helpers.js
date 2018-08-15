
module.exports = function() {
    /**
     * Response helper function
     * @param {*} res
     * @param {*} status
     * @param {*} statusText
     */
    response = function(res, status = 200, statusText = 'OK', headers = {}) {
        if (typeof res === 'object') {
            var { status, statusText, headers } = res;
            res = res.res;
        }
        let newHeaders = new Headers(headers);
        newHeaders.set('X-CloudFlare-Worker', 'Served by CloudFlare Worker.');

        // let text = (async () => {
        //     return await res.text();
        // })();

        // Modify it.
        //let modified = text + '<br/>More info here: <a href="https://github.com/anderly/cloudflare-worker-routing">https://github.com/anderly/cloudflare-worker-routing</a>';
        var response = new Response(res, { status: status, statusText: statusText, headers: newHeaders });
        return response;
    }; //end response

    /**
     * Redirect helper function
     * @param {*} uri
     * @param {*} status
     * @param {*} extraHeaders
     */
    redirect = function(uri, status = 302, extraHeaders = {}) {
        let headers = new Headers(extraHeaders);
        headers.set('Location', uri);

        return response('', status, 'Found', headers);
    }; //end redirect
};
