import { _decorator, Component, error, Label, log, Node, NodeEventType, sp, Sprite, SpriteFrame, Tween, tween, UIOpacity, UITransform, v3, Vec3, warn } from 'cc';
import EventCenter from '../../kernel/core/event/EventCenter';
import GameEvent from '../../event/GameEvent';
import GameConst, { TItemtype } from '../../define/GameConst';
import { RollAxisCom, RollState } from './RollAxisCom';
import { ElementCtrl } from './ElementCtrl';
import CocosUtil from '../../kernel/compat/CocosUtil';
import GameAudio from '../../mgrs/GameAudio';
import GameCtrl from '../../ctrls/GameCtrl';
const { ccclass, property } = _decorator;

@ccclass('ElementCom')
export class ElementCom extends Component {

    @property(Node)
    icons: Node = null;
    @property(Node)
    iconsBlur: Node = null;
    @property(Node)
    spine: Node = null;

    @property(sp.Skeleton)
    light: sp.Skeleton = null;
    @property(sp.Skeleton)
    boom: sp.Skeleton = null;
    @property(sp.Skeleton)
    wdLight: sp.Skeleton = null;

    parentCom: RollAxisCom = null;

    locked: boolean = false;

    moved: boolean = false;

    isRollEnd: boolean = false;

    id: number = 0;

    /*顺序编号 0-n 用于获取该元素悬浮提示面板位置信息 */
    private _posIdx: number = -1;
    targetPos: Vec3 = null;

    get posIdx() {
        return this._posIdx;
    }
    set posIdx(value: number) {
        if (this._posIdx != value) {
            this._posIdx = value;
            let idx = this._posIdx % GameConst.MaxRow;
            if (idx == -1) {
                this.serverIdx = -1;
            } else if (idx == 0) {
                this.serverIdx = -1;
            } else if (idx == GameConst.MaxRow - 1) {
                this.serverIdx = Infinity;
            } else {
                this.serverIdx = this._posIdx - Math.floor(this._posIdx / GameConst.MaxRow) * 2 - 1;
            }
        }
    }

    serverIdx: number = -1;

    init(id: number, parentCom: RollAxisCom) {
        this.id = id
        this.posIdx = -1;
        this.parentCom = parentCom;

        this.locked = false;
        this.moved = false;
        this.isRollEnd = false;
        this.targetPos = null;
        // this.node.getChildByName("Label").getComponent(Label).string = id.toString();
        // warn("id", id, parentCom.idx);
        // this.hhscAward.active = false;
    }

    addClickEvent() {
        this.node.on(NodeEventType.TOUCH_START, this.onClick, this)
    }

    onClick(ev) {
        EventCenter.getInstance().fire(GameEvent.click_element, this.posIdx, this.id, ev.target);
    }

    changeId() {
        let id = this.id;
        if (this.id >= 19) {
            id = this.id - 16;
        }
        return id;
    }

    /**能否变百搭 */
    canBeVersatile() {
        return this.id >= 19;
    }

    updateIcon(isDim: boolean) {
        this.isRollEnd = false;
        if (this.id) {
            this.iconsBlur.active = isDim;
            this.icons.active = !isDim;
            this.spine.active = false;
            if (this.id >= 19) {
                this.node.getChildByName("Di").active = !isDim;
                this.node.getChildByName("DiB").active = isDim;
            } else {
                this.node.getChildByName("Di").active = false;
                this.node.getChildByName("DiB").active = false;
            }
            let id = this.changeId();
            if (isDim) {
                this.iconsBlur.children.forEach((node, idx) => {
                    node.active = id == idx + 1;
                });
            } else {
                this.icons.children.forEach((node, idx) => {
                    node.active = id == idx + 1;
                });
            }
            this.node.parent.children.sort((a, b) => {
                let id1 = a.getComponent(ElementCom).changeId();
                let id2 = b.getComponent(ElementCom).changeId();
                if (id1 == 1) {
                    id1 = 2;
                } else if (id1 == 2) {
                    id1 = 1;
                }
                if (id2 == 1) {
                    id2 = 2;
                } else if (id2 == 2) {
                    id2 = 1;
                }
                return id2 - id1;
            });
            let arr: { node: Node, idx: number }[] = [];
            let temp = [];
            this.node.parent.children.forEach((node, idx) => {
                arr.push({ node, idx });
                temp.push({ id: node.getComponent(ElementCom).changeId(), idx })
            });
            this.scheduleOnce(() => {
                arr.forEach((obj) => {
                    obj.node.setSiblingIndex(obj.idx);
                });
            })
        }
    }

    roll(speed: number): void {
        if (this.isRollEnd) {
            return;
        }
        let targetPos = v3(this.node.position.x, this.node.position.y + speed, this.node.position.z);
        if (this.targetPos) {
            if (targetPos.y <= this.targetPos.y) {
                this.isRollEnd = true;
                this.node.setPosition(this.targetPos.x, this.targetPos.y, this.targetPos.z);
                this.parentCom.checkEnd();
            } else {
                this.node.setPosition(targetPos);
            }
        } else {
            this.node.setPosition(targetPos);
            if (targetPos.y < -this.parentCom.itemSize.height / 2) {
                EventCenter.getInstance().fire(GameEvent.game_axis_roll_frist_move_lowest, this.parentCom.idx);
            }
        }
    }

    playDraws() {
        if (this.id == TItemtype.ITEM_TYPE_SCATTER) {
            this.icons.active = false;
            this.iconsBlur.active = false;
            this.spine.active = true;
            this.spine.children.forEach((node, idx) => {
                if (idx == this.id - 1) {
                    node.active = true;
                    let spS = node.getComponent(sp.Skeleton);
                    spS.setAnimation(0, "fastspin_start", false);
                    spS.setCompleteListener(() => {
                        spS.setAnimation(0, "fastspin_idle", true);
                        spS.setCompleteListener(null);
                    });
                } else {
                    node.active = false;
                }
            });
        }
    }

    playDrawsEnd() {
        if (this.id == TItemtype.ITEM_TYPE_SCATTER) {
            log("playDrawsEnd");
            this.icons.active = false;
            this.iconsBlur.active = false;
            this.spine.active = true;
            this.spine.children.forEach((node, idx) => {
                if (idx == this.id - 1) {
                    node.active = true;
                    let spS = node.getComponent(sp.Skeleton);
                    spS.setAnimation(0, "fastspin_exit", false);
                    spS.setCompleteListener(() => {
                        spS.setAnimation(0, "idle", true);
                        spS.setCompleteListener(null);
                    });
                } else {
                    node.active = false;
                }
            });
        }
    }

    playScatterWin(cb: () => void) {
        if (this.serverIdx != Infinity || this.serverIdx != -1) {
            this.icons.active = false;
            this.iconsBlur.active = false;
            this.spine.active = true;
            this.spine.children.forEach((node, idx) => {
                if (idx == this.id - 1) {
                    node.active = true;
                    let spS = node.getComponent(sp.Skeleton);
                    spS.setAnimation(0, "win", false);
                    spS.setCompleteListener(() => {
                        spS.setAnimation(0, "win_idle", false);
                        spS.setCompleteListener(() => {
                            log("播放win_idle回调")
                            cb();
                        });
                    });
                } else {
                    node.active = false;
                }
            });
        } else {
            cb();
        }
    }

    toTopEffectNode() {
        if (this.serverIdx != -1 && this.serverIdx != Infinity) {
            this.node.parent = this.parentCom.node.parent.getComponent(ElementCtrl).effectNodeList[this.parentCom.idx];
        }
    }

    playWinEffect(changeMaskCb: () => void, cb: () => void) {
        Tween.stopAllByTarget(this.light.node);
        this.toTopEffectNode();
        this.node.getChildByName("Di").active = false;
        this.node.getChildByName("DiB").active = false;
        this.icons.active = false;
        this.iconsBlur.active = false;
        this.spine.active = true;
        this.light.node.active = true;
        // this.wdLight.node.active = false;
        // EventCenter.getInstance().fire(GameEvent.chang_black_mask, true);
        // this.node.setSiblingIndex(this.node.parent.children.length);

        let id = this.changeId();
        let isChangeBaiDa = this.canBeVersatile();
        this.spine.children.forEach((child, idx) => {
            if (id == idx + 1) {
                child.active = true;
                let spS = child.getComponent(sp.Skeleton);
                spS.setToSetupPose();
                if (id == 1 || id == 2) {
                    spS.setAnimation(0, "win", false);
                    id == 1 && spS.setCompleteListener(() => {
                        spS.setAnimation(0, "idle", true);
                    });
                } else {
                    spS.setAnimation(0, child.name + "_win", false);
                    spS.setCompleteListener(null);
                }

                this.light.node.active = true;
                this.light.setToSetupPose();
                this.light.setAnimation(0, "animation", false);
                tween(this.light.node).delay(0.6).call(() => {
                    this.boom.node.active = true;
                    this.boom.setToSetupPose();
                    this.boom.setAnimation(0, "animation", false);
                    changeMaskCb();

                    if (isChangeBaiDa) {
                        child.active = false;
                        this.id = TItemtype.ITEM_TYPE_WILD;
                        // this.updateIcon(false);
                        // this.parentCom.changeEleIdx();
                        this.wdLight.node.parent.active = true;

                        this.wdLight.node.active = true;
                        this.wdLight.setToSetupPose();
                        this.wdLight.setAnimation(0, "animation", false);
                        this.wdLight.setCompleteListener(() => {
                            this.wdLight.setCompleteListener(null);
                            this.wdLight.node.active = false;

                        });
                        this.boom.setCompleteListener(null);
                        GameAudio.iconChangeWd()
                    } else {
                        tween(this.spine.getComponent(UIOpacity)).to(0.1, { opacity: 0 }).call(() => {
                        }).start();
                        this.boom.setCompleteListener(() => {
                            this.boom.setCompleteListener(null);
                            EventCenter.getInstance().fire(GameEvent.game_axis_roll_move_ele, this.parentCom.idx, this);
                            this.spine.getComponent(UIOpacity).opacity = 255;
                            this.boom.node.active = false;
                            this.light.node.active = false;
                        });
                        GameAudio.iconBoom()
                    }
                }).delay(0.5).call(() => {
                    !isChangeBaiDa && this.parentCom.removeSpecified(this);
                    cb();
                }).start();
            } else {
                child.active = false;
            }
        });
    }

    showWlddAward() {
        // this.hhscAward.active = true;
    }

    /**添加粒子特效 */
    addEffect(node: Node) {
        this.node.addChild(node);
    }

    setId(id: number, isDim: boolean = false) {
        this.init(id, this.parentCom);
        this.updateIcon(isDim)
    }

    getSize() {
        return this.node.getComponent(UITransform).contentSize
    }

}


