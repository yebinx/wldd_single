import { _decorator, Component, game, Node, Size, view, screen, warn } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AdaptScreenManager')
export class AdaptScreenManager extends Component {

    private static _events: Map<Node, ((visible: Size) => void)[]> = new Map();

    static visible: Size = new Size();

    static addEvent(node: Node, ev: (visible: Size) => void) {
        let t = this._events.get(node);
        if (t) {
            t.push(ev);
        } else {
            this._events.set(node, [ev]);
        }
    }

    static deleteEvent(node: Node) {
        this._events.delete(node);
    }

    private calcSize() {
        let visible = new Size();
        let original = view.getVisibleSize().width / view.getVisibleSize().height;
        let now = game.canvas.width / game.canvas.height;
        if (now > original) {
            visible.width = view.getVisibleSize().height / game.canvas.height * game.canvas.width;
            visible.height = view.getVisibleSize().height;
        } else {
            visible.width = view.getVisibleSize().width;
            visible.height = view.getVisibleSize().width / game.canvas.width * game.canvas.height;
        }
        return visible;
    }

    onLoad() {
        AdaptScreenManager.visible = this.calcSize();
        view.on("canvas-resize", () => {
            AdaptScreenManager.visible = this.calcSize();
            AdaptScreenManager._events.forEach((evs) => {
                evs.forEach((ev) => {
                    ev(AdaptScreenManager.visible);
                })
            });
        })
    }

    update(deltaTime: number) {
        
    }
}


