const router = require('./router');
const SampleController = require('./sample-controller');

addEventListener('install', event => {
    console.log('Installing CloudFlare Worker...');
});

addEventListener('activate', event => {
    console.log('CloudFlare Worker now ready to handle fetches!');
});

/**
 * Cloudflare workers implement the service worker spec
 * See: https://developers.cloudflare.com/workers/about/ for an intro
 *
 * Binding an event handler to the fetch event allows your worker to intercept a request for your zone
 */
addEventListener('fetch', event => {
    /**
     * In the event of an uncaught exception, fail open as if the  worker did not exist
     * If you're not sure what you're doing, it's recommended you include this call
     * as the very first thing your worker does in its fetch event listener
     *
     * If you do not include this call, but your worker encounters an uncaught exception
     * while processing your request, your user will see an edge-level error page
     * instead of a response from your site, app or API
     *
     * Read on below for more info on deciding whether to
     * fail open or fail closed in your workers
     */
    event.passThroughOnException();

    //This allows you to return your own Response object from your worker
    event.respondWith(route(event));
});

async function route(event) {

    //It's strongly recommended that you wrap your core worker logic in a try / catch block
    try {
        let request = event.request;

        // router.on('/', 'OPTIONS', (req) => {
        //     let newHeaders = new Headers(req.request.headers);
        //     newHeaders.set('access-control-allow-origin', '*');
        //     return new Response('', { status: status, statusText: statusText, headers: newHeaders });
        // });
        router.get('/cloudflare', SampleController.index);
        router.post('/cloudflare', SampleController.store);
        router.get('/cloudflare/:id', SampleController.show);
        router.put('/cloudflare/:id', SampleController.update);
        router.delete('/cloudflare/:id', SampleController.destroy);
        router.get('/cloudflare/routes/:id', (req) => {
            let res = {
                res: '<html><body><a href="https://github.com/anderly/cloudflare-worker-routing/blob/master/src/index.js#L53-L59" target="_blank" title="See the source that generated this on GitHub">Response from closure instead of controller</a>: id=' + req.params.id + '</body></html>',
                headers: { 'content-type': 'text/html' },
            };
            return response(res);
        });
        return router.route(request);

    } catch (ex) {
        console.log(ex);
    }
}
