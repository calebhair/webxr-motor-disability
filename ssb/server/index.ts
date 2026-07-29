import {setupSocketStreamedBrowser} from "./socket.ts";

const { server, io, sb } = setupSocketStreamedBrowser();

server.listen(3000, () => {
    console.log('server running');
});