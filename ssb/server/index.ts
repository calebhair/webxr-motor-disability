import {setupSocketStreamedBrowser} from "./socket.ts";

const { server, io } = setupSocketStreamedBrowser();

server.listen(3000, () => {
    console.log('server running');
});