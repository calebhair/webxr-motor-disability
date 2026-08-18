import {setupSocketStreamedBrowser} from './socket.ts';
import {SBS_PORT} from '../../constants.ts';

const { server } = setupSocketStreamedBrowser();

server.listen(SBS_PORT, () => {
    console.log(`Server running on port ${SBS_PORT}`);
});