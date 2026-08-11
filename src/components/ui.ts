import AFRAME from 'aframe';
import { reversePainterSortStable, Container } from '@pmndrs/uikit'
const THREE = AFRAME.THREE;

AFRAME.registerComponent('ui-root', {

    init: function () {
        const root = this.root = new Container({
            backgroundColor: "red",
            sizeX: 8,
            sizeY: 4,
            flexDirection: "row",
        });
        console.log(root)
        this.el.setObject3D('mesh', root);

        const container1 = new Container({
            flexGrow: 1,
            margin: 32,
            backgroundColor: "green",
        })
        root.add(container1)

        const container2 = new Container({
            flexGrow: 1,
            margin: 32,
            backgroundColor: "blue",
        })
        root.add(container2)
    },

    tick: function (time, timeDelta) {
        this.root.update(timeDelta)
    },
});
