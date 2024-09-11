import { _decorator, Animation, AnimationClip, AnimationState, assetManager, bezier, Button, Color, Component, DynamicAtlasManager, dynamicAtlasManager, error, Event, EventMouse, EventTouch, Game, Input, input, instantiate, KeyCode, Label, log, Node, NodeEventType, Prefab, sp, Sprite, sys, Tween, tween, UIOpacity, UITransform, v3, Vec2, Vec3, warn } from 'cc';
import { BaseView } from '../../kernel/compat/view/BaseView';
import { ElementCtrl } from './ElementCtrl';
import { GameMode, InitUIInfo, ResultAwardUIInfo, ResultLineInfo } from '../../models/GameModel';
import { GameUI } from './GameUI';
import { ObjPoolCom } from './ObjPoolCom';
import CocosUtil from '../../kernel/compat/CocosUtil';
import GameCtrl from '../../ctrls/GameCtrl';
import GameEvent from '../../event/GameEvent';
import EventCenter from '../../kernel/core/event/EventCenter';
import GameConst, { GameState, TItemtype } from '../../define/GameConst';
import { WinAwardNumAnimation } from './WinAwardNumAnimation';
import { ClickElementRateTip } from './ClickElementRateTip';
import { ElementCom } from './ElementCom';
import { UIManager } from '../../kernel/compat/view/UImanager';
import { EViewNames } from '../../configs/UIConfig';
import { EDialogMenuId, EDialogType, EUILayer, ParamConfirmDlg } from '../../kernel/compat/view/ViewDefine';
import { AudioManager } from '../../kernel/compat/audio/AudioManager';
import LocalCache from '../../kernel/core/localcache/LocalCache';
import GameAudio, { BgmType } from '../../mgrs/GameAudio';
import { BaseEvent } from '../../kernel/core/event/BaseEvent';
import { RollAxisCom } from './RollAxisCom';
import { GameWheel } from './GameWheel';
import BigNumber from 'bignumber.js';
import { TRound } from '../../interface/result';
import LoginCtrl from '../../ctrls/LoginCtrl';
const { ccclass, property } = _decorator;

window["spinPointer"] = {
    normalAngularVelocity: -90,
    accelerateAngularVelocity: -240
}

window["secondaryMenu"] = {
    responseTime: 0.1
}

@ccclass('GameView')
export class GameView extends BaseView {

    /**元素控制器 */
    @property(ElementCtrl)
    elementCtrl: ElementCtrl;

    @property(Node)
    effectLayer: Node;

    @property(Node)
    wheel: Node;

    @property(WinAwardNumAnimation)
    winNumAnimation: WinAwardNumAnimation

    @property(ClickElementRateTip)
    clickElementRateTip: ClickElementRateTip

    /**对象池 */
    static objPool: ObjPoolCom;

    /**初始化信息 */
    viewInfo: InitUIInfo;

    lineInfos: ResultLineInfo[] = [];

    state: GameState;

    resultAwardUIInfo: TRound

    elementNodes: Node[] = [];

    isFast: boolean = false;
    curMode: GameMode = GameMode.normal;

    /**遮罩黑透明节点 */
    mask_bg: Node;

    /**虎虎生财 回合计数 */
    hhscRoundCnt: number = 0;

    /**收集百搭个数 */
    collectWdCnt: number = 0;

    ndElementFullSceneEffect: Node;

    /**当前回合是否播放过出现百搭音效 */
    isCurRoundPlayWdElementAudio: boolean = false;

    /**当前spin按钮是否hover */
    spinHover: boolean = false;
    /**当前auto按钮是否hover */
    autoHover: boolean = false;

    /**当前需要显示的哪一轮结果 */
    // curShowResultRoundIdx: number = 0;

    onLoad() {
        CocosUtil.traverseNodes(this.node, this.m_ui)
        GameView.objPool = this.getComponent(ObjPoolCom)
    }

    initData(viewInfo: InitUIInfo) {
        this.viewInfo = viewInfo;
    }

    start() {
        this.getComponent(GameUI).setBalanceAmount(this.viewInfo.balance)
        this.getComponent(GameUI).setBetAmount(this.viewInfo.curBetAmount)
        this.getComponent(GameUI).setWinAmount(this.viewInfo.lastWinAmount)
        this.onChangeBetAmount(this.viewInfo.curBetAmount, false);
        this.initNetEvent();
        this.initUIEvent();
        this.onUpdateState(GameState.wait)
        this.effectLayer.active = false;
        this.clickElementRateTip.hideTip();
        this.refreshVoice();
        this.initFastState(GameCtrl.getIns().isFast);
        this.onUpdateOpenAutoRoll(false, 0)
        this.switchMenu(true, false);
        this.winNumAnimation.initializationState(0);
        if (this.viewInfo.lastWinAmount > 0) {
            this.winNumAnimation.showWin(this.viewInfo.lastWinAmount, true, false, true)
        } else {
            this.winNumAnimation.hideWin()
        }
        this.elementCtrl.init(this.viewInfo.elementList);
        this.m_ui.click_quick_stop_effect.active = false;

        if (this.viewInfo.remainFreeTimes) {
            //this.viewInfo.lastResultAwardUIInfo.multi_time
            this.connectFreeMode(this.viewInfo.remainFreeTimes,1 , GameCtrl.getIns().getModel().gameInfo.free_total_times == this.viewInfo.remainFreeTimes);
        } else if (this.viewInfo.lastResultAwardUIInfo && !this.viewInfo.isEndFree) {
            this.wheel.getComponent(GameWheel).jumpSpecifyLocation(this.viewInfo.lastResultAwardUIInfo.multi_time);
        } else {
            this.wheel.getComponent(GameWheel).jumpSpecifyLocation(1);
        }

        this.m_ui.StartAutoBtn.on(Node.EventType.TOUCH_START, () => {
            if (!this.m_ui.StartAutoBtn.getComponent(Button).interactable) {
                return
            }
            this.m_ui.StartAutoBtn.getComponent(Button).enabled = false;
            Tween.stopAllByTarget(this.m_ui.StartAutoBtn);
            tween(this.m_ui.StartAutoBtn).to(0.1, { scale: v3(0.9, 0.9, 0.9) }).start();
        })
        this.m_ui.StartAutoBtn.on(Node.EventType.TOUCH_END, () => {
            if (!this.m_ui.StartAutoBtn.getComponent(Button).interactable) {
                return
            }
            this.m_ui.StartAutoBtn.getComponent(Button).enabled = true;
            Tween.stopAllByTarget(this.m_ui.StartAutoBtn);
            tween(this.m_ui.StartAutoBtn).to(0.1, { scale: v3(1, 1, 1) }).start();
            this.onOpenUIAuto();
        })
        this.m_ui.StartAutoBtn.on(Node.EventType.TOUCH_CANCEL, () => {
            if (!this.m_ui.StartAutoBtn.getComponent(Button).interactable) {
                return
            }
            this.m_ui.StartAutoBtn.getComponent(Button).enabled = true;
            Tween.stopAllByTarget(this.m_ui.StartAutoBtn);
            tween(this.m_ui.StartAutoBtn).to(0.1, { scale: v3(1, 1, 1) }).start();
        })

        this.m_ui.pointer_box.on(Node.EventType.TOUCH_END, (ev: EventTouch) => {
            if (this.m_ui.SpinBtn.getComponent(Button).interactable) {
                let p = ev.getUILocation();
                let np = (ev.target as Node).getComponent(UITransform).convertToNodeSpaceAR(v3(p.x, p.y, 0));
                if (Math.pow(np.x, 2) + Math.pow(np.y, 2) <= Math.pow(ev.target.getComponent(UITransform).contentSize.width / 2, 2)) {
                    this.onSpin();
                }
            }
        })

        this.setButtonAction();
        // this.scheduleOnce(() => {
        //     GameCtrl.getIns().getModel().setBetResult({ free_total_times: 10, result: { round_list: [] } } as any)
        //     this.outFreeMode(1000000000)
        // }, 1);
    }

    setButtonAction() {
        this.setUniversalButton(this.m_ui.MinusBtn, this.onReduceBetAmount.bind(this));
        this.setUniversalButton(this.m_ui.AddBtn, this.onAddBetAmount.bind(this));
        this.setUniversalButton(this.m_ui.MoreBtn, this.onBtnMenu.bind(this), true);

        this.setUniversalButton(this.m_ui.ExitBtn, this.onBtnQuit.bind(this), true);
        this.setUniversalButton(this.m_ui.AudioBtn, this.onBtnVoice.bind(this), true);
        this.setUniversalButton(this.m_ui.PayTableBtn, this.openPayTable.bind(this), true);
        this.setUniversalButton(this.m_ui.RuleTableBtn, this.openRule.bind(this), true);
        this.setUniversalButton(this.m_ui.HistoryBtn, this.onOpenHistory.bind(this), true);
        this.setUniversalButton(this.m_ui.CloseBtn, this.onCloseBtnMenu.bind(this), true);
    }

    setUniversalButton(node: Node, cb: () => void, isCD?: boolean) {
        let isLeave = false, canCb = true;
        node.on(Node.EventType.TOUCH_START, () => {
            isLeave = false;
            if (node.getComponent(Button).interactable && node.getComponent(Button).enabled) {
                this.changeBtnStyle(node, false);
            }
        })
        node.on(Node.EventType.TOUCH_END, () => {
            if (node.getComponent(Button).enabled) {
                if (node.getComponent(Button).interactable) {
                    this.changeBtnStyle(node, true);
                }
                canCb && !isLeave && cb();

                if (isCD) {
                    canCb = false;
                    this.scheduleOnce(() => {
                        canCb = true;
                    }, 0.5);
                }
            }
        })
        node.on(Node.EventType.TOUCH_CANCEL, () => {
            if (node.getComponent(Button).interactable && node.getComponent(Button).enabled) {
                this.changeBtnStyle(node, true);
            }
        })
        node.on(Node.EventType.TOUCH_MOVE, (ev: EventTouch) => {
            if (!node.getComponent(Button).enabled) {
                return;
            }
            let p = node.getComponent(UITransform).convertToNodeSpaceAR(v3(ev.getUILocation().x, ev.getUILocation().y, 0));
            let cs = node.getComponent(UITransform).contentSize;
            if (p.x < -cs.width / 2 || p.x > cs.width / 2 || p.y < -cs.height / 2 || p.y > cs.height / 2) {
                isLeave = true;
                node.getComponent(Button).interactable && this.changeBtnStyle(node, true);
            }
        })
    }

    changeBtnStyle(node: Node, can: boolean) {
        let op = node.getChildByName("Can").getComponent(UIOpacity);
        let opN = node.getChildByName("Not")?.getComponent(UIOpacity);
        if (!op) {
            op = node.getChildByName("Can").addComponent(UIOpacity)
        }
        if (!opN) {
            opN = node.getChildByName("Not")?.addComponent(UIOpacity)
        }
        op && (op.opacity = can ? 255 : 128);
        opN && (opN.opacity = can ? 255 : 128);
    }

    private initUIEvent() {
        this.m_ui.click_quick_stop_layer.on(NodeEventType.TOUCH_START, this.onClickQuickStop, this)

        this.m_ui.pointer_box.on(NodeEventType.MOUSE_MOVE, (ev: EventMouse) => {
            let p = ev.getUILocation();
            let np = (ev.target as Node).getComponent(UITransform).convertToNodeSpaceAR(v3(p.x, p.y, 0));
            if (Math.pow(np.x, 2) + Math.pow(np.y, 2) <= Math.pow(ev.target.getComponent(UITransform).contentSize.width / 2, 2)) {
                this.spinHover = true;
                this.onMouseEnterSpin(ev)
            } else {
                this.spinHover = false;
                this.onMouseLeaveSpin(ev)
            }
        }, this)
        this.m_ui.pointer_box.on(Node.EventType.MOUSE_LEAVE, (ev: EventMouse) => {
            this.spinHover = false;
            this.onMouseLeaveSpin(ev);
        }, this)
        this.m_ui.AutoBtn.on(NodeEventType.MOUSE_ENTER, (ev: EventMouse) => {
            this.autoHover = true;
            this.onMouseEnterSpin(ev);
        }, this)
        this.m_ui.AutoBtn.on(NodeEventType.MOUSE_LEAVE, (ev: EventMouse) => {
            this.autoHover = false;
            this.onMouseLeaveSpin(ev);
        }, this)

        this.m_ui.button_manual.getComponent(sp.Skeleton).setCompleteListener((t) => {
            if (t.animation.name == "anniu_click") {
                if (this.state == GameState.roll) {
                    this.m_ui.button_manual.getComponent(sp.Skeleton).setAnimation(0, "rolate", true)
                }
            }
        })
        this.m_ui.click_quick_stop_effect.getComponent(sp.Skeleton).setCompleteListener((t) => {
            this.m_ui.click_quick_stop_effect.active = false;
        })

    }

    openPayTable() {
        this.m_ui.PayTableBtn.getComponent(Button).enabled = false;
        this.scheduleOnce(() => {
            UIManager.showView(EViewNames.UIpeifubiao, EUILayer.Popup)
            this.m_ui.PayTableBtn.getComponent(Button).enabled = true;
        }, window["secondaryMenu"].responseTime);
    }

    openRule() {
        this.m_ui.RuleTableBtn.getComponent(Button).enabled = false;
        this.scheduleOnce(() => {
            UIManager.showView(EViewNames.UIRule, EUILayer.Popup)
            this.m_ui.RuleTableBtn.getComponent(Button).enabled = true;
        }, window["secondaryMenu"].responseTime);
    }

    private initNetEvent() {
        EventCenter.getInstance().listen(GameEvent.game_start_roll, this.onStartRoll, this);
        EventCenter.getInstance().listen(GameEvent.key_down_space, this.onClickSpace, this);
        EventCenter.getInstance().listen(GameEvent.key_pressing_space, this.onClickSpace, this);
        EventCenter.getInstance().listen(BaseEvent.click_mouse, this.onClickMouse, this)
        EventCenter.getInstance().listen(GameEvent.update_game_state, this.onUpdateState, this);
        EventCenter.getInstance().listen(GameEvent.game_start_stop_roll, this.onStartStopRoll, this);
        EventCenter.getInstance().listen(GameEvent.game_roll_complete, this.onRollComplete, this);
        EventCenter.getInstance().listen(GameEvent.game_show_award_result, this.onShowAwardResult, this);
        EventCenter.getInstance().listen(GameEvent.game_clear_award_result, this.onClearAwardResultInfo, this);
        EventCenter.getInstance().listen(GameEvent.click_element, this.onShowElementRateInfo, this);
        EventCenter.getInstance().listen(GameEvent.close_bigreward, this.onCloseBigAward, this);
        EventCenter.getInstance().listen(GameEvent.update_game_change_bet_amount, this.onChangeBetAmount, this);
        EventCenter.getInstance().listen(GameEvent.game_update_player_blance, this.onUpdatePlayerBlance, this);
        EventCenter.getInstance().listen(GameEvent.game_switch_fast, this.onSwitchFast, this);
        EventCenter.getInstance().listen(GameEvent.game_update_open_auto_roll, this.onUpdateOpenAutoRoll, this);
        EventCenter.getInstance().listen(GameEvent.game_axis_ready_roll_end, this.onGameAxisReadyRoll, this);
        EventCenter.getInstance().listen(GameEvent.chang_black_mask, this.onChangeBlackMask, this);
        EventCenter.getInstance().listen(GameEvent.game_update_free_num, this.setFreeNum, this);
        EventCenter.getInstance().listen(GameEvent.game_show_long_juan, this.playLongJuanEffect, this);

    }

    async onCloseBigAward() {
        UIManager.closeView(EViewNames.ResultBigAward);
        await this.winNumAnimation.showWin(GameCtrl.getIns().getModel().getBetData().prize, true);
        this.playerLastResultAward(true)
    }

    /**初始化上局中奖结果 */
    initLastAwardResult(data: TRound) {
        warn("初始化上局中奖结果", data);
        if (data) {
            this.resultAwardUIInfo = data;
            for (let index = 0; index < this.elementNodes.length; index++) {
                const element = this.elementNodes[index];
                ObjPoolCom.objPoolMgr.delElement(element)
            }
        }
    }

    showWinIcon(data: ResultAwardUIInfo) {
        return new Promise<void>((resolve, reject) => {
            if (data.win_pos_list.length > 0) {
                GameAudio.eliminate();
                GameAudio.iconWin();
                let count = 0, total = 0;
                this.elementCtrl.rollAxisList.forEach((com, idx) => {
                    com.elementList.forEach((child) => {
                        if (child.id == TItemtype.ITEM_TYPE_SCATTER) {
                            child.toTopEffectNode();
                        }
                        if (data.win_pos_list.indexOf(child.serverIdx) > -1) {
                            child.playWinEffect(() => {
                                total++;
                                log("playWinEffectCount", count);
                                if (total == data.win_pos_list.length) {
                                    this.onChangeBlackMask(false);
                                }
                            }, () => {
                                count++;
                                if (count == data.win_pos_list.length) {
                                    resolve();
                                }
                            });
                        }
                    });
                });
            } else {
                resolve();
            }
        })
    }

    onChangeBlackMask(state: boolean, index?: number) {
        if (state) {
            this.elementCtrl.maskNodeList.forEach((op, idx) => {
                if (index !== undefined) {
                    if (index == idx) {
                        Tween.stopAllByTarget(op);
                        tween(op)
                            .to(0.1, { opacity: 170 })
                            .start();
                    }
                } else {
                    Tween.stopAllByTarget(op);
                    tween(op)
                        .to(0.1, { opacity: 170 })
                        .start();
                }
            });
        } else {
            this.elementCtrl.maskNodeList.forEach((op, idx) => {
                if (index !== undefined) {
                    if (index == idx) {
                        tween(op)
                            .to(0.5, { opacity: 0 })
                            .start();
                    }
                } else {
                    tween(op)
                        .to(0.5, { opacity: 0 })
                        .start();
                }
            });
        }
    }

    /**掉落动画 */
    playFallDown(fillingMsg: number[][]) {
        return new Promise<void>((resolve, reject) => {
            let delayTime = 0, count = 0;
            let needNum = fillingMsg.length - 1;
            for (let i = needNum; i >= 0; i--) {
                let container = this.elementCtrl.rollAxisList[i];
                let idx = i;
                this.scheduleOnce(() => {
                    warn("掉落动画", fillingMsg);
                    container.getComponent(RollAxisCom).startFallDown(fillingMsg[idx], () => {
                        warn("掉落回调", count, needNum);
                        if (count == needNum) {
                            resolve();
                        }
                        count++;
                    });
                }, delayTime)
                if (!GameCtrl.getIns().curFast) {
                    delayTime += GameConst.fallDownInterval;
                }
            }
        })
    }

    /**旋转转盘 */
    async spinningTurntable(specify: number) {
        GameAudio.wheelRoll();
        await this.wheel.getComponent(GameWheel).rotate(specify);
        GameAudio.winWheelRate(specify);
    }

    /**恢复转盘 */
    recoveryCarousel() {
        GameAudio.wheelRecover();
        this.wheel.getComponent(GameWheel).recover();
    }

    async onShowAwardResult(data: ResultAwardUIInfo, isWldd: boolean = false) {
        warn("onShowAwardResult", data);
        this.resultAwardUIInfo = data;
        if (data?.prize_list?.length > 0) {
            let winPosList = [];
            data.prize_list.forEach((list) => {
                let maxRow = GameConst.MaxRow - 2;
                list.win_pos_list.forEach((val, idx) => {
                    let row = maxRow - (val % maxRow) - 1;
                    let col = Math.floor(val / maxRow);
                    list.win_pos_list[idx] = col * maxRow + row;
                });
                winPosList = winPosList.concat(list.win_pos_list);
            });
            winPosList = Array.from(new Set(winPosList));
            winPosList.sort((a, b) => {
                return a - b;
            });
            data.win_pos_list = winPosList;
            warn("中奖数组3", winPosList)

            let fillList = [];
            data.dyadic_list.forEach((list, idx) => {
                if (list.list && list.list.length >= 2) {
                    // let arr = list.list.reverse();
                    fillList[idx] = [list.list[list.list.length - 1], ...list.list.slice(0, list.list.length - 2)];
                }
            });

            this.onChangeBlackMask(true);
            this.winNumAnimation.showWin(data.win, false);
            this.playAddWinAnimation()//播放加钱奖金
            await this.showWinIcon(data);
            this.spinningTurntable(data.multi_time + 1);
            await this.playFallDown(fillList);
            warn("下一轮中奖结果");
            GameCtrl.getIns().showResultAward();
            this.checkGameData();
            if (GameCtrl.getIns().getModel().isFree()) {
                GameCtrl.getIns().getModel().isShowLongJuan = true;
            }
        } else {
            log("playerLastResultAward", data);
            let totalWin = GameCtrl.getIns().getModel().getBetData().prize;
            let level = await GameCtrl.getIns().showBigWin(totalWin);
            log("bigWinLevel", level)
            if (level == 0) {
                if (totalWin > 0) {
                    await this.winNumAnimation.showWin(totalWin, true);
                }
                log("winEnd")
                this.playerLastResultAward(totalWin > 0 || GameCtrl.getIns().autoRollCnt > 0);
            }
        }
    }

    /**百搭抖动 */
    versatileJitter() {
        this.elementCtrl.rollAxisList.forEach(axis => {
            axis.elementList.forEach((ele) => {
                if (ele.serverIdx > 0 && ele.serverIdx < Infinity) {
                    if (ele.id == TItemtype.ITEM_TYPE_WILD) {
                        ele.spine.active = true;
                        ele.spine.children.forEach((node, idx) => {
                            if (idx == 0) {
                                node.active = true;
                                let sps = node.getComponent(sp.Skeleton);
                                sps.setAnimation(0, "spawn", false);
                                sps.setCompleteListener(() => {
                                    sps.setAnimation(0, "idle", true);
                                    sps.setCompleteListener(null);
                                })
                            } else {
                                node.active = false;
                            }
                        });
                    }
                }
            });
        });
    }

    checkGameData() {
        let arr = [], arr1: any[][] = [];
        for (let i = 0; i < this.elementCtrl.rollAxisList.length; i++) {
            let axis = this.elementCtrl.rollAxisList[i];
            arr1.push([])
            for (let j = 0; j < axis.elementList.length; j++) {
                let ele = axis.elementList[j];
                arr1[i].push({id: ele.id, posIdx: ele.posIdx, serverIdx: ele.serverIdx});
                if (ele.serverIdx > -1 && ele.serverIdx < Infinity && ele.isRollEnd) {
                    let idx = Math.floor(ele.serverIdx / 4) * 4 + (3 - ele.serverIdx % 4);
                    arr[idx] = ele.id;
                }
            }
            arr1[i].reverse();
        }
        // log(JSON.stringify(arr1));
        // log("对比");
        // log(JSON.stringify(arr));
        // log(JSON.stringify(GameCtrl.getIns().getModel().getBetData().result.round_list[GameCtrl.getIns().getModel().roundNum - 1].item_type_list));
        // log("对比")
        // if (JSON.stringify(arr) != JSON.stringify(GameCtrl.getIns().getModel().getBetData().result.round_list[GameCtrl.getIns().getModel().roundNum - 1].item_type_list)) {
        //     warn("nosame")
        //     // debugger
        // }
    }

    playScatterWin() {
        return new Promise<void>((resolve, reject) => {
            GameAudio.winFree();
            let count = 0, total = 0;
            this.elementCtrl.rollAxisList.forEach((axis) => {
                axis.elementList.forEach((com) => {
                    if (com.id == TItemtype.ITEM_TYPE_SCATTER) {
                        count++;
                        com.playScatterWin(() => {
                            total++;
                            if (count == total) {
                                resolve();
                            }
                        });
                    }
                });
            });
        })
    }

    async enterFree() {
        await this.playScatterWin();
        GameAudio.intoFree();
        let freeNum = GameCtrl.getIns().getModel().getBetData().free_total_times;
        this.m_ui.free_start_box.active = true;
        this.m_ui.free_start_box.getComponent(UIOpacity).opacity = 255;
        this.m_ui.free_in_bg.getComponent(UIOpacity).opacity = 0;
        this.m_ui.button_start.active = false;
        this.m_ui.free_in_bg.setScale(1.2, 1.2, 1.2);
        this.m_ui.button_start.setScale(0, 0, 0);
        this.m_ui.win_free_times_num.getComponent(Label).string = freeNum.toString();
        tween(this.m_ui.free_in_bg.getComponent(UIOpacity)).to(0.5, { opacity: 255 }).call(() => {
            this.changeEnterFreeBg(freeNum,false,false);

            this.m_ui.button_start.active = true;
            tween(this.m_ui.free_in_bg).to(6, { scale: v3(1, 1, 1) }).call(() => {
                // tween(this.m_ui.free_start_box.getComponent(UIOpacity)).to(0.5, { opacity: 0 }).call(() => {
                //     this.resumeSpin();
                // }).start();
                this.onCloseFreeIn();
            }).start();
        }).start();
        let t = new Date().getTime(), total = 1300;
        this.m_ui.free_load_num.getComponent(Label).string = "0";
        tween(this.m_ui.free_load_num).delay(0.001).call(() => {
            let now = new Date().getTime();
            let c = (now - t) / total;
            if (c > 1) {
                c = 1;
                Tween.stopAllByTarget(this.m_ui.free_load_num);
            }
            this.m_ui.free_load_num.getComponent(Label).string = Math.floor(c * 100).toString();
        }).union().repeatForever().start();
        let freeSp = this.m_ui.free_start.getComponent(sp.Skeleton);
        freeSp.setAnimation(0, "start_in", false);
        freeSp.setCompleteListener(() => {
            freeSp.setAnimation(0, "start_idle", true);
            freeSp.setCompleteListener(null);

            let buttonSp = this.m_ui.button_start.getComponent(sp.Skeleton);
            buttonSp.setToSetupPose();
            buttonSp.setAnimation(0, "button_in", false);
            this.m_ui.button_start.setScale(1, 1, 1);
            this.m_ui.free_load_num.getComponent(Label).string = "";
            buttonSp.setCompleteListener(() => {
                buttonSp.setAnimation(0, "button_idle", false);
                buttonSp.setCompleteListener(null);

                EventCenter.getInstance().listen(GameEvent.key_down_space, this.onCloseFreeIn, this);
                EventCenter.getInstance().listen(GameEvent.key_pressing_space, this.onCloseFreeIn, this);
            })
        })
        GameCtrl.getIns().getModel().isShowLongJuan = true;
    }

    /**接续免费 */
    connectFreeMode(freeNum: number, mul: number, isIntoFree: boolean) {
        warn("wwww", mul, isIntoFree);
        if (isIntoFree) {
            GameCtrl.getIns().getModel().mode = GameMode.into_free;
            this.wheel.getComponent(GameWheel).jumpSpecifyLocation(1);
        } else {
            GameCtrl.getIns().getModel().mode = GameMode.free;
            this.wheel.getComponent(GameWheel).jumpSpecifyLocation(mul);
        }
        this.changeEnterFreeBg(freeNum, true);
        this.scheduleOnce(() => {
            this.resumeSpin();
        }, 0.5);
    }

    setFreeNum(num: number, isRun: boolean = false) {
        if (!isRun) {
            if (num == 0) {
                this.m_ui.free_last.active = true;
                this.m_ui.remain_times.active = false;
                this.m_ui.free_times_num.active = false;
            } else {
                this.m_ui.free_last.active = false;
                this.m_ui.remain_times.active = true;
                this.m_ui.free_times_num.active = true;
            }
            this.m_ui.free_times_num.getComponent(Label).string = num.toString();
            if(num<0){
                console.log("setFreeNum",num);
            }
        }
    }

    freeAgain(freeNum: number) {
        this.onChangeBlackMask(true);
        this.m_ui.free_again.active = true;
        this.m_ui.free_again_num.getComponent(Label).string = freeNum.toString();
        this.m_ui.free_again_num.getComponent(UIOpacity).opacity = 0;
        this.m_ui.free_last.active = false;
        this.m_ui.remain_times.active = true;
        this.m_ui.free_times_num.active = true;
        tween(this.m_ui.free_again_num.getComponent(UIOpacity)).to(0.3, { opacity: 255 }).start();
        let freeSp = this.m_ui.free_again.getComponent(sp.Skeleton);
        freeSp.setToSetupPose();
        freeSp.setAnimation(0, "animation1", false);
        freeSp.setCompleteListener(() => {
            freeSp.setAnimation(0, "animation2", true);
            freeSp.setCompleteListener(null);
            tween(this.m_ui.free_times_num).by(0.05, { position: v3(0, -10, 0) }).by(0.05, { position: v3(0, 10, 0) }).call(() => {
                this.m_ui.mf_guan.active = true;
                let spS = this.m_ui.mf_guan.getComponent(sp.Skeleton);
                spS.setToSetupPose();
                spS.setAnimation(0, "animation", false);
                spS.setCompleteListener(() => {
                    this.m_ui.mf_guan.active = false;
                });
                let num = Number(this.m_ui.free_times_num.getComponent(Label).string) + 1;
                if (num == GameCtrl.getIns().getModel().getBetData().free_remain_times) {
                    Tween.stopAllByTarget(this.m_ui.free_times_num);
                    freeSp.setAnimation(0, "animation3", false);
                    tween(this.m_ui.free_again_num.getComponent(UIOpacity)).to(0.3, { opacity: 0 }).start();
                    freeSp.setCompleteListener(() => {
                        freeSp.setCompleteListener(null);
                        this.onChangeBlackMask(false);
                        this.scheduleOnce(() => {
                            this.resumeSpin();
                        }, 0.5);
                    })
                }
                this.m_ui.free_times_num.getComponent(Label).string = num.toString();
            }).delay(0.1).union().repeatForever().start();
        })
    }

    changeEnterFreeBg(freeNum: number, skipJump?: boolean,showCoinInfo:boolean=true) {
        log("changeEnterFreeBg", freeNum);
        !skipJump && this.wheel.getComponent(GameWheel).jumpSpecifyLocation(1);
        this.m_ui.SpinBtn.active = false;
        this.m_ui.free_candle.active = true;
        this.m_ui.AutoBtn.active = false;
        this.m_ui.free_bg.active = true;
        this.m_ui.remain_times.active = true;
        this.m_ui.free_last.active = false;
        this.setFreeNum(freeNum);
        this.m_ui.candle_light.getComponent(sp.Skeleton).setAnimation(0, "free_mode", true);
        this.m_ui.Btns.active = false;
        this.m_ui.free_slot.active = true;
        this.m_ui.top_bg.active = true;
        this.m_ui.wheelSp.getComponent(sp.Skeleton).setAnimation(0, "free_wheel", true);
        if(showCoinInfo)this.changeCoinInfoLocal(true);
    }

    recoverNormalBg() {
        this.wheel.getComponent(GameWheel).jumpSpecifyLocation(1);
        this.m_ui.SpinBtn.active = false;
        this.onUpdateOpenAutoRoll(GameCtrl.getIns().autoRollCnt > 0, GameCtrl.getIns().autoRollCnt);
        this.m_ui.free_candle.active = false;
        this.m_ui.free_bg.active = false;
        this.m_ui.remain_times.active = false;
        this.m_ui.free_last.active = false;
        this.m_ui.candle_light.getComponent(sp.Skeleton).setAnimation(0, "normal_mode", true);
        this.m_ui.Btns.active = true;
        this.m_ui.free_slot.active = false;
        this.m_ui.top_bg.active = false;
        this.m_ui.wheelSp.getComponent(sp.Skeleton).setAnimation(0, "normal_wheel", true);
        this.changeCoinInfoLocal(false);
    }

    changeCoinInfoLocal(isFree: boolean) {
        if (isFree) {
            this.m_ui.CoinInfo.setParent(this.m_ui.coin_info_box);
            this.m_ui.CoinInfo.setPosition(0, 0, 0);
            this.m_ui.CoinInfo.children.forEach((child) => {
                let button = child.getComponent(Button);
                button.interactable = true;
                button.enabled = false;
            });
        } else {
            this.m_ui.CoinInfo.setParent(this.m_ui.Btns);
            this.m_ui.CoinInfo.setPosition(0, 137.416, 0);
            this.m_ui.CoinInfo.children.forEach((child) => {
                child.getComponent(Button).enabled = true;
            });
        }
    }

    onCloseFreeIn() {
        EventCenter.getInstance().remove(GameEvent.key_down_space, this.onCloseFreeIn, this);
        EventCenter.getInstance().remove(GameEvent.key_pressing_space, this.onCloseFreeIn, this);

        GameAudio.freeAward();
        this.m_ui.button_start.getComponent(Button).interactable = false;
        log("onCloseFreeIn")
        Tween.stopAllByTarget(this.m_ui.button_start);
        Tween.stopAllByTarget(this.m_ui.free_start_box);
        Tween.stopAllByTarget(this.m_ui.free_in_bg);
        tween(this.m_ui.button_start).to(0.2, { scale: v3(0, 0, 0) }).call(() => {
            tween(this.m_ui.free_start_box.getComponent(UIOpacity)).to(0.5, { opacity: 0 }).call(() => {
                this.resumeSpin();
                this.m_ui.free_start_box.active = false;
                this.changeCoinInfoLocal(true);
                this.m_ui.button_start.getComponent(Button).interactable = true;
                GameAudio.switchBgm(BgmType.free);
            }).start();
        }).start();
    }

    outFreeMode(win: number) {
        this.m_ui.free_start_box.active = false;
        this.m_ui.free_end_box.active = true;
        this.m_ui.button_end.getComponent(Button).interactable = false;
        this.m_ui.button_end.setScale(0, 0, 0);
        this.m_ui.free_end_box.getComponent(Button).interactable = false;
        this.m_ui.free_end_box.getComponent(UIOpacity).opacity = 255;
        this.m_ui.free_end_times_num.getComponent(Label).string = GameCtrl.getIns().getModel().getBetData().free_total_times.toString();
        this.m_ui.win_free_total_times_num.getComponent(Label).string = "0";
        this.m_ui.free_label_content.setScale(0, 0, 0);
        this.m_ui.free_end.getComponent(UIOpacity).opacity = 0;
        let bgSp = this.m_ui.free_end_light.getComponent(sp.Skeleton);
        bgSp.setAnimation(0, "end_in", false);
        let spS = this.m_ui.free_end.getComponent(sp.Skeleton);
        spS.setAnimation(0, "end_idle", true);

        tween(this.m_ui.free_end.getComponent(UIOpacity)).to(0.5, { opacity: 255 }).call(() => {

            this.scheduleOnce(() => {
                EventCenter.getInstance().listen(GameEvent.key_down_space, this.onClickFreeEnd, this);
                EventCenter.getInstance().listen(GameEvent.key_pressing_space, this.onClickFreeEnd, this);

                this.m_ui.free_end_box.getComponent(Button).interactable = true;
            }, 1);

            this.m_ui.win_free_times_num.getComponent(Label).string = "0";
            this.recoverNormalBg();

            tween(this.m_ui.free_label_content).to(0.2, { scale: v3(1, 1, 1) }).start();

            GameAudio.freeSettlement();
            CocosUtil.runScore(this.m_ui.win_free_total_times_num.getComponent(Label), 4, win, 0).then(() => {
                this.onClickFreeEnd();
            })

            // spS.setCompleteListener(() => {
            //     spS.setAnimation(0, "end_idle", true);
            //     spS.setCompleteListener(null);
            GameCtrl.getIns().getModel().isShowLongJuan = false;
            // });
        }).start();
    }

    outFreeRunEnd() {
        EventCenter.getInstance().remove(GameEvent.key_down_space, this.onClickFreeEnd, this);
        EventCenter.getInstance().remove(GameEvent.key_pressing_space, this.onClickFreeEnd, this);

        GameAudio.freeSettlementEnd();
        let bgSp = this.m_ui.free_end_light.getComponent(sp.Skeleton);
        bgSp.setAnimation(0, "end_end", false);
        Tween.stopAllByTarget(this.m_ui.win_free_total_times_num);
        this.m_ui.free_end_box.getComponent(Button).interactable = false;
        this.m_ui.button_end.getComponent(Button).interactable = true;
        this.m_ui.win_free_total_times_num.getComponent(Label).string = new BigNumber(GameCtrl.getIns().getModel().getBetData().free_game_total_win).div(GameConst.BeseGold).toFixed(2);
        tween(this.m_ui.win_free_total_times_num).to(0.1, { scale: v3(1.2, 1.2, 1.2) }).to(0.1, { scale: v3(1, 1, 1) }).call(() => {
            this.m_ui.button_end.setScale(1, 1, 1);
            let spS = this.m_ui.button_end.getComponent(sp.Skeleton);
            spS.setToSetupPose();
            spS.setAnimation(0, "button_in", false);
            spS.setCompleteListener(() => {
                spS.setAnimation(0, "button_idle", true);
                spS.setCompleteListener(null);
            })

            tween(this.m_ui.free_end_box).delay(5).call(() => {
                this.onClickFreeButton();
            }).start();

            EventCenter.getInstance().listen(GameEvent.key_down_space, this.onClickFreeButton, this);
            EventCenter.getInstance().listen(GameEvent.key_pressing_space, this.onClickFreeButton, this);
        }).start();
    }

    onClickFreeButton() {
        EventCenter.getInstance().remove(GameEvent.key_down_space, this.onClickFreeButton, this);
        EventCenter.getInstance().remove(GameEvent.key_pressing_space, this.onClickFreeButton, this);

        GameAudio.freeAward();
        this.m_ui.free_end_box.getComponent(Button).interactable = false;
        this.m_ui.button_end.getComponent(Button).interactable = false;
        Tween.stopAllByTarget(this.m_ui.free_end_box);
        tween(this.m_ui.free_end_box.getComponent(UIOpacity)).to(0.5, { opacity: 0 }).call(async () => {
            this.m_ui.free_end_box.getComponent(Button).interactable = true;
            this.m_ui.free_start_box.active = false;
            this.m_ui.free_end_box.active = false;
            this.changeCoinInfoLocal(false);
            this.m_ui.button_end.getComponent(Button).interactable = true;
            this.m_ui.free_end_box.getComponent(Button).interactable = true;
            GameAudio.switchBgm(BgmType.normal);
            this.winNumAnimation.showWin(this.getComponent(GameUI).winAmount, true, false);
            await CocosUtil.wait(0.5);
            GameCtrl.getIns().getModel().mode = GameMode.normal;
            this.resumeSpin();
        }).start();
    }

    onClickFreeEnd() {
        this.outFreeRunEnd();
    }

    /**播放龙卷特效 */
    playLongJuanEffect() {
        GameAudio.longJuan();
        this.m_ui.plate_light.active = true;
        this.m_ui.longjuan_light.active = true;
        let pSp = this.m_ui.plate_light.getComponent(sp.Skeleton);
        let lSp = this.m_ui.longjuan_light.getComponent(sp.Skeleton);
        pSp.setToSetupPose();
        lSp.setToSetupPose();
        pSp.setAnimation(0, "animation", false);
        pSp.timeScale = 0.8;
        lSp.setAnimation(0, "animation", false);
        lSp.timeScale = 0.8;
        this.onChangeBlackMask(true, 0);
        this.onChangeBlackMask(true, 1);
        this.onChangeBlackMask(true, 3);
        this.onChangeBlackMask(true, 4);
        this.scheduleOnce(() => {
            for (let i = 0; i < this.m_ui.longjuan_light.children.length; i++) {
                let di = this.m_ui.longjuan_light.children[i];
                di.active = true;
                di.setScale(2, 2, 2);
                di.getComponent(UIOpacity).opacity = 0;
                tween(di).delay(0.2 * i).to(0.1, { scale: v3(1, 1, 1) }, {
                    onUpdate(target, ratio) {
                        di.setScale(2 - ratio, 2 - ratio, 2 - ratio);
                        di.getComponent(UIOpacity).opacity = 100 + ratio * 150;
                    },
                }).delay(0.1).call(() => {
                    tween(di.getComponent(UIOpacity)).to(0.2, { opacity: 0 }).call(() => {
                        di.active = false;
                    }).start();
                }).start();
            }
        }, 1.2)
        lSp.setCompleteListener(() => {
            this.onChangeBlackMask(false);
            lSp.setCompleteListener(null);
            GameCtrl.getIns().getModel().isShowLongJuan = false;
            this.elementCtrl.canStop = true;
            warn("龙卷结束", this.elementCtrl.resultData);
            this.elementCtrl.resultData && this.elementCtrl.stopRoll();
        });
    }

    onChangeBetAmount(amount: number, isShowTip: boolean = true) {
        this.getComponent(GameUI).setBetAmount(amount, isShowTip);
        let data = GameCtrl.getIns().getBetAmountState(amount)
        if (data.isMax) {
            isShowTip && UIManager.toast("最大投注")
        }
        if (data.isMin) {
            isShowTip && UIManager.toast("最小投注")
        }
        this.updateChangeBetBtnState(data)
    }

    /**更新2个按钮状态 */
    updateChangeBetBtnState(data: { isMax: boolean, isMin: boolean }) {
        if (data.isMin) {
            this.changeBtnStyle(this.m_ui.MinusBtn, false);
            this.m_ui.MinusBtn.getComponent(Button).interactable = false;
        } else {
            this.changeBtnStyle(this.m_ui.MinusBtn, true);
            this.m_ui.MinusBtn.getComponent(Button).interactable = true;
        }
        if (data.isMax) {
            this.changeBtnStyle(this.m_ui.AddBtn, false);
            this.m_ui.AddBtn.getComponent(Button).interactable = false;
        } else {
            this.changeBtnStyle(this.m_ui.AddBtn, true);
            this.m_ui.AddBtn.getComponent(Button).interactable = true;
        }
    }

    onUpdatePlayerBlance(amount: number) {
        this.getComponent(GameUI).setBalanceAmount(amount);
    }

    private setFastOnOff(isFast: boolean) {
        let fast_tip = this.m_ui.fast_tip;
        fast_tip.active = true;
        let sp: Node
        if (isFast) {
            sp = fast_tip.getChildByName("faston")
            sp.active = true;
            fast_tip.getChildByName("fastoff").active = false;
            fast_tip.getChildByName("Label").getComponent(Label).string = "极速旋转已开启";
        } else {
            sp = fast_tip.getChildByName("fastoff")
            fast_tip.getChildByName("faston").active = false;
            sp.active = true;
            fast_tip.getChildByName("Label").getComponent(Label).string = "极速旋转已关闭";
        }

        sp.getComponent(Sprite).enabled = false;
        Tween.stopAllByTarget(fast_tip);
        fast_tip.scale = v3(1.1, 1.1, 1);
        tween(fast_tip)
            .to(0.1, { scale: v3(1.3, 1.3, 1) })
            .to(0.1, { scale: v3(1.1, 1.1, 1) })
            .call(() => {
                sp.getComponent(Sprite).enabled = true;
            })
            .delay(3)
            .call(() => {
                fast_tip.active = false;
            })
            .start();
    }

    /**播放最后的结算动画 */
    async playerLastResultAward(isDelay: boolean) {
        this.curMode = GameMode.normal;
        // GameAudio.switchBgm(BgmType.normal);
        this.versatileJitter();
        this.onUpdateState(GameState.delay)
        if (isDelay) {
            await CocosUtil.wait(0.7)
        } else {
            await CocosUtil.wait(0.1)
        }
        if (this.state == GameState.delay) {//防止按了空格键 重新旋转改变了状态
            if (GameCtrl.getIns().getModel().isIntoFree()) {
                this.enterFree();
            } else if (GameCtrl.getIns().getModel().isFreeAgain()) {
                this.freeAgain(GameCtrl.getIns().getModel().getBetData().result.free_play);
            } else if (GameCtrl.getIns().getModel().isLastFree()) {
                console.log("playerLastResultAward isLastFree");
                this.outFreeMode(new BigNumber(GameCtrl.getIns().getModel().getBetData().free_game_total_win).div(GameConst.BeseGold).toNumber());
            } else {
                this.resumeSpin();
            }
        }
    }

    /**恢复旋转 */
    async resumeSpin() {
        this.onUpdateState(GameState.wait)
        GameCtrl.getIns().checkAutoRoll()
        this.elementCtrl.resultData = null;
    }

    playAddWinAnimation() {
        log("playAddWinAnimation", this.resultAwardUIInfo);
        this.getComponent(GameUI).playAddWinAnimation(new BigNumber(this.getComponent(GameUI).winAmount).plus(this.resultAwardUIInfo.win).toNumber())
        this.getComponent(GameUI).playAddBlanceAnimation(this.resultAwardUIInfo.balance)
    }

    onClearAwardResultInfo() {
        this.isCurRoundPlayWdElementAudio = false;
        !GameCtrl.getIns().getModel().isFree() && !GameCtrl.getIns().getModel().isIntoFree() && this.getComponent(GameUI).setWinAmount(0)
        this.effectLayer.active = false;
        this.elementCtrl.restRandomElementList();
        this.winNumAnimation.hideWin()
    }

    /**显示元素赔率提示 */
    onShowElementRateInfo(idx: number, id: number, node: Node) {
        if (this.state != GameState.wait) {
            return;
        }
        this.clickElementRateTip.showTip(idx, id, node)
        GameAudio.clickShowRateTip()
    }

    /**滚动完成 */
    onRollComplete() {
        warn("滚动完成");
        AudioManager.inst.stopMusic();
        GameCtrl.getIns().showResultAward()
        this.checkGameData();
    }

    async onStartStopRoll(info: { data: any }) {
        let datas = info.data
        warn("onStartStopRoll", datas);
        this.elementCtrl.isDraws(datas);
        this.elementCtrl.setAxisDraws();
        this.elementCtrl.stopRoll()
    }

    onClickMouse(name: string) {
        if (name != "btn_spine") {
            GameAudio.clickSystem();
        }
    }

    onStartRoll(isFast: boolean) {
        this.clickElementRateTip.hideTip();
        this.elementCtrl.startRoll(isFast);
        !GameCtrl.getIns().getModel().isIntoFree() && !GameCtrl.getIns().getModel().isFree() && this.recoveryCarousel();
        GameAudio.juanzhouRoll()
    }

    enabledButton(button: Button, enabled: boolean) {
        button.interactable = enabled;
        CocosUtil.setNodeOpacity(button.node, enabled ? 255 : 110)
    }

    onUpdateState(state: GameState) {
        if (this.state == state) {
            return;
        }
        warn("当前游戏状态", GameState[state]);
        let waitState = state == GameState.wait && GameCtrl.getIns().autoRollCnt <= 0;
        this.m_ui.StartAutoBtn.getComponent(Button).interactable = waitState;
        // if (this.m_ui.StartAutoBtn.getComponent(Button).interactable) {
        //     this.m_ui.StartAutoBtn.getChildByName("Can").active = true;
        //     this.m_ui.StartAutoBtn.getChildByName("Not").active = false;
        // } else {
        //     this.m_ui.StartAutoBtn.getChildByName("Can").active = false;
        //     this.m_ui.StartAutoBtn.getChildByName("Not").active = true;
        // }
        this.m_ui.MinusBtn.getComponent(Button).enabled = waitState
        this.m_ui.AddBtn.getComponent(Button).enabled = waitState
        this.m_ui.MoreBtn.getComponent(Button).enabled = waitState
        this.changeBtnStyle(this.m_ui.MinusBtn, waitState);
        this.changeBtnStyle(this.m_ui.AddBtn, waitState);
        this.changeBtnStyle(this.m_ui.MoreBtn, waitState);
        if (state == GameState.wait && (this.spinHover || this.autoHover && !this.m_ui.AutoBtn.active)) {
            let light = this.m_ui.button_manual.getChildByName("button_light");
            light.active = true;
            light.getComponent(sp.Skeleton).setToSetupPose()
            light.getComponent(sp.Skeleton).setAnimation(0, "manual", true);
        }

        this.m_ui.SpinBtn.getComponent(Button).interactable = (state == GameState.wait || state == GameState.roll || state == GameState.start_stop_roll)

        if (GameCtrl.getIns().getModel().isFree()) {
            this.m_ui.SettingBetBtn.getComponent(Button).enabled = false
            this.m_ui.BanlanceBtn.getComponent(Button).enabled = false
            this.m_ui.HistoryBtn2.getComponent(Button).enabled = false
        } else {
            this.m_ui.SettingBetBtn.getComponent(Button).enabled = state == GameState.wait
            this.m_ui.BanlanceBtn.getComponent(Button).enabled = state == GameState.wait
            this.m_ui.HistoryBtn2.getComponent(Button).enabled = state == GameState.wait
        }
        switch (state) {
            case GameState.wait:
                let amount = GameCtrl.getIns().getModel().getCurBetAmount()
                let data = GameCtrl.getIns().getBetAmountState(amount);
                this.updateChangeBetBtnState(data);
                this.getComponent(GameUI).setLabelColor(true)
                this.m_ui.button_manual.getComponent(sp.Skeleton).setAnimation(0, "anniu_idle", true)
                break;
            case GameState.roll:
                this.getComponent(GameUI).setLabelColor(false)
                break;
            case GameState.start_stop_roll:
                this.elementCtrl.canStop = false;
                break;
            case GameState.show_result:
                this.m_ui.button_manual.getComponent(sp.Skeleton).setAnimation(0, "stop", true)
                break;
            case GameState.cancel_roll:
                this.m_ui.button_manual.getComponent(sp.Skeleton).setAnimation(0, "click_speed", false)
                break;
            default:
                break;
        }
        this.state = state;
        this.spinPointer();
    }

    onSpin() {
        log("onSpin");
        if (this.state == GameState.wait) {
            GameAudio.startSpin()
            this.elementCtrl.resultData = null;
            this.m_ui.button_manual.getComponent(sp.Skeleton).setAnimation(0, "anniu_click", false)
            this.m_ui.button_manual.getChildByName("button_light").active = false;
            this.spinColor(false);
            GameCtrl.getIns().reqRoll();
        } else if (this.state == GameState.roll) {
            GameCtrl.getIns().cancelDelayShowResult()
            this.spinColor(true);
        } else if (this.state == GameState.start_stop_roll) {
            GameCtrl.getIns().curQuickFast = true;
            this.spinColor(true);
        }
    }

    onClickSpace() {
        let popCount = 0;
        for (const key in EUILayer) {
            let num = Number(key);
            if (!isNaN(num)) {
                if (num != 0 && num != 4) {
                    popCount += UIManager.getLayer(num).children.length;
                }
            }
        }
        if (popCount > 0 || GameCtrl.getIns().getModel().isFree() || GameCtrl.getIns().getModel().isIntoFree() || this.m_ui.Menu2.active) {
            return;
        }
        if (this.state == GameState.delay && this.m_ui.AutoBtn.active) {
            GameCtrl.getIns().cancelAutoRoll()
            return;
        }
        if (this.state == GameState.wait) {
            if (this.m_ui.AutoBtn.active) {
                GameCtrl.getIns().cancelAutoRoll()
            } else {
                GameAudio.startSpin()
                this.m_ui.button_manual.getComponent(sp.Skeleton).setAnimation(0, "anniu_click", false)
                this.m_ui.button_manual.getChildByName("button_light").active = false;
                GameCtrl.getIns().reqRoll();
            }
            this.spinColor(false);
        } else if (this.state == GameState.roll) {
            GameCtrl.getIns().cancelDelayShowResult()
            this.spinColor(true);
        } else if (this.state == GameState.start_stop_roll) {
            GameCtrl.getIns().curQuickFast = true;
            this.spinColor(true);
        }
    }

    onClickFast() {
        GameCtrl.getIns().switchFast(!GameCtrl.getIns().isFast)
        GameAudio.clickSystem()
    }

    onOpenUIAuto() {
        warn("自动");
        GameCtrl.getIns().openUIAuto();
        GameAudio.clickSystem()
    }

    onCancelAutoRoll() {
        if (this.state == GameState.wait && this.autoHover) {
            this.autoHover = false;
            let light = this.m_ui.button_manual.getChildByName("button_light");
            light.active = true;
            light.getComponent(sp.Skeleton).setToSetupPose()
            light.getComponent(sp.Skeleton).setAnimation(0, "manual", true);
        }
        GameCtrl.getIns().cancelAutoRoll();
    }

    onOpenSettingBet(ev: EventTouch) {
        if (ev.target["disableClick"]) {
            return;
        } else {
            ev.target["disableClick"] = true;
            this.scheduleOnce(() => {
                ev.target["disableClick"] = false;
            }, 0.5);
        }
        if (GameCtrl.getIns().getModel().isFree()) {
            return;
        }
        GameCtrl.getIns().openUISettingBet();
        this.switchMenu(true, false);
        GameAudio.clickSystem()
    }

    onOpenBanlance(ev: EventTouch) {
        if (ev.target["disableClick"]) {
            return;
        } else {
            ev.target["disableClick"] = true;
            this.scheduleOnce(() => {
                ev.target["disableClick"] = false;
            }, 0.5);
        }
        if (GameCtrl.getIns().getModel().isFree()) {
            return;
        }
        GameCtrl.getIns().openUIBanlance();
        this.switchMenu(true, false);
        GameAudio.clickSystem()
    }

    onOpenHistory(ev?: EventTouch) {
        if (ev) {
            if (ev.target["disableClick"]) {
                return;
            } else {
                ev.target["disableClick"] = true;
                this.scheduleOnce(() => {
                    ev.target["disableClick"] = false;
                }, 0.5);
            }
        }
        this.m_ui.HistoryBtn.getComponent(Button).enabled = false;
        this.scheduleOnce(() => {
            if (GameCtrl.getIns().getModel().isFree()) {
                return;
            }
            GameCtrl.getIns().openUIHistory();
            // this.switchMenu(true, false);
            GameAudio.clickSystem()

            this.m_ui.HistoryBtn.getComponent(Button).enabled = true;
        }, window["secondaryMenu"].responseTime);
    }

    onBtnMenu() {
        this.switchMenu(false, true);
        GameAudio.clickSystem()
    }

    onCloseBtnMenu() {
        this.m_ui.CloseBtn.getComponent(Button).enabled = false;
        this.scheduleOnce(() => {
            this.switchMenu(true, true);
            GameAudio.clickSystem()
            this.m_ui.CloseBtn.getComponent(Button).enabled = true;
        }, window["secondaryMenu"].responseTime);
    }

    initFastState(isOpen: boolean) {
        this.m_ui.IsFast.active = true;
        this.m_ui.OpenFast.active = false;
        this.m_ui.CloseFast.active = false;
    }

    /**设置急速按钮状态 */
    onSwitchFast(isOpen: boolean) {
        this.m_ui.IsFast.active = false;
        this.m_ui.OpenFast.active = isOpen;
        Tween.stopAllByTarget(this.m_ui.turbo_sp);
        this.m_ui.turbo_sp.getComponent(UIOpacity).opacity = 255;
        if (isOpen) {
            let spS = this.m_ui.turbo_sp.getComponent(sp.Skeleton);
            spS.setToSetupPose();
            spS.setAnimation(0, "animation", true);
            tween(this.m_ui.turbo_sp.getComponent(UIOpacity)).delay(0.1).to(0.001, { opacity: 100 }).delay(0.1).to(0.001, { opacity: 255 }).union().repeat(2).start();
        }
        this.m_ui.CloseFast.active = !isOpen
        this.setFastOnOff(isOpen)
    }

    checkListHasScatter(list: ElementCom[]) {
        for (let i = 0; i < list.length; i++) {
            let com = list[i];
            if (com.serverIdx > -1 && com.serverIdx < Infinity) {
                if (com.id == TItemtype.ITEM_TYPE_SCATTER) {
                    return true;
                }
            }
        }
        return false;
    }

    onGameAxisReadyRoll(idx: number) {
        if (GameCtrl.getIns().curFast) {
            if (idx == this.elementCtrl.rollAxisList.length - 1) {
                let hasSc = false;
                for (let i = 0; i < this.elementCtrl.rollAxisList.length; i++) {
                    let axis = this.elementCtrl.rollAxisList[i];
                    if (this.checkListHasScatter(axis.elementList)) {
                        hasSc = true;
                        break;
                    }
                }
                if (hasSc) {
                    GameAudio.scatterStop();
                } else {
                    GameAudio.turboRollStop();
                }
            }
        } else {
            let hasSc = this.checkListHasScatter(this.elementCtrl.rollAxisList[idx].elementList);
            if (hasSc) {
                GameAudio.scatterStop();
            } else {
                GameAudio.normalRollStop();
            }
        }
    }

    onUpdateOpenAutoRoll(isOpen: boolean, cnt: number = 0) {
        warn("onUpdateOpenAutoRoll", isOpen);
        this.m_ui.SpinBtn.active = !isOpen
        if (!isOpen) {
            Tween.stopAllByTarget(this.m_ui.AutoBtn)
            tween(this.m_ui.AutoBtn.getComponent(UIOpacity)).to(0.3, { opacity: 0 }).call(() => {
                this.m_ui.AutoBtn.active = isOpen
                this.m_ui.AutoBtn.getChildByName("AutoNum").getComponent(Label).string = cnt + "";
            }).start()
        } else {
            let oldState = this.m_ui.AutoBtn.active;
            if (oldState != isOpen) {
                this.m_ui.AutoBtn.active = isOpen
                this.m_ui.AutoBtn.getComponent(UIOpacity).opacity = 255;
                this.m_ui.button_auto.getChildByName("button_light").active = false;
            }
            this.m_ui.AutoBtn.getChildByName("AutoNum").getComponent(Label).string = cnt + "";
        }

        if (this.state == GameState.wait) {
            this.m_ui.StartAutoBtn.getComponent(Button).interactable = !isOpen;
            if (!isOpen) {
                if (!this.m_ui.StartAutoBtn.getChildByName("Can").active) {
                    this.m_ui.StartAutoBtn.getChildByName("Can").active = true;
                    this.m_ui.StartAutoBtn.getChildByName("Not").active = false;
                    this.m_ui.center_autoplay.active = false;
                }
            } else {
                if (this.m_ui.StartAutoBtn.getChildByName("Can").active) {
                    this.m_ui.StartAutoBtn.getChildByName("Can").active = false;
                    this.m_ui.StartAutoBtn.getChildByName("Not").active = true;
                    this.m_ui.center_autoplay.active = true;
                    this.m_ui.center_autoplay.getComponent(Animation).play();
                }
            }
                
            this.m_ui.StartAutoBtn.getComponent(Button).interactable = !isOpen;
            this.m_ui.MinusBtn.getComponent(Button).enabled = !isOpen
            this.m_ui.AddBtn.getComponent(Button).enabled = !isOpen
            this.m_ui.MoreBtn.getComponent(Button).enabled = !isOpen
            this.changeBtnStyle(this.m_ui.MinusBtn, !isOpen);
            this.changeBtnStyle(this.m_ui.AddBtn, !isOpen);
            this.changeBtnStyle(this.m_ui.MoreBtn, !isOpen);
        } else {
            this.m_ui.center_autoplay.active = false;
        }
    }

    onAddBetAmount() {
        GameCtrl.getIns().addBetAmount();
    }

    onBtnQuit() {
        this.m_ui.ExitBtn.getComponent(Button).enabled = false;
        this.scheduleOnce(() => {
            let info = new ParamConfirmDlg("quit_game", "您确定要退出游戏？", EDialogType.ok_cancel, (menuId: EDialogMenuId) => {
                if (menuId == EDialogMenuId.ok) {
                    location.reload();
                }
            });
            UIManager.showView(EViewNames.UIConfirmDialog, EUILayer.Dialog, info);
            GameAudio.clickSystem()
            this.m_ui.ExitBtn.getComponent(Button).enabled = true;
        }, window["secondaryMenu"].responseTime);
    }

    onClickQuickStop(event: EventTouch) {
        event.preventSwallow = true
        if (this.state == GameState.roll) {
            if (GameCtrl.getIns().getModel().isShowLongJuan) {
                return;
            }
            GameCtrl.getIns().cancelDelayShowResult()
            let pos1 = v3(event.touch.getUILocationX(), event.touch.getUILocationY(), 0)
            let pos2 = this.m_ui.click_quick_stop_effect.parent.getComponent(UITransform).convertToNodeSpaceAR(pos1);
            this.m_ui.click_quick_stop_effect.setPosition(pos2)
            this.m_ui.click_quick_stop_effect.active = true;
            this.m_ui.click_quick_stop_effect.getComponent(sp.Skeleton).setAnimation(0, "animation", false)
            this.spinColor(true);
        } else if (this.state == GameState.start_stop_roll) {
            if (GameCtrl.getIns().getModel().isShowLongJuan) {
                return;
            }
            GameCtrl.getIns().curQuickFast = true;
            this.spinColor(true);
            let arr = this.elementCtrl.rollAxisList.filter((axis) => {
                return axis.isDraws;
            })
            if (arr.length) {
                let pos1 = v3(event.touch.getUILocationX(), event.touch.getUILocationY(), 0)
                let pos2 = this.m_ui.click_quick_stop_effect.parent.getComponent(UITransform).convertToNodeSpaceAR(pos1);
                this.m_ui.click_quick_stop_effect.setPosition(pos2)
                this.m_ui.click_quick_stop_effect.active = true;
                this.m_ui.click_quick_stop_effect.getComponent(sp.Skeleton).setAnimation(0, "animation", false)
            }
        }
    }

    spinPointer() {
        Tween.stopAllByTarget(this.m_ui.pointer_box);
        if (this.state == GameState.wait) {
            this.m_ui.pointer.active = true;
            this.m_ui.pointerBlur.active = false;
            this.spinColor(false);
            tween(this.m_ui.pointer_box).by(1, { angle: window["spinPointer"].normalAngularVelocity }).repeatForever().start();
        } else if (this.state == GameState.roll || this.state == GameState.cancel_roll || this.state == GameState.start_stop_roll) {
            this.m_ui.pointer.active = false;
            this.m_ui.pointerBlur.active = true;
            tween(this.m_ui.pointer_box).by(0.2, { angle: window["spinPointer"].accelerateAngularVelocity }).repeatForever().start();
        } else if (this.state == GameState.show_result || this.state == GameState.delay) {
            this.m_ui.pointer.active = true;
            this.m_ui.pointerBlur.active = false;
            this.spinColor(true);
        }
    }

    spinColor(isGray: boolean) {
        this.m_ui.pointer.getComponent(Sprite).grayscale = isGray;
        this.m_ui.pointerBlur.getComponent(Sprite).grayscale = isGray;
    }

    onMouseEnterSpin(event: EventMouse) {
        if (this.state != GameState.wait && event.target.name != "AutoBtn") {
            let light = this.m_ui.button_manual.getChildByName("button_light");
            light.active = false;
            return;
        }
        if (event.target.name != "AutoBtn") {
            let light = this.m_ui.button_manual.getChildByName("button_light");
            if (!light.active) {
                light.active = true;
                light.getComponent(sp.Skeleton).setToSetupPose()
                light.getComponent(sp.Skeleton).setAnimation(0, "manual", true);
            }
        } else {
            let light = this.m_ui.button_auto.getChildByName("button_light");
            light.active = true;
            light.getComponent(sp.Skeleton).setToSetupPose()
            light.getComponent(sp.Skeleton).setAnimation(0, "auto", true);
        }
    }

    onMouseLeaveSpin(event: EventMouse) {
        if (event.target.name != "AutoBtn") {
            this.m_ui.button_manual.getChildByName("button_light").active = false;
        } else {
            this.m_ui.button_auto.getChildByName("button_light").active = false;
        }
    }

    private refreshVoice() {
        // let bEnable = LocalCache.getInstance("pub").read("voice", 0) == 1;
        let bEnable = !LoginCtrl.getIns().getModel().getPlayerInfo().mute;
        this.m_ui.Mute.active = !bEnable
        AudioManager.inst.setAllEnabled(bEnable);
        this.m_ui.AudioBtn.getChildByName("Can").active = bEnable;
        this.m_ui.AudioBtn.getChildByName("Not").active = !bEnable;
        if (GameCtrl.getIns().getModel().mode == GameMode.free) {
            GameAudio.switchBgm(BgmType.free);
        } else {
            GameAudio.switchBgm(BgmType.normal);
        }
    }

    private onBtnVoice() {
        this.m_ui.AudioBtn.getComponent(Button).enabled = false;
        this.scheduleOnce(() => {
            GameAudio.clickSystem()
            LoginCtrl.getIns().getModel().getPlayerInfo().mute = !AudioManager.inst.musicEnable ? 0 : 1;
            LoginCtrl.getIns().reqSetMusicState();
            this.refreshVoice();
            this.m_ui.AudioBtn.getComponent(Button).enabled = true;
        }, window["secondaryMenu"].responseTime);
    }

    onReduceBetAmount() {
        GameCtrl.getIns().reduceBetAmount();
    }

    private switchMenu(bOp: boolean, bAni: boolean = true) {
        this.m_ui.Menu1.active = bOp;
        let initY = 20.862;
        let moveY = 200
        Tween.stopAllByTarget(this.m_ui.Menu1);
        Tween.stopAllByTarget(this.m_ui.Menu2);
        let moveY1 = 200
        this.m_ui.SpinBtn.active = bOp;
        // if (bOp) {
        //     this.m_ui.SpinBtn.setPosition(0, -518.769, 0)
        //     this.m_ui.SpinBtn.active = bOp;
        //     this.m_ui.SpinBtn.getComponent(UIOpacity).opacity = 255;
        // } else {
        //     tween(this.m_ui.SpinBtn).by(0.2, { position: v3(0, -518.769 - moveY1, 0) }).start();
        //     tween(this.m_ui.SpinBtn.getComponent(UIOpacity)).by(0.2, { opacity: 0 }).start();
        // }
        if (!bAni) {
            this.m_ui.Menu2.getComponent(UIOpacity).opacity = 255
            this.m_ui.Menu1.getComponent(UIOpacity).opacity = 255
            this.m_ui.Menu1.active = bOp;
            this.m_ui.Menu2.active = !bOp
            this.m_ui.Menu1.position = v3(0, initY, 0)
            this.m_ui.Menu2.position = v3(0, bOp ? initY - moveY : initY, 0)
            // this.m_ui.Menu1.position = v3(0, bOp ? 0 : -moveY, 0)
            return
        }
        this.m_ui.Menu1.active = true
        this.m_ui.Menu2.active = true
        this.m_ui.Menu2.getComponent(UIOpacity).opacity = bOp ? 255 : 0
        this.m_ui.Menu1.getComponent(UIOpacity).opacity = bOp ? 0 : 255
        tween(this.m_ui.Menu1)
            .by(0.2, { position: v3(0, bOp ? moveY1 : -moveY1, 0) })
            .start()
        tween(this.m_ui.Menu1.getComponent(UIOpacity))
            .to(0.2, { opacity: bOp ? 255 : 0 })
            .call(() => {
                this.m_ui.Menu1.active = bOp;
            })
            .start()
        tween(this.m_ui.Menu2)
            .by(0.2, { position: v3(0, bOp ? - moveY1 : moveY1, 0) })
            .call(() => {
                this.m_ui.Menu2.active = !bOp
            })
            .start()

        tween(this.m_ui.Menu2.getComponent(UIOpacity))
            .to(0.2, { opacity: bOp ? 0 : 255 })
            .start()
    }
}


