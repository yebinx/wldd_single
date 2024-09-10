import { _decorator, Component, Node, Size, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BlurBg')
export class BlurBg extends Component {
    start() {
    }

    update(deltaTime: number) {
        let tSize = this.node.getComponent(UITransform).contentSize;
        let parentSize = this.node.parent.getComponent(UITransform).contentSize;
        let b = tSize.width / tSize.height;
        let bp = parentSize.width / parentSize.height;
        let nowSize = new Size();
        if (bp > b) {
            nowSize.width = parentSize.width;
            nowSize.height = nowSize.width / b;
        } else {
            nowSize.height = parentSize.height;
            nowSize.width = nowSize.height * b;
        }
        this.node.getComponent(UITransform).setContentSize(nowSize);
    }
}


