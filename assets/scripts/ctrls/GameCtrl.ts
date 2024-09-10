import { game, log, tween, warn } from "cc";
import { EViewNames } from "../configs/UIConfig";
import GameConst, { GameState } from "../define/GameConst";
import Routes from "../define/Routes";
import GameEvent from "../event/GameEvent";
import { BetReq, BetRsp } from "../interface/bet";
import { ServerResult } from "../interface/common";
import { RecordListReq, RecordListRsp } from "../interface/recordlist";
import { UserInfoRsp } from "../interface/userinfo";
import CocosUtil from "../kernel/compat/CocosUtil";
import { UIManager } from "../kernel/compat/view/UImanager";
import { EDialogMenuId, EDialogType, EUILayer, ParamConfirmDlg } from "../kernel/compat/view/ViewDefine";
import EventCenter from "../kernel/core/event/EventCenter";
import logger from "../kernel/core/logger";
import { EHttpResult } from "../kernel/core/net/NetDefine";
import MathUtil from "../kernel/core/utils/MathUtil";
import HttpMgr from "../mgrs/HttpMgr";
import RecordMgr from "../mgrs/RecordMgr";
import GameModel, { GameMode, HHSCResultAwardUIInfo } from "../models/GameModel";
import BaseCtrl from "./BaseCtrl";
import LoginCtrl from "./LoginCtrl";
import { NetworkSend } from "../network/NetworkSend";
import DataManager from "../network/netData/DataManager";




export default class GameCtrl extends BaseCtrl<GameModel> {


    delayHandlerId: any = 0;

    delayTime: number = 0;

    /**极速模式 */
    isFast: boolean = false;

    /**是否有数据 */
    hasData: boolean = false;
    /**是否开始停止 */
    isStop: boolean = false;

    /**快停 */
    curQuickFast: boolean = false;
    /**当前急速 */
    curFast: boolean = false;

    static isFristReqRecord: boolean = false;

    /**自动旋转次数 */
    autoRollCnt: number = 0;

    /**开启自动定时器 */
    autoTimer: any = -1;

    init() {
        this.setModel(new GameModel())
    }

    async enterGame() {
        this.register()
        let viewInfo = this.getModel().getInitViewInfo();
        this.getModel().gameInfo.free_remain_times = DataManager.CMD_S_StatusFree.nTotalFreeCount.value;
        this.getModel().getBetData().free_remain_times=DataManager.CMD_S_StatusFree.nTotalFreeCount.value;
        viewInfo.remainFreeTimes = this.getModel().gameInfo.free_remain_times;
        viewInfo.isEndFree = DataManager.CMD_S_StatusFree.nTotalFreeCount.value==1;
        if(viewInfo.remainFreeTimes>0)DataManager.preTotalFree=viewInfo.remainFreeTimes;
        await UIManager.showView(EViewNames.GameView, EUILayer.Panel, viewInfo);
        UIManager.closeView(EViewNames.LoadinView);
    }

    private register() {
        EventCenter.getInstance().listen(GameEvent.reconnect_tip, this.onShowReconnect, this)
        EventCenter.getInstance().listen("betResp",this.onBetResult,this);
        EventCenter.getInstance().listen("just_stop_roll",this.stopRoll,this);
        EventCenter.getInstance().listen("betErr",this.betErr,this);
        
    }

    onShowReconnect(cnt: number) {
        if (!UIManager.getView(EViewNames.ReconnectTip)) {
            UIManager.showView(EViewNames.ReconnectTip, EUILayer.Tip, cnt)
        }
    }

    getIdempotent() {
        return LoginCtrl.getIns().getModel().getPlayerInfo().id + Date.now() + ""
    }


    _reqBet(params: BetReq, req_cnt: number = 0) {
        HttpMgr.getIns().post(Routes.req_bet, params, (bSucc: boolean, info: ServerResult<BetRsp>) => {
            warn("下注回调");
            if (bSucc) {
                warn("下注回调", JSON.stringify(info.data));
                this.onBetResult(info.data)
            } else if (typeof (info) == "number") {
                if (info == EHttpResult.Error) {
                    this.onShowReqError(params)
                } else {
                    req_cnt++;
                    if (req_cnt <= 5) {
                        EventCenter.getInstance().fire(GameEvent.reconnect_tip, req_cnt)
                        setTimeout(() => {
                            this._reqBet(params, req_cnt)
                        }, 5000);
                    } else {
                        this.onShowReqError(params);
                    }
                }
            } else if (info.error_code == 136) {
                let params: ParamConfirmDlg = {
                    callback: () => {
                    },
                    title: "未能完成交易",
                    content: `下注额错误\n(错误代码:${info.error_code})`,
                }
                UIManager.showView(EViewNames.UIConfirmTip, EUILayer.Popup, params)
            } else if (info.error_code == 154 || info.error_code == 93) {//金额不足
                let params: ParamConfirmDlg = {
                    callback: () => {
                        let datas = this.getModel().getTestElementList();
                        this.getModel().curBetResultRoundList = [];
                        this.getModel().betData.prize = 0;
                        this.getModel().betData.free = false;
                        EventCenter.getInstance().fire(GameEvent.game_start_stop_roll, { data: datas })
                        GameCtrl.getIns().cancelAutoRoll()
                    },
                    title: "未能完成交易",
                    content: `积分不足,请尝试切换注额\n(错误代码:${info.error_code})`,
                    okTxt: "确定"
                }
                UIManager.showView(EViewNames.UIConfirmTip, EUILayer.Popup, params)
            } else {
                req_cnt++;
                if (req_cnt <= 5) {
                    EventCenter.getInstance().fire(GameEvent.reconnect_tip, req_cnt)
                    setTimeout(() => {
                        this._reqBet(params, req_cnt)
                    }, 5000);
                } else {
                    this.onShowReqError(params, false);
                }
            }
        })
    }

    onShowReqError(params: any, isFree?: boolean) {
        let info = new ParamConfirmDlg("net_error", "未能连接到服务器，请检查您的网络\n或重试。", EDialogType.ok_cancel, (menuId: EDialogMenuId) => {
            if (menuId == EDialogMenuId.ok) {
                if (document.referrer.length > 0) { // 后退
                    window.history.back();
                    return;
                }
                game.end();
            } else if (menuId == EDialogMenuId.cancel) {
                setTimeout(() => {
                    if (isFree) {
                        this._reqFree(params)
                    } else {
                        this._reqBet(params)
                    }
                }, 100);
            }
        });
        info.thisObj = this;
        info.title = "未能成功交易"
        info.okTxt = "退出"
        info.cancelTxt = "重试"
        UIManager.showView(EViewNames.UIConfirmDialog, EUILayer.Dialog, info)
    }

    /**下注 */
    reqBet() {
        let tTotalAmount = this.getModel().getCurBetAmount();
        NetworkSend.Instance.sendStartSpin({mTotalAmount:tTotalAmount});
        // let params: BetReq = {
        //     token: LoginCtrl.getIns().getModel().getToken(),
        //     id: this.getModel().getCurBetId(),
        //     idempotent: this.getIdempotent(),
        // }
        // warn("下注", params);
        // this._reqBet(params)
    }

    stopRoll(){
        let datas = this.getModel().getTestElementList();
        this.getModel().curBetResultRoundList = [];
        EventCenter.getInstance().fire(GameEvent.game_start_stop_roll, { data: datas })
    }

    betErr(code){
        let params: ParamConfirmDlg = {
            callback: () => {
                let datas = this.getModel().getTestElementList();
                this.getModel().curBetResultRoundList = [];
                this.getModel().betData.prize = 0;
                this.getModel().betData.free = false;
                EventCenter.getInstance().fire(GameEvent.game_start_stop_roll, { data: datas })
                GameCtrl.getIns().cancelAutoRoll()
            },
            title: "未能完成交易",
            content: `请尝试切换注额\n(错误代码:${code})`,
            okTxt: "确定"
        }
        UIManager.showView(EViewNames.UIConfirmTip, EUILayer.Popup, params)
    }

    /**请求免费 */
    reqFree() {
        let tTotalAmount = 0;
        NetworkSend.Instance.sendStartSpin({mTotalAmount:tTotalAmount});
        // let params: BetReq = {
        //     token: LoginCtrl.getIns().getModel().getToken(),
        //     idempotent: this.getIdempotent(),
        // }
        // warn("请求免费", params);
        // this._reqFree(params)
    }

    /**免费请求 */
    _reqFree(params: BetReq, req_cnt: number = 0) {
        HttpMgr.getIns().post(Routes.req_free, params, (bSucc: boolean, info: ServerResult<BetRsp>) => {
            if (bSucc) {
                warn("下注回调", JSON.stringify(info.data));
                this.onBetResult(info.data)
            } else if (typeof (info) == "number") {
                if (info == EHttpResult.Error) {
                    this.onShowReqError(params, true)
                } else {
                    req_cnt++;
                    if (req_cnt <= 5) {
                        EventCenter.getInstance().fire(GameEvent.reconnect_tip, req_cnt)
                        setTimeout(() => {
                            this._reqFree(params, req_cnt)
                        }, 5000);
                    } else {
                        this.onShowReqError(params, true);
                    }
                }
            } else if (info.error_code == 136) {
                let params: ParamConfirmDlg = {
                    callback: () => {
                    },
                    title: "未能完成交易",
                    content: `下注额错误\n(错误代码:${info.error_code})`,
                }
                UIManager.showView(EViewNames.UIConfirmTip, EUILayer.Popup, params)
            } else if (info.error_code == 154) {//金额不足
                let params: ParamConfirmDlg = {
                    callback: () => {
                        let datas = this.getModel().getTestElementList();
                        this.getModel().curBetResultRoundList = [];
                        EventCenter.getInstance().fire(GameEvent.game_start_stop_roll, { data: datas })
                    },
                    title: "未能完成交易",
                    content: `积分不足,请尝试切换注额\n(错误代码:${info.error_code})`,
                    okTxt: "确定"
                }
                UIManager.showView(EViewNames.UIConfirmTip, EUILayer.Popup, params)
            } else {
                warn("免费重试", req_cnt)
                req_cnt++;
                if (req_cnt <= 5) {
                    EventCenter.getInstance().fire(GameEvent.reconnect_tip, req_cnt)
                    setTimeout(() => {
                        this._reqFree(params, req_cnt)
                    }, 5000);
                } else {
                    this.onShowReqError(params, true);
                }
            }
        })
    }

    /**请求转动 */
    reqRoll() {
        log("请求滚动", this.getModel().isFree(), this.getModel().isIntoFree());
        this.hasData = false;
        this.isStop = false;
        let betAmount = this.getModel().getCurBetAmount()
        let balance = this.getModel().balance;
        if (this.getModel().isFree() || this.getModel().isIntoFree()) {
            this.reqFree()
        } else {
            this.reqBet()
            if (balance >= betAmount) {
                EventCenter.getInstance().fire(GameEvent.game_update_player_blance, balance - betAmount);//客户端手动扣除下注金额
            }
        }
        if (this.isFast) {
            this.delayTime = 0
        } else {
            this.delayTime = 1000
        }
        this.curFast = this.getModel().isFree() ? false : this.isFast;
        this.curQuickFast = false;
        EventCenter.getInstance().fire(GameEvent.update_game_state, GameState.roll)
        EventCenter.getInstance().fire(GameEvent.game_clear_award_result);
        EventCenter.getInstance().fire(GameEvent.game_start_roll, this.curFast);
    }

    /**下注返回 */
    private onBetResult(data: BetRsp) {
        this.hasData = true;
        this.getModel().setBetResult(data);
        if (data.free && DataManager.preTotalFree==0) {
            this.getModel().mode = GameMode.into_free
        } else if (data.trigger_free) {
            this.getModel().mode = GameMode.free_again
        } else if (data.free_remain_times == 0 && DataManager.preTotalFree > 0) {
            this.getModel().mode = GameMode.last_free;
            console.log("GameMode.last_free..................");
        } else if (data.free_remain_times > 0) {
            this.getModel().mode = GameMode.free
        } else {
            this.getModel().mode = GameMode.normal
        }
        console.log("当前游戏模式", this.getModel().mode,data.free_remain_times,DataManager.preTotalFree)
        this.delayHandlerId = setTimeout(() => {
            this.startRoll()
        }, this.delayTime);
    }

    /**普通模式下开始滚动 */
    private startRoll() {
        warn("普通模式下开始滚动", this.hasData, this.isStop);
        if (this.hasData) {
            clearTimeout(this.delayHandlerId)
            this.delayHandlerId = 0;
            let datas = this.getModel().getResultElementDatas(0);
            EventCenter.getInstance().fire(GameEvent.game_start_stop_roll, { data: datas })
        }
    }

    openAutoRoll(idx: number) {
        let cnt: number = this.getModel().getAutoRollCntByIdx(idx);
        if (cnt) {
            this.autoRollCnt = cnt;
            EventCenter.getInstance().fire(GameEvent.game_update_open_auto_roll, true, this.autoRollCnt)
            this.autoTimer = setTimeout(() => {
                this.autoRollCnt--
                EventCenter.getInstance().fire(GameEvent.game_update_open_auto_roll, true, this.autoRollCnt)
                this.reqRoll()
            }, 500);
        }
    }

    cancelAutoRoll() {
        clearTimeout(this.autoTimer);
        this.autoRollCnt = 0;
        EventCenter.getInstance().fire(GameEvent.game_update_open_auto_roll, false, 0)
    }

    private isFrist:boolean=true;
    /**检测是否需要自动旋转 */
    checkAutoRoll() {
        if (this.getModel().isFree() || this.getModel().isIntoFree()) {
            warn("免费旋转")
            let tnum = (this.isFrist && DataManager.preTotalFree>0)?DataManager.preTotalFree:this.getModel().getBetData().free_remain_times;
            EventCenter.getInstance().fire(GameEvent.game_update_free_num,  tnum- 1)
            this.isFrist=false;
            this.reqRoll();
        } else {
            if (this.autoRollCnt > 0) {
                this.autoRollCnt--
                EventCenter.getInstance().fire(GameEvent.game_update_open_auto_roll, true, this.autoRollCnt)
                this.reqRoll();
            } else {
                EventCenter.getInstance().fire(GameEvent.game_update_open_auto_roll, false, 0)
            }
        }
    }

    /**开关快速模式 */
    switchFast(isOpen: boolean) {
        this.isFast = isOpen;
        EventCenter.getInstance().fire(GameEvent.game_switch_fast, this.isFast);
    }

    /**展示大奖动画 */
    async showBigWin(win: number) {
        return new Promise<number>(async (resolve, reject) => {
            let bet = this.getModel().getCurBetAmount();
            let rate = win / bet;
            let level = this.getModel().getResultBigAwardAnimationLevel(rate);
            if (level != 0) {
                await CocosUtil.wait(0.5);
                await UIManager.showView(EViewNames.ResultBigAward, EUILayer.Panel, { amounts: this.getModel().getResultBigAwardAnimationNums(this.getModel().getCurBetAmount(), win) });
            }
            resolve(level);
        })
    }

    /**展示中奖结果 */
    showResultAward() {
        this.showNormalModeResultAward();
    }

    /**正常模式结算 */
    showNormalModeResultAward() {
        log("正常模式结算", this.getModel().roundNum);
        let uiData = this.getModel().getResultAwardUIDatas(this.getModel().roundNum);
        EventCenter.getInstance().fire(GameEvent.update_game_state, GameState.show_result)
        EventCenter.getInstance().fire(GameEvent.game_show_award_result, uiData)
        this.getModel().roundNum++;
    }

    openUIAuto() {
        let uiData = this.getModel().getInitUIAutoData()
        UIManager.showView(EViewNames.UIAuto, EUILayer.Popup, uiData)
    }

    openUISettingBet() {
        let uiData = this.getModel().getInitUIBetSettingData()
        UIManager.showView(EViewNames.UIBetSetting, EUILayer.Popup, uiData)
    }

    reqGetBanlance(callback) {
        let param = {
            "token": LoginCtrl.getIns().getModel().getToken(),
        };
        HttpMgr.getIns().post(Routes.req_login, param, (bSucc: boolean, info: ServerResult<UserInfoRsp>) => {
            if (bSucc) {
                callback(info.data.player_info.balance)
            } else {
                callback(null)
            }
        })
    }

    openUIBanlance() {
        let uiData = this.getModel().getInitUIBetSettingData()
        UIManager.showView(EViewNames.UImoney, EUILayer.Popup, uiData)
    }

    async openUIHistory() {
        let uiData = this.getModel().getInitUIBetSettingData()
        UIManager.showView(EViewNames.UIhistory, EUILayer.Popup, uiData)
    }

    /**取消延时停止移动 */
    cancelDelayShowResult() {
        EventCenter.getInstance().fire(GameEvent.update_game_state, GameState.cancel_roll)
        this.curQuickFast = true;
        this.startRoll()
    }


    reduceBetAmount() {
        let amount = this.getModel().reduceBetAmount();
        EventCenter.getInstance().fire(GameEvent.update_game_change_bet_amount, amount)
    }

    addBetAmount() {
        let amount = this.getModel().addBetAmount();
        EventCenter.getInstance().fire(GameEvent.update_game_change_bet_amount, amount)
    }

    switchBetId(id: number) {
        this.getModel().setCurBetId(id);
        let amount = this.getModel().getCurBetAmount()
        EventCenter.getInstance().fire(GameEvent.update_game_change_bet_amount, amount, false);
    }

    /**获取下注是否达到边界 */
    getBetAmountState(amount: number) {
        let ixMax = this.getModel().isMaxBet(amount)
        let isMin = this.getModel().isMinBet(amount)
        return { isMax: ixMax, isMin: isMin }
    }


}