import {setupSocketStreamedBrowser} from "./socket.ts";

const { server } = setupSocketStreamedBrowser();

server.listen(3000, () => {
    console.log('server running');
});