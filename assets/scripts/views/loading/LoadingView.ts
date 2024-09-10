import { _decorator, Component, Node, ProgressBar, Label, resources, AssetManager, Vec3, tween, v3, color, assetManager, Color, Sprite, Size, warn, sys, log } from 'cc';
import { EViewNames } from '../../configs/UIConfig';
import LoginCtrl from '../../ctrls/LoginCtrl';
import GameEvent from '../../event/GameEvent';
import CocosUtil from '../../kernel/compat/CocosUtil';
import LoadHelper from '../../kernel/compat/load/LoadHelper';
import { BaseView } from '../../kernel/compat/view/BaseView';
import { UIManager } from '../../kernel/compat/view/UImanager';
import { CompColorBlur } from '../../kernel/compat/view/comps/CompColorBlur';
import MathUtil from '../../kernel/core/utils/MathUtil';
import GameCtrl from '../../ctrls/GameCtrl';
import { AdaptScreenManager } from '../common/AdaptScreenManager';
import { Prefab } from 'cc';
import { Network } from '../../network/Network';
import DataManager from '../../network/netData/DataManager';
import { roomCmd } from '../../network/netData/cmd';
import EventCenter from '../../kernel/core/event/EventCenter';
import { EUILayer, ParamConfirmDlg } from '../../kernel/compat/view/ViewDefine';


const tip_notes = [
    "亲，请稍安勿躁！第一次加载可能略微需要一点时间",
    "加载过的游戏会在浏览器保留缓存，下次加载更流畅",
    "请使用最新版本的手机系统可以获得最佳的游戏体验",
    "在Safari和Chrome享受更震撼的游戏体验吧！",
    //"登录失败，系统正在重试... （第 X 次）",
    "关闭闲置网页，给我多点空间，还你更多惊喜！",
    "高清游戏资源可能略多，建议在WIFI环境下预加载！",
]

const { ccclass, property } = _decorator;

@ccclass('LoadingView')
export class LoadingView extends BaseView {
    @property(ProgressBar)
    spBar: ProgressBar;
    @property(Label)
    txtProgress: Label;
    @property(Label)
    txtTip: Label;
    // @property(Node)
    // ndEffect: Node = null;

    @property(Node)
    btn_entergame: Node;

    private _hasGameLoaded: boolean = false;
    private _hasDocLoaded: boolean = false;
    curLoadProgress: number = 0;
    curTipIndex: number = 0;
    originPos: Vec3 = null;

    protected onLoad(): void {
        CocosUtil.traverseNodes(this.node, this.m_ui);
        this.btn_entergame.active = false;
        // this.setCurLoadBar(0.1);

        window.addEventListener("startGame", () => {
            LoginCtrl.getIns().enterGame();
        })
    }

    private hideLoadingSvg(){
        if (sys.isMobile || sys.isBrowser){
            let removeDom = ()=>{
                let fadeOutDuration = 0.4;
                let obj = {opacity: 1};
                
                tween(obj)
                .to(fadeOutDuration, {opacity: 0.0}, {progress: (start: number, end: number, current: number, ratio: number) => {
                        let v = start + ((end - start) * ratio);
                        let domSvg = document.getElementById("initial-loader");
                        if (domSvg){
                            domSvg.style.opacity = `${v}`;
                        }

                        return v;
                    },
                    // easing: "quintIn",
                })
                .call(()=>{
                     let domSvg = document.getElementById("initial-loader");
                    if (domSvg){
                        domSvg.remove();
                    }
                })
                .start()
            }
            let _svgStartDate =  window["_svgStartDate"] as Date;
            if (!_svgStartDate){
                removeDom();
                return 
            }

            let _svgDuration = window["_svgDuration"] as number;

            let now = new Date();
            let pastTime = now.getTime() - _svgStartDate.getTime();
            if (pastTime < _svgDuration){
                this.scheduleOnce(()=>{removeDom();}, (_svgDuration - pastTime) / 1000);
                return 
            }

            removeDom();
        }
    }

    start() {
        this.hideLoadingSvg();

        EventCenter.getInstance().listen(GameEvent.user_login_fail, this.onLoginFail, this);
        EventCenter.getInstance().listen(GameEvent.user_login_succ, this.onLoginSucc, this);

        CocosUtil.addClickEvent(this.btn_entergame, this.onBtnEntergame, this)

        let pos = this.txtTip.node.position;
        this.originPos = v3(pos.x, pos.y, pos.z);
        MathUtil.shuffle(tip_notes);

        this.txtTip.node.addComponent(CompColorBlur);
        this.txtTip.string = tip_notes[0];
        this.schedule(() => {
            this.changeTip();
        }, 5);
        // this.spBar.barSprite..active = false;

        this.loadBundleShared();

        this.moveLogo(AdaptScreenManager.visible);
        AdaptScreenManager.addEvent(this.node, (visible) => {
            this.moveLogo(visible)
        })
    }

    moveLogo(visible: Size) {
        if (visible.height > 1683) {
            this.m_ui.bottomLayer.setPosition(0, -572.761, 0);
        } else if (visible.height > 1334) {
            let c = visible.height - 1334;
            let t = 1638 - 1334;
            let n = -572.761 - -483.415;
            let y = n / t * c + -483.415;
            this.m_ui.bottomLayer.setPosition(0, y, 0);
        } else {
            this.m_ui.bottomLayer.setPosition(0, -483.415, 0);
        }
    }

    protected onDestroy(): void {
        EventCenter.untarget(this);
        AdaptScreenManager.deleteEvent(this.node);
    }

    private onLoginFail(failTimes: number) {
        this.txtProgress.string = "登录失败，系统正在重试... （第 " + failTimes + " 次）";
    }

    private onLoginSucc() {
        log("login succ ------");
        this.setCurLoadBar(0.4);
        this.txtProgress.string = "正在加载游戏资源";
        this.loadBundleGame();
    }

    private onBtnEntergame() {
        LoginCtrl.getIns().enterGame()
    }

    private loadBundleGame() {
        log("load game bundle...");
        LoadHelper.loadBundle("game", null, (err, bun) => {
            if (err) {
                this.scheduleOnce(() => {
                    this.loadBundleGame();
                }, 1);
                return;
            }
            this.loadGame(bun);
        });
    }

    private loadGame(bun: AssetManager.Bundle) {
        log("load game dir");
        let percent = 0;
        bun.loadDir("prefabs", (finished: number, total: number) => {
            let curPercent = finished / total;
            if (percent < curPercent) {
                percent = curPercent;
                this.setCurLoadBar(0.4 + curPercent * 0.4);
            }
        }, (err, data) => {
            if (err) {
                log(err);
            }
            this.loadSound(bun);
        });
    }

    private loadSound(bun: AssetManager.Bundle) {
        // let p = this.spBar.progress
        let percent = 0;
        bun.loadDir("audio", (finished: number, total: number) => {
            let curPercent = finished / total;
            if (percent < curPercent) {
                percent = curPercent;
                this.setCurLoadBar(0.8 + percent * 0.2);
            }
        }, (err, data) => {
            if (err) {
                log(err);
            }
            data.forEach((item) => {
                item.addRef();
            });
            this.showEnter();
        });
    }

    // 加载通用
    private loadBundleShared() {
        assetManager.loadBundle("shared", async (err: Error | null, data: AssetManager.Bundle) => {
            if (err != null) {
                this.scheduleOnce(this.loadBundleShared.bind(this), 1.0)
                return
            }

            await this.checkL10Bundle();

            window["SharedConfig"].SetThemeColor(new Color("#6EE78D"));// 设置主题颜色
            // this.config.init();
            // this.config.setErrorCallback(this.onCallBackResponeErrorCode.bind(this));

            // this.lbTips.string = this.getL10n("shared_loading_tips_do_login");
            // this.login();
            // this.loadBundleGame()
            this.loadCommon()
        })
    }
    // 检查l10多语言的子包是否加载完毕
    private async checkL10Bundle() {
        let check = (resolve: Function, reject: Function) => {
            // TODO l10n有时候会比res包加载的慢，先这样， 后面看怎么把l10n不在res下使用，或者调整加载顺序，修改bundle的顺序无效
            if (assetManager.getBundle("l10n") != null) {
                resolve();
                return
            }

            this.scheduleOnce(() => {
                resolve();
            }, 1.5)
            return
        }

        await window["PromiseEx"].Call(check)
        // this.playAnimation()
    }


    // private onGameLoaded() {
    //     // log("load game finish ------");
    //     // this._hasGameLoaded = true;
    //     // this.setCurLoadBar(0.5);
    //     LoginCtrl.getIns().login()
    // }


    private showEnter() {
        this.btn_entergame.active = true;
        this.m_ui.ProgressBar.active = false;
        this.txtTip.node.active = false;
        this.txtProgress.node.active = false;
    }

    private loadCommon() {
        LoadHelper.loadBundle("game", null, (err, bun) => {
            if (err) {
                this.scheduleOnce(() => {
                    this.loadBundleGame();
                }, 1);
                return;
            }
            let percent = 0;
            this.txtProgress.string = "正在加载基础资源";
            bun.load("prefabs/common/ConfirmDialog", Prefab, (finished: number, total: number) => {
                let cur = finished / total;
                if (cur > percent) {
                    percent = cur;
                    this.setCurLoadBar(percent * 0.2);
                }
            }, () => {
                this.setCurLoadBar(0.2);
                // this.loginGame();
                this.connect();
            })
        });
    }

    private loginGame() {
        clearTimeout(this.mtimer);
        EventCenter.getInstance().fire(GameEvent.reconnect_tip_close)
        let eventName = DataManager.getCmdEventName(roomCmd.MDM_GF_FRAME, roomCmd.SUB_GF_SCENE,DataManager.serverTypeStr);
        EventCenter.getInstance().remove(eventName,this.loginGame,this);
        this.txtProgress.string = "正在账号认证";
        LoginCtrl.getIns().login(() => {
            this.setCurLoadBar(0.3);
            this.txtProgress.string = "正在加载玩家信息";
            LoginCtrl.getIns().getBetInfo();
        })
    }

    private setCurLoadBar(percent: number) {
        if (percent < this.spBar.progress) {
            return
        }
        this.spBar.progress = percent;
        let p = Math.floor(percent * 100);
        if (p < 20) {
            this.txtProgress.string = `正在加载基础资源[${p}%]`
        } else if (p >= 40) {
            this.txtProgress.string = `正在加载游戏资源[${p}%]`
        }
    }

    private changeTip() {
        this.curTipIndex++;
        if (this.curTipIndex >= tip_notes.length) {
            this.curTipIndex = 0;
        }

        let txtNode = this.txtTip.node;
        tween(txtNode)
            .call(() => {
                txtNode.getComponent(CompColorBlur).blurAlpha(18, 255, 0);
            })
            .to(0.35, { position: v3(this.originPos.x, this.originPos.y + 30, this.originPos.z) })
            .call(() => {
                this.txtTip.string = tip_notes[this.curTipIndex];
                txtNode.position = v3(this.originPos.x, this.originPos.y - 30, this.originPos.z);
            })
            .hide()
            .delay(0.5)
            .show()
            .call(() => {
                txtNode.getComponent(CompColorBlur).blurAlpha(18, 0, 255);
            })
            .to(0.35, { position: v3(this.originPos.x, this.originPos.y, this.originPos.z) })
            .start();
    }


    private connect(){
        Network.Instance.CreateWS();
        EventCenter.getInstance().listen("onConnect",this.onConnect,this);
    }
    
    private onConnect(){
        let eventName = DataManager.getCmdEventName(roomCmd.MDM_GF_FRAME, roomCmd.SUB_GF_SCENE,DataManager.serverTypeStr);
        EventCenter.getInstance().listen(eventName,this.loginGame,this);
        this.mtimer=setTimeout(this.loginTimeOut, 20000);
        
    }

    private mtimer:NodeJS.Timeout=null;
    private loginTimeOut(){
        Network.Instance.ClearWS();
        let tself = this;
        let params: ParamConfirmDlg = {
            callback: () => {
                if(DataManager.betCfg)return;
                Network.Instance.ClearWS(false);
                tself.mtimer=setTimeout(this.loginTimeOut, 20000);
            },
            title: "Tip",
            content: `登录失败，是否重新登录？`,
            okTxt:"OK"
        }
        UIManager.showView(EViewNames.UIConfirmTip, EUILayer.Popup, params)
        EventCenter.getInstance().fire(GameEvent.reconnect_tip,1)
    }

}


