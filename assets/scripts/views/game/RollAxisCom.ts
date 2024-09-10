import { Component, Node, Size, UITransform, v3, _decorator, tween, Tween, warn, Vec3, easing, log, error, size } from "cc";
import { ElementCom } from "./ElementCom";
import { ObjPoolCom } from "./ObjPoolCom";
import MathUtil from "../../kernel/core/utils/MathUtil";
import GameModel from "../../models/GameModel";
import CocosUtil from "../../kernel/compat/CocosUtil";
import EventCenter from "../../kernel/core/event/EventCenter";
import GameEvent from "../../event/GameEvent";
import GameConst, { TItemtype } from "../../define/GameConst";
import GameCtrl from "../../ctrls/GameCtrl";
import GameAudio from "../../mgrs/GameAudio";
import { ElementCtrl } from "./ElementCtrl";
import { AudioManager } from "../../kernel/compat/audio/AudioManager";

const { ccclass, property } = _decorator;


export enum RollState {
    start,
    start_stop,//准备停止
    stop,//完全停止
}

@ccclass('RollAxisCom')
export class RollAxisCom extends Component {

    /**编号 */
    idx: number = -1;

    rollInitSpeed: number = -3600;

    rollSpeed: number = this.rollInitSpeed;//滚动速度

    rollMinSpeed: number = -600;

    elementList: ElementCom[] = [];

    _tempElementList: Node[] = [];

    state: RollState;

    initY: number = -142;

    itemSize: Size = size(145, 142);

    contentHeight: number = 558 //容器高度 分配元素坐标用

    parent: Node;//顶级父容器 用于坐标装换

    initPos: Vec3[] = [];

    stopData: number[] = [];

    isDraws: boolean = false;

    isDrawsing: boolean = false;

    // /**空位置 */
    // vacancy: number[] = [];
    // /**掉落次数 */
    // fallCount: number = 0;
    // /**掉落总次数 */
    // fallTotalCount: number = 0;
    /**掉落回调 */
    fallCb: () => void = null;

    init(idx: number, parent: Node) {
        this.idx = idx;
        this.parent = parent
        this.state = RollState.stop
    }

    pushElement(id: number, isTop?: boolean) {
        // let h = this.node.getComponent(UITransform).contentSize.height
        let y = this.initY;
        if (isTop) {
            y = (GameConst.MaxRow - 1.5) * Math.abs(this.initY);
        } else {
            let lastElement = this.elementList[this.elementList.length - 1];
            if (lastElement) {
                y = lastElement.node.position.y + this.itemSize.height / 2
            }
        }
        let element = ObjPoolCom.objPoolMgr.createElement();
        let com = element.getComponent(ElementCom)
        com.init(id, this)
        // let elementSize = com.getSize()
        element.position = v3(0, y + this.itemSize.height / 2, 0)
        // element.setPosition(0, y, 0);
        this.node.addChild(element);
        if (this.initPos.length <= GameConst.MaxRow) {
            this.initPos.push(element.position.clone());
        }
        this.elementList.push(com)
        return com
    }

    draws() {
        GameAudio.scatterEffect();
        this.isDrawsing = true;
        let duration = 2 * 1000;
        let now = new Date().getTime();
        tween(this.node).call(() => {
            let t = new Date().getTime() - now;
            let b = 1 - t / duration;
            if (b <= 0) {
                b = 0;
                Tween.stopAllByTarget(this.node);
                this.startStopRoll();
            }
            this.rollSpeed = this.rollMinSpeed + (this.rollInitSpeed - this.rollMinSpeed) * b;
        }).delay(0.001).union().repeatForever().start();
    }

    changeEleIdx() {
        let arr = this.elementList.filter((ele) => {
            return ele.isRollEnd;
        });
        arr.sort((a, b) => {
            return a.node.position.y - b.node.position.y;
        });
        arr.forEach((ele, idx) => {
            ele.posIdx = this.idx * GameConst.MaxRow + idx;
        });
    }


    // changeElementId(ids: number[]) {
    //     warn("elementList", this.elementList)
    //     for (let index = 0; index < this.elementList.length; index++) {
    //         const element = this.elementList[index];
    //         element.setId(ids[index])
    //         element.posIdx = this.idx * GameConst.MaxRow + index;
    //     }
    // }

    /**开始转动 */
    startRoll() {
        this.rollSpeed = this.rollInitSpeed;
        this.isDrawsing = false;

        warn("开始滚动", this.idx);
        let count = 0, len = this.elementList.length;
        this.elementList.forEach((child) => {
            let targetY = child.node.position.y + 40;
            tween(child.node)
                .by(0.1, { position: v3(0, 40, 0) })
                .call(() => {
                    child.node.setPosition(child.node.position.x, targetY, child.node.position.z);
                    count++;
                    if (count == len) {
                        let arr = [];
                        for (let i = 0; i < len; i++) {
                            let ele = this.elementList[i];
                            ele.moved = false;
                            ele.locked = false;
                            ele.isRollEnd = false;
                            arr.push(ele.node.position.y)
                        }
                        this.idx == 3 && log("start", JSON.stringify(arr));
                        this.state = RollState.start;
                        this.node.parent.getComponent(ElementCtrl).checkIsNeedStop();
                    }
                })
                .start();
        });
    }

    /**开始停止 */
    startStopRoll() {
        warn("开始停止", this.idx, this.stopData, RollState[this.state]);
        if (this.state != RollState.start) {
            return;
        }
        let datas = this.stopData;
        Tween.stopAllByTarget(this.node)
        datas.forEach((v, i) => {
            let els = this.pushElement(v)
            els.addClickEvent();
            els.targetPos = this.initPos[i];
            els.locked = true;
            els.updateIcon(false)
            els.posIdx = this.idx * GameConst.MaxRow + i;
        })
        this.state = RollState.start_stop;
        if (!GameCtrl.getIns().curFast && GameCtrl.getIns().curQuickFast) {
            this.openMulSpeed(10);
        }
    }

    checkEnd() {
        let count = 0;
        this.elementList.forEach((ele) => {
            if (ele.isRollEnd) {
                count++;
            }
            if (count == GameConst.MaxRow) {
                this.state = RollState.stop;
                this.onRollEnd();
            }
        });
    }

    /**转动 */
    roll() {
        if (GameCtrl.getIns().curQuickFast && this.isDraws) {
            AudioManager.inst.stopMusic();
            Tween.stopAllByTarget(this.node);
            this.parent.getComponent(ElementCtrl).rollAxisList.forEach((axis) => {
                if (axis.isDraws) {
                    axis.isDraws = false;
                    axis.startStopRoll();
                    this.openMulSpeed(10);
                }
            });
        }
        if (this.elementList.length < GameConst.MaxRow) {
            EventCenter.getInstance().fire(GameEvent.game_axis_roll_top_full_move_scene, this.idx, this.isDraws);
        }
    }

    openMulSpeed(mul: number) {
        this.rollSpeed = mul * this.rollInitSpeed;
    }

    startFallDown(data: number[], cb: () => void) {
        if (!data || data.length == 0) {
            cb();
            return;
        }
        this.elementList.forEach((ele) => {
            ele.moved = false;
        });
        this.fallCb = () => {
            this.changeEleIdx();
            cb();
        }
        this.fallDown();
        warn("startFallDown", JSON.stringify(data));
        this.fillingEle(data, cb);
    }

    /**是否是百搭 */
    isVersatile(serverIdx: number) {
        for (let i = 0; i < this.elementList.length; i++) {
            let ele = this.elementList[i];
            if (ele.serverIdx == serverIdx) {
                return ele.canBeVersatile();
            }
        }
    }

    /**掉落动画 */
    fallDown() {
        let count = 0, total = 0, noMove = 0;
        let arr = this.elementList;
        warn("元素个数", arr.length)
        let len = arr.length;
        arr.forEach((ele, idx) => {
            let targetPos = this.initPos[idx];
            if(!targetPos){
                console.log("fallDown",ele,idx);
            }
            if (targetPos.y != ele.node.position.y && !ele.moved) {
                let interval = Math.abs(Math.round((targetPos.y - ele.node.position.y) / ele.getSize().height));
                // warn("元素掉落", targetPos.y, ele.node.position.y, GameConst.fallDownTime * interval);
                ele.moved = true;
                Tween.stopAllByTarget(ele.node);
                total++;
                tween(ele.node).to(GameConst.fallDownTime * interval, { position: v3(0, targetPos.y, 0) }, { easing: easing.quartIn })
                    .by(0.1, { position: v3(0, 10, 0) }).by(0.1, { position: v3(0, -10, 0) })
                    .call(() => {
                        ele.node.setPosition(0, targetPos.y, 0);
                        count++;
                        if (count == total && len == GameConst.MaxRow) {
                            warn("掉落完回调", count, total)
                            this.fallCb && this.fallCb();
                        }
                    })
                    .start();
            } else {
                noMove++
                if (noMove == GameConst.MaxRow) {
                    warn("noMove回调", noMove, GameConst.MaxRow)
                    this.fallCb && this.fallCb();
                }
            }
        });
    }

    /**填充数据 */
    fillingEle(data: number[], cb: () => void) {
        if (data?.length > 0) {
            warn("填充数据", JSON.stringify(data), this.idx);
            let tw = tween(this.node);
            tw.delay(GameConst.fallDownTime);
            tw.call(() => {
                let ele = this.pushElement(data.pop(), true);
                ele.addClickEvent();
                ele.updateIcon(false);
                ele.moved = false;
                ele.isRollEnd = true;
                this.fillingEle(data, cb);
                this.fallDown();
            })
                .start();
        }
    }

    removeFrist() {
        return this.elementList.shift()
    }

    removeSpecified(ele: ElementCom) {
        let idx = this.elementList.indexOf(ele);
        if (idx > -1) {
            warn("删除图标", ele.id);
            return this.elementList.splice(idx, 1)[0];
        } else {
            return ele;
        }
    }

    changeRollState(state: RollState) {
        this.state = state;
    }

    onRollEnd() {
        log("onRollEnd");
        EventCenter.getInstance().fire(GameEvent.game_axis_ready_roll_end, this.idx)
        let count = 0;
        this.elementList.forEach((child) => {
            if (child.targetPos) {
                let node = child.node;
                let targetPos = this.initPos[child.posIdx % GameConst.MaxRow];
                let twe = tween(node)
                if (!GameCtrl.getIns().curFast && !GameCtrl.getIns().curQuickFast) {
                    twe.to(0.1, { position: v3(0, targetPos.y + 10, 0) })
                        .by(0.1, { position: v3(0, -10, 0) })
                }
                twe.call(() => {
                    node.setPosition(targetPos.x, targetPos.y, targetPos.z);
                    count++;
                    child.locked = false;
                    child.moved = false;
                    child.targetPos = null;
                    child.moved = false;

                    if (count == GameConst.MaxRow) {
                        this.changeEleIdx();
                        EventCenter.getInstance().fire(GameEvent.game_axis_roll_end, this.idx)
                    }
                }).start();
            }
        })
    }

    protected update(dt: number): void {
        dt = Number(dt.toFixed(4))
        let speed = this.rollSpeed * dt;
        let temp = this.elementList.slice(0);
        for (let i = 0; i < temp.length; i++) {
            let ele = temp[i];
            ele.roll(speed)
        }
        switch (this.state) {
            case RollState.start:
                this.roll()
                break;
            case RollState.start_stop:
                this.roll()
                break;
            case RollState.stop:
                break;
        }
    }

}



