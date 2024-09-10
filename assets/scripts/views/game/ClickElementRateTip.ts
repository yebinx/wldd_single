import { _decorator, Component, Label, Layout, Node, NodeEventType, sp, Sprite, SpriteFrame, tween, UIOpacity, UITransform, v3, Vec2, Vec3, warn } from 'cc';
import { ElementCom } from './ElementCom';
import GameConst from '../../define/GameConst';
const { ccclass, property } = _decorator;

window["paytableMask"] = {
    interval: 0.25,
    opacity: 150
}

@ccclass('ClickElementRateTip')
export class ClickElementRateTip extends Component {
    @property(Node)
    root: Node;
    @property(sp.SkeletonData)
    dataArr: sp.SkeletonData[] = [];
    @property(SpriteFrame)
    spriteArr: SpriteFrame[] = [];
    @property(Node)
    mask: Node;

    start() {
        this.root.on(NodeEventType.TOUCH_END, () => {
            this.hideTip()
        }, this)
    }

    showTip(posIdx: number, id: number, touchNode: Node) {
        warn("showTip", posIdx, id)
        if (posIdx == 0 || posIdx == 6 || posIdx == 12 || posIdx == 18 || posIdx == 24
            || posIdx == 5 || posIdx == 11 || posIdx == 17 || posIdx == 23 || posIdx == 29) {
            return;
        }
        this.root.active = true;
        let arr = GameConst.ElementRateList.get(id);
        let node = this.root.getChildByName("multiple_bg");
        let curPos = Vec3.ZERO;
        let icon: Node = null;
        let posX = 0;
        if (arr.length == 1) {
            if (posIdx < 17) {//左
                icon = node.getChildByName("icon_left");
                icon.active = true;
                node.getChildByName("label").active = true;
                node.getChildByName("icon_right").active = false;
            } else {//右
                icon = node.getChildByName("icon_right");
                icon.active = true;
                node.getChildByName("icon_left").active = false;
                node.getChildByName("label").active = true;
            }
            node.getChildByName("label_left").active = false;
            node.getChildByName("label_right").active = false;
            node.getChildByName("label").getComponent(Label).string = arr[0] as string;
            node.getChildByName("label").getComponent(Label).updateRenderData();
        } else {
            if (posIdx < 17) {//左
                icon = node.getChildByName("icon_left");
                icon.active = true;
                node.getChildByName("label_left").active = true;
                node.getChildByName("label").active = false;
                node.getChildByName("label_right").active = false;
                node.getChildByName("icon_right").active = false;
                node.getChildByName("label_left").getChildByName("num").getComponent(Label).string = (arr[0] as any).num + "\n" + (arr[1] as any).num + "\n" + (arr[2] as any).num;
                node.getChildByName("label_left").getChildByName("multiple").getComponent(Label).string = (arr[0] as any).multiple + "\n" + (arr[1] as any).multiple + "\n" + (arr[2] as any).multiple;
                node.getChildByName("label_left").getChildByName("multiple").setPosition(1.415, 1, 0);
            } else {//右
                icon = node.getChildByName("icon_right");
                icon.active = true;
                node.getChildByName("icon_left").active = false;
                node.getChildByName("label_left").active = false;
                node.getChildByName("label").active = false;
                node.getChildByName("label_right").active = true;
                node.getChildByName("label_right").getChildByName("num").getComponent(Label).string = (arr[0] as any).num + "\n" + (arr[1] as any).num + "\n" + (arr[2] as any).num;
                node.getChildByName("label_right").getChildByName("multiple").getComponent(Label).string = (arr[0] as any).multiple + "\n" + (arr[1] as any).multiple + "\n" + (arr[2] as any).multiple;
                posX = node.getChildByName("label_right").getChildByName("multiple").position.x;
                node.getChildByName("label_right").getChildByName("multiple").setPosition(-5.585, 1, 0);
            }
        }
        let spS = icon.getChildByName("sp").getComponent(sp.Skeleton);
        id -= 1;
        if (id >= 18) {
            icon.getChildByName("icon").active = true;
            icon.getChildByName("di").active = true;
            id -= 16;
            icon.getChildByName("sp").active = false;
            icon.getChildByName("icon").getComponent(Sprite).spriteFrame = this.spriteArr[id];
        } else {
            icon.getChildByName("di").active = false;
            spS.skeletonData = this.dataArr[id];
            spS.clearAnimation();
            if (id == 0 || id == 1) {
                icon.getChildByName("sp").active = true;
                icon.getChildByName("icon").active = false;
                spS.setAnimation(0, "spawn", false);
                spS.setCompleteListener(() => {
                    spS.setAnimation(0, "idle", true);
                })
            } else {
                icon.getChildByName("icon").active = true;
                icon.getChildByName("sp").active = false;
                spS.setCompleteListener(null);
                icon.getChildByName("icon").getComponent(Sprite).spriteFrame = this.spriteArr[id];
            }
        }
        node.getComponent(Layout).updateLayout();
        this.root.getComponent(Layout).updateLayout();

        let targetPos = touchNode.parent.getComponent(UITransform).convertToWorldSpaceAR(touchNode.position);
        curPos = icon.parent.getComponent(UITransform).convertToWorldSpaceAR(icon.position);
        let c = targetPos.subtract(curPos);
        let p = this.root.position.add(c);
        this.root.setPosition(p);

        if (id == 1 || id == 0) {
            icon.getChildByName("sp").setScale(0.35, 0.35, 0);
        } else {
            icon.getChildByName("sp").setScale(1, 1, 0);
        }
        
        this.scheduleOnce(() => {
            node.getChildByName("label_left").getChildByName("multiple").setPosition(11.415, 1, 0);
            node.getChildByName("label_right").getChildByName("multiple").setPosition(4.415, 1, 0);
        });

        tween(this.mask.getComponent(UIOpacity)).to(window["paytableMask"].interval, { opacity: window["paytableMask"].opacity }).start();
    }

    hideTip() {
        warn("hide")
        tween(this.mask.getComponent(UIOpacity)).to(window["paytableMask"].interval, { opacity: 0 }).start();
        this.root.active = false;
    }

}


