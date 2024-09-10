import { error, game, warn } from "cc";
import { EViewNames } from "../configs/UIConfig";
import GameConst from "../define/GameConst";
import Routes from "../define/Routes";
import GameEvent from "../event/GameEvent";
import { BetInfoRsp } from "../interface/betinfo";
import { ServerResult } from "../interface/common";
import { UserInfoRsp } from "../interface/userinfo";
import { UIManager } from "../kernel/compat/view/UImanager";
import EventCenter from "../kernel/core/event/EventCenter";
import logger from "../kernel/core/logger";
import DateUtil from "../kernel/core/utils/DateUtil";
import UrlUtil from "../kernel/core/utils/UrlUtil";
import HttpMgr from "../mgrs/HttpMgr";
import LoginModel from "../models/LoginModel";
import BaseCtrl from "./BaseCtrl";
import GameCtrl from "./GameCtrl";
import { BetRsp } from "../interface/bet";
import BigNumber from "bignumber.js";
import { EDialogMenuId, EDialogType, EUILayer, ParamConfirmDlg } from "../kernel/compat/view/ViewDefine";
import DataManager from "../network/netData/DataManager";

export default class LoginCtrl extends BaseCtrl<LoginModel> {

    heartTimer: number = 0;
    /**登录失败重试此时 */
    reLoginTimes: number = 0;

    betInfoTimes: number = 0;

    loginInfo: UserInfoRsp = null;

    isTest: boolean = true


    init() {
        this.setModel(new LoginModel())
    }


    private stopHeartBeat() {
        if (this.heartTimer < 0) { return; }
        clearInterval(this.heartTimer);
        this.heartTimer = -1;
    }

    private startHeartBeat() {
        this.stopHeartBeat();
        //@ts-ignore
        this.heartTimer = setInterval(() => {
            let info = {
                timestamp: DateUtil.getSysTime(),
                token: this.getModel().getToken(),
            }
            if (LoginCtrl.getIns().isTest) {
                HttpMgr.getIns().post(Routes.req_heartbeat, info);
            }
        }, 8000);
        logger.log("开始心跳");
    }


    private _reqLogin(callback) {
        let param = {
            "token": this.getModel().getToken(),
        };
        HttpMgr.getIns().post(Routes.req_login, param, (bSucc: boolean, info: ServerResult<UserInfoRsp>) => {
            if (!bSucc) {
                if (info.error_code) {
                    this.onShowReqError(() => {
                        this.reLoginTimes = 0;
                        this._reqLogin(callback);
                    }, 1)
                } else {
                    this.reLoginTimes++;
                    if (this.reLoginTimes >= GameConst.MaxReLoginCnt) {
                        this.onShowReqError(() => {
                            this.reLoginTimes = 0;
                            this._reqLogin(callback);
                        }, 0)
                        return
                    }
                    logger.log("重新连接中...")
                    setTimeout(() => {
                        this._reqLogin(callback)
                    }, 5000);
                }
            } else {
                callback(info.data)
            }
        })
    }

    onShowReqError(cb: Function, type: number) {
        let info = new ParamConfirmDlg(type == 0 ? "网络异常" : "账户异常", type == 0 ? "连接服务器失败" : "账户信息读取失败", EDialogType.ok_cancel, (menuId: EDialogMenuId) => {
            if (menuId == EDialogMenuId.ok) {
                // if (document.referrer.length > 0) { // 后退
                //     window.history.back();
                //     return;
                // }
                game.end();
                window.close();
                window.location.href = "about:blank";
            } else if (menuId == EDialogMenuId.cancel) {
                // setTimeout(() => {
                //     cb()
                // }, 100);
                location.reload();
            }
        });
        info.thisObj = this;
        info.title = type == 0 ? "网络异常" : "账户异常"
        info.okTxt = "退出"
        info.cancelTxt = "重新加载"
        UIManager.showView(EViewNames.UIConfirmDialog, EUILayer.Dialog, info)
    }

    reqLogin(): Promise<UserInfoRsp> {
        return new Promise((res) => {
            this._reqLogin(res)
        })
    }

    reqSetMusicState() {
        HttpMgr.getIns().post(Routes.req_music, {
            "token": this.getModel().getToken(),
            "mute": this.getModel().getPlayerInfo().mute
        })
    }

    reqGetBetInfo(): Promise<BetInfoRsp> {
        return new Promise((res) => {
            this._reqBetInfo(res);
        })
    }

    _reqBetInfo(cb: Function) {
        HttpMgr.getIns().post(Routes.req_bet_info, {}, (bSucc: boolean, info: ServerResult<BetInfoRsp>) => {
            if (!bSucc) {
                if (info.error_code) {
                    this.onShowReqError(() => {
                        this.betInfoTimes = 0;
                        this.reqGetBetInfo();
                    }, 1)
                } else {
                    this.betInfoTimes++;
                    if (this.betInfoTimes >= GameConst.MaxReLoginCnt) {
                        this.onShowReqError(() => {
                            this.betInfoTimes = 0;
                            this.reqGetBetInfo();
                        }, 0)
                        return
                    }
                    logger.red("获取下注信息失败")
                    setTimeout(() => {
                        this.reqGetBetInfo()
                    }, 5000);
                }
            } else {
                cb(info.data)
            }
        })
    }

    async getBetInfo() {
        let loginInfo = this.loginInfo;
        let betInfo: BetInfoRsp = DataManager.initBetInfo()//await this.reqGetBetInfo();
        if (betInfo) {
            let lastWin = loginInfo.game_info.last_win;
            GameCtrl.getIns().getModel().setBetInfo(betInfo);
            GameCtrl.getIns().getModel().setGameInfo(loginInfo.game_info);
            let betResult = new BetRsp();
            betResult.free_remain_times = loginInfo.game_info.free_remain_times;
            betResult.free_game_total_win = lastWin;
            betResult.prize = lastWin;
            GameCtrl.getIns().getModel().setBetResult(betResult)
            GameCtrl.getIns().getModel().initGameData({
                balance: loginInfo.player_info.balance,
                list: loginInfo.list,
                lastWin: lastWin,
                lastRound: loginInfo.lastRound?.round_list,
                isEndFree: loginInfo.lastRound?.is_end_free
            })
            EventCenter.getInstance().fire(GameEvent.user_login_succ);
        }
    }

    async login(loginCb: () => void) {
        this.loginInfo = DataManager.initLoginData()
        // this.loginInfo = await this.reqLogin();
        console.log("登录信息", this.loginInfo);
        this.startHeartBeat();
        this.getModel().setPlayerInfo(this.loginInfo.player_info);
        loginCb();
    }

    enterGame() {
        GameCtrl.getIns().enterGame()
    }
}