import { _decorator, Component, error, log, Node, Tween, tween, UIOpacity, warn } from 'cc';
import { RollAxisCom, RollState } from './RollAxisCom';
import EventCenter from '../../kernel/core/event/EventCenter';
import GameEvent from '../../event/GameEvent';
import { ElementLayer } from './ElementLayer';
import { BaseComp } from '../../kernel/compat/view/BaseComp';
import GameConst, { GameState, TItemtype } from '../../define/GameConst';
import { ObjPoolCom } from './ObjPoolCom';
import MathUtil from '../../kernel/core/utils/MathUtil';
import GameAudio from '../../mgrs/GameAudio';
import { ElementCom } from './ElementCom';
import GameCtrl from '../../ctrls/GameCtrl';
const { ccclass, property } = _decorator;

@ccclass('ElementCtrl')
export class ElementCtrl extends BaseComp {


    rollCnt: number = 0;
    /*列滚动轴 */
    @property(RollAxisCom)
    rollAxisList: RollAxisCom[] = []
    @property(Node)
    effectNodeList: Node[] = [];
    @property(UIOpacity)
    maskNodeList: UIOpacity[] = [];

    randomElementIdList: number[] = []

    resultData: number[][] = null;

    /**听牌效果  */
    isDrawsEffect: boolean = false;
    /**开始听牌的idx */
    startDrawsIdx: number = Infinity;
    /**开始滚动的轴的数量 */
    startRollCount: number = 0;
    /**可以停止 */
    canStop: boolean = false;
    /**可以自然停止 */
    canNatureStop: boolean = false;

    start() {
        this.initNetEvent()
    }

    private initNetEvent() {
        EventCenter.getInstance().listen(GameEvent.game_axis_roll_end, this.onAxisRollEnd, this);
        EventCenter.getInstance().listen(GameEvent.game_axis_roll_frist_move_lowest, this.onFristElementMoveLowest, this);
        EventCenter.getInstance().listen(GameEvent.game_axis_roll_top_full_move_scene, this.onTopElementMoveScene, this);
        EventCenter.getInstance().listen(GameEvent.game_axis_roll_move_ele, this.onDeleteSpecified, this);

    }

    init(elementList: Array<Array<number>>) {
        this.restRandomElementList()
        warn("init", elementList);
        for (let col = 0; col < elementList.length; col++) {
            let elementDatas = elementList[col];
            this.rollAxisList[col].init(col, this.getComponent(ElementLayer).node)
            for (let row = 0; row < elementDatas.length; row++) {
                const data = elementDatas[row]
                let el = this.rollAxisList[col].pushElement(data)
                el.posIdx = col * GameConst.MaxRow + row;
                el.addClickEvent();
                el.updateIcon(false)
                el.isRollEnd = true;
            }
        }
    }

    /**开始转动 */
    startRoll(isFast) {
        this.isDrawsEffect = false;
        this.startRollCount = 0;
        this.rollCnt = 0;
        for (let index = 0; index < this.rollAxisList.length; index++) {
            this.rollCnt++;
            const element = this.rollAxisList[index];
            if (isFast) {
                element.startRoll()
            } else {
                this.scheduleOnce(() => {
                    element.startRoll()
                }, index * 0.1)
            }
        }
    }

    /**检测是否需要急停 */
    checkIsNeedStop() {
        this.startRollCount++;
        log("检测是否需要急停", this.resultData, GameCtrl.getIns().getModel().isShowLongJuan, this.startRollCount)
        if (this.startRollCount == this.rollAxisList.length) {
            if (GameCtrl.getIns().getModel().isShowLongJuan) {
                warn("播放龙卷")
                EventCenter.getInstance().fire(GameEvent.game_show_long_juan);
                return;
            }
            if ((GameCtrl.getIns().curFast || GameCtrl.getIns().curQuickFast) && this.resultData) {
                warn("需要急停", GameCtrl.getIns().curFast, GameCtrl.getIns().curQuickFast)
                EventCenter.getInstance().fire(GameEvent.update_game_state, GameState.start_stop_roll)
                this.rollAxisList.forEach((element, index) => {
                    element.isDraws = false;
                    element.startStopRoll()
                });
            } else {
                this.canStop = true;
                if (this.canNatureStop) {
                    this.canNatureStop = false;
                    this.stopRoll();
                }
            }
        } else {
            this.canStop = false;
        }
        log("可不可以停止", this.canStop);
    }

    /**是否听牌 */
    isDraws(data: Array<Array<number>>) {
        this.resultData = data;
        warn("是否听牌", JSON.stringify(data), GameCtrl.getIns().curFast, GameCtrl.getIns().curQuickFast);
        let count = 0, idx = Infinity;
        if (GameCtrl.getIns().curFast || GameCtrl.getIns().curQuickFast) {
            return this.startDrawsIdx = idx;
        }
        for (let i = 0; i < data.length; i++) {
            let list = data[i].slice(1, data[i].length - 1);
            for (let j = 0; j < list.length; j++) {
                let ele = list[j];
                if (ele == TItemtype.ITEM_TYPE_SCATTER) {
                    count++;
                }
            }
            if (count >= 2 && i != data.length - 1) {
                idx = i + 1;
                this.isDrawsEffect = true;
                return this.startDrawsIdx = idx;
            }
        }
        return this.startDrawsIdx = idx;
    }

    /**设置听牌 */
    setAxisDraws() {
        for (let i = 0; i < this.rollAxisList.length; i++) {
            let ele = this.rollAxisList[i];
            ele.isDraws = ele.idx >= this.startDrawsIdx;
            ele.stopData = this.resultData[i];
            warn("设置停止数据", ele.stopData, ele.isDraws)
        }
    }

    /**停止转动 */
    stopRoll() {
        let isFast = GameCtrl.getIns().curFast || GameCtrl.getIns().curQuickFast;
        if (GameCtrl.getIns().getModel().isShowLongJuan) {
            return;
        }
        warn("停止转动", this.canStop, this.resultData, isFast);
        if (this.canStop && this.resultData) {
            EventCenter.getInstance().fire(GameEvent.update_game_state, GameState.start_stop_roll)
            for (let index = 0; index < this.rollAxisList.length; index++) {
                let element = this.rollAxisList[index];
                let i = index;
                if (isFast) {
                    element.isDraws = false;
                    element.startStopRoll();
                } else {
                    warn("ddddddddd", element.isDraws);
                    this.scheduleOnce(() => {
                        !element.isDraws && element.startStopRoll();
                    }, i * 0.1)
                }
            }
        } else {
            if (isFast) {
                for (let index = 0; index < this.rollAxisList.length; index++) {
                    let element = this.rollAxisList[index];
                    element.isDraws = false;
                }
            }
            if (this.resultData) {
                this.canNatureStop = true;
            }
        }
    }

    // changeElementId(datas: Array<Array<number>>) {
    //     for (let index = 0; index < this.rollAxisList.length; index++) {
    //         const element = this.rollAxisList[index];
    //         element.changeElementId(datas[index])
    //     }
    // }

    onAxisRollEnd(idx: number) {
        log("onAxisRollEnd", this.rollCnt);
        this.rollCnt--;
        if (this.rollCnt <= 0) {
            EventCenter.getInstance().fire(GameEvent.game_roll_complete)
        }
        if (idx + 1 < this.rollAxisList.length) {
            let nextIdx = idx + 1;
            let next = this.rollAxisList[nextIdx];
            if (next.isDraws) {
                for (let i = 0; i < this.rollAxisList.length; i++) {
                    EventCenter.getInstance().fire(GameEvent.chang_black_mask, i < nextIdx, i);
                }
                this.effectNodeList[idx].getChildByName("sp_respin").active = false;
                this.effectNodeList[nextIdx].getChildByName("sp_respin").active = true;
                next.draws();
            } else {
                this.effectNodeList[idx].getChildByName("sp_respin").active = false;
            }
            this.highIconToTop(idx);
        } else {
            this.effectNodeList[idx].getChildByName("sp_respin").active = false;
            EventCenter.getInstance().fire(GameEvent.chang_black_mask, false);
            this.recoverDrawsEffect();
        }
    }

    /**将高分图片移至上层 */
    highIconToTop(idx: number) {
        this.rollAxisList[idx].elementList.forEach((child) => {
            let id = child.changeId();
            if (id == TItemtype.ITEM_TYPE_WILD || id == TItemtype.ITEM_TYPE_SCATTER) {
                child.node.parent = this.effectNodeList[idx];
                if (this.isDrawsEffect) {
                    child.playDraws();
                }
            }
        });
    }

    /**恢复听牌效果 */
    recoverDrawsEffect() {
        if (this.isDrawsEffect) {
            this.rollAxisList.forEach((axis) => {
                axis.elementList.forEach((child) => {
                    child.playDrawsEnd();
                });
            });
        }
    }

    getElementNode(col: number, row: number) {
        let axis = this.rollAxisList[col];
        if (axis) {
            return axis.elementList[row];
        }
    }

    onFristElementMoveLowest(col: number) {
        let axis = this.rollAxisList[col];
        if (axis) {
            let element = axis.removeFrist()
            if (element) {
                ObjPoolCom.objPoolMgr.delElement(element.node);
            }
        }
    }

    onDeleteSpecified(col: number, ele?: ElementCom) {
        warn("onDeleteSpecified", col, ele);
        let axis = this.rollAxisList[col];
        if (axis) {
            axis.removeSpecified(ele);
            if (ele) {
                ObjPoolCom.objPoolMgr.delElement(ele.node);
            }
        }
    }

    restRandomElementList() {
        this.randomElementIdList = GameConst.ElementList.slice(1);
    }

    onTopElementMoveScene(col: number, isClear?: boolean) {
        let axis = this.rollAxisList[col];
        if (axis) {
            while (axis.elementList.length < GameConst.MaxRow) {
                let min = 0
                let max = this.randomElementIdList.length - 1;
                if (col == 0 || col == 4) {
                    max = 9;
                }
                if (col == 2 && GameCtrl.getIns().getModel().isFree()) {
                    min = 10;
                }
                let idx = MathUtil.getRandomInt(min, max)
                let element = axis.pushElement(this.randomElementIdList[idx])
                element.updateIcon(!isClear)
            }
        }
    }

    update(dt: number) {
        // this.rollAxisList.forEach(v => v.update(dt))
    }
}


