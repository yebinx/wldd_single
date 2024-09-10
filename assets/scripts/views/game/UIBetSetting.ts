import { _decorator, Label, instantiate, UITransform, tween, v3, NodeEventType, EventTouch, Node, Button, warn, log } from "cc";
import { EViewNames } from "../../configs/UIConfig";
import GameConst from "../../define/GameConst";
import GameEvent from "../../event/GameEvent";
import CocosUtil from "../../kernel/compat/CocosUtil";
import { BaseComp } from "../../kernel/compat/view/BaseComp";
import { UIManager } from "../../kernel/compat/view/UImanager";
import CHandler from "../../kernel/core/datastruct/CHandler";
import EventCenter from "../../kernel/core/event/EventCenter";
import MoneyUtil from "../../kernel/core/utils/MoneyUtil";
import { CompBetScroll } from "./CompBetScroll";
import GameCtrl from "../../ctrls/GameCtrl";
import { BaseGoldInfo } from "../../models/GameModel";
import { BaseView } from "../../kernel/compat/view/BaseView";
import GameAudio from "../../mgrs/GameAudio";
import { PopupView } from "../../kernel/compat/view/PopupView";


const { ccclass, property } = _decorator;
@ccclass('UIBetSetting')
export class UIBetSetting extends PopupView {
    @property(Label)
    txtMoney: Label;
    @property(Label)
    txtBet: Label;
    @property(Label)
    txtAward: Label;


    private curSelectBetId: number = 0;

    initData(data: BaseGoldInfo) {
        this.txtMoney.string = MoneyUtil.currencySymbol() + MoneyUtil.rmbStr(data.balance);
        this.txtBet.string = MoneyUtil.currencySymbol() + MoneyUtil.rmbStr(data.curBetAmount);
        this.txtAward.string = MoneyUtil.currencySymbol() + MoneyUtil.rmbStr(data.lastWinAmount);
    }

    protected onLoad(): void {
        CocosUtil.traverseNodes(this.node, this.m_ui);
        EventCenter.getInstance().listen(GameEvent.game_update_player_blance, function (amount: number) {
            this.txtMoney.string = MoneyUtil.currencySymbol() + MoneyUtil.rmbStr(amount);
        }, this);
        EventCenter.getInstance().listen(GameEvent.comp_bet_scroll_opt_start, () => {
            this.onOpt(true)
        }, this);
        EventCenter.getInstance().listen(GameEvent.comp_bet_scroll_opt_end, () => {
            this.onOpt(false)
        }, this);

        this.initLists();
    }

    start() {
        // let betValue = GameMgr.getInstance()._betGold;
        let idx = GameCtrl.getIns().getModel().getCurBetId();
        let info = GameCtrl.getIns().getModel().getBetIdInfo(idx);
        let amountIdx = GameCtrl.getIns().getModel().getBetAmountIdx(info.bet_size / GameConst.BeseGold)
        let rateIdx = GameCtrl.getIns().getModel().getBetMultipleIdx(info.bet_multiple)
        this.m_ui.list_daxiao.getComponent(CompBetScroll).scrollToIndex(amountIdx + 1, false);
        this.m_ui.list_beishu.getComponent(CompBetScroll).scrollToIndex(rateIdx + 1, false);
        this.curSelectBetId = idx;

        this.initUIEvent();

        this.refreshBettotal(false);

        this.enabledButton(this.m_ui.btn_maxbet, !GameCtrl.getIns().getModel().isMaxBet(info.total_bet));
    }

    private initUIEvent() {
        CocosUtil.addClickEvent(this.m_ui.btn_close, function () {
            GameAudio.clickClose();
            UIManager.closeView(EViewNames.UIBetSetting);
        }, this);
        CocosUtil.addClickEvent(this.m_ui.btn_maxbet, this.onBtnMaxbet, this);
        CocosUtil.addClickEvent(this.m_ui.btn_sure, this.onBtnSure, this);
    }

    private onBtnMaxbet() {
        let lenBetAmount = GameCtrl.getIns().getModel().optionalBetAmountLists.length
        let lenTotalAmount = GameCtrl.getIns().getModel().optionalTotalAmountLists.length
        let lenMultiple = GameCtrl.getIns().getModel().optionalMultipleLists.length
        this.m_ui.list_daxiao.getComponent(CompBetScroll).scrollToIndex(lenBetAmount);
        this.m_ui.list_beishu.getComponent(CompBetScroll).scrollToIndex(lenMultiple);
        this.m_ui.list_bettotal.getComponent(CompBetScroll).scrollToIndex(lenTotalAmount);
        let info = GameCtrl.getIns().getModel().getBetInfoByTotal(GameCtrl.getIns().getModel().optionalTotalAmountLists[lenTotalAmount - 1] * GameConst.BeseGold)
        this.curSelectBetId = info.id
        warn("onBtnMaxbet", this.curSelectBetId, info);
        // GameCtrl.getIns().getModel().isMaxBet(info.total_bet);
        this.enabledButton(this.m_ui.btn_maxbet, false);
        GameAudio.clickClose();
        // this.refreshBettotal(true)
    }



    onOpt(isOpt: boolean) {
        warn("wwww", isOpt)
        let info = GameCtrl.getIns().getModel().getBetIdInfo(this.curSelectBetId);
        this.enabledButton(this.m_ui.btn_maxbet, !GameCtrl.getIns().getModel().isMaxBet(info.total_bet) && !isOpt)

        this.enabledButton(this.m_ui.btn_sure, !isOpt)
        this.enabledButton(this.m_ui.btn_close, !isOpt)
    }

    enabledButton(node: Node, enabled: boolean) {
        node.getComponent(Button).interactable = enabled;
        CocosUtil.setNodeOpacity(node, enabled ? 255 : 110)
    }

    private onBtnSure() {
        warn("wwwwonBtnSure")
        let nd = this.m_ui.list_bettotal.getComponent(CompBetScroll).getMidNode();
        let v = nd["_logic_value"];
        log("选择id", this.curSelectBetId)
        GameCtrl.getIns().switchBetId(this.curSelectBetId)
        UIManager.closeView(EViewNames.UIBetSetting);
        GameAudio.clickClose();
    }

    initLists() {
        let optionalBetAmountLists = GameCtrl.getIns().getModel().optionalBetAmountLists
        let optionalTotalAmountLists = GameCtrl.getIns().getModel().optionalTotalAmountLists
        let optionalMultipleLists = GameCtrl.getIns().getModel().optionalMultipleLists
        let contNode = this.m_ui.cont_daxiao;
        for (let v of optionalBetAmountLists) {
            let item = instantiate(contNode.children[0]);
            item.children[0].getComponent(Label).string = MoneyUtil.currencySymbol() + MoneyUtil.formatGold(v);
            contNode.addChild(item);
            item["_logic_value"] = v;
        }
        contNode.addChild(instantiate(contNode.children[0]));
        this.m_ui.list_daxiao.getComponent(CompBetScroll).setTouchCb(new CHandler(this, function (curMidIndex, curMidNode) {
            this.refreshBettotal();
        }));
        this.m_ui.list_daxiao.getComponent(CompBetScroll).wheelMove = () => {
            warn("wheelMove")
            this.onOpt(true)
        }
        this.m_ui.list_daxiao.getComponent(CompBetScroll).wheelEnd = () => {
            warn("wheelEnd")
            this.onOpt(false)
        }

        contNode = this.m_ui.cont_beishu;
        for (let v of optionalMultipleLists) {
            let item = instantiate(contNode.children[0]);
            item.children[0].getComponent(Label).string = "" + v;
            contNode.addChild(item);
            item["_logic_value"] = v;
        }
        contNode.addChild(instantiate(contNode.children[0]));
        this.m_ui.list_beishu.getComponent(CompBetScroll).setTouchCb(new CHandler(this, function (curMidIndex, curMidNode) {
            this.refreshBettotal();
        }));
        this.m_ui.list_beishu.getComponent(CompBetScroll).wheelMove = () => {
            warn("wheelMove")
            this.onOpt(true)
        }
        this.m_ui.list_beishu.getComponent(CompBetScroll).wheelEnd = () => {
            warn("wheelEnd")
            this.onOpt(false)
        }

        contNode = this.m_ui.cont_bettotal;
        for (let index = 0; index < optionalTotalAmountLists.length; index++) {
            const v = optionalTotalAmountLists[index];
            let item = instantiate(contNode.children[0]);
            item.children[0].getComponent(Label).string = MoneyUtil.currencySymbol() + MoneyUtil.formatGold(v);
            contNode.addChild(item);
            item["_logic_value"] = v;
        }
        contNode.addChild(instantiate(contNode.children[0]));
        this.m_ui.list_bettotal.getComponent(CompBetScroll).setTouchCb(new CHandler(this, this.onEndBetTotal));
        this.m_ui.list_bettotal.getComponent(CompBetScroll).wheelMove = () => {
            warn("wheelMove")
            this.onOpt(true)
        }
        this.m_ui.list_bettotal.getComponent(CompBetScroll).wheelEnd = () => {
            warn("wheelEnd")
            this.onOpt(false)
        }
    }

    private onEndBetTotal(curMidIndex, curMidNode) {
        let value = curMidNode["_logic_value"] * GameConst.BeseGold
        let info = GameCtrl.getIns().getModel().getBetInfoByTotal(value)
        let amountIdx = GameCtrl.getIns().getModel().getBetAmountIdx(info.bet_size / GameConst.BeseGold)
        let rateIdx = GameCtrl.getIns().getModel().getBetMultipleIdx(info.bet_multiple)
        this.m_ui.list_daxiao.getComponent(CompBetScroll).scrollToIndex(amountIdx + 1, true);
        this.m_ui.list_beishu.getComponent(CompBetScroll).scrollToIndex(rateIdx + 1, true);
        this.curSelectBetId = info.id;
        this.enabledButton(this.m_ui.btn_maxbet, !GameCtrl.getIns().getModel().isMaxBet(info.total_bet));
        warn("touchCb")
    }

    animAct() {
        let size = this.m_ui.bg.getComponent(UITransform).contentSize
        this.m_ui.bg.position = v3(0, -size.height, 0)
        this.m_ui.content.active = false;
        tween(this.m_ui.bg)
            .by(0.2, { position: v3(0, size.height, 0) })
            .call(() => {
                this.m_ui.content.active = true;
            })
            .start()
    }

    private refreshBettotal(bAni: boolean = true) {
        let idx1 = this.m_ui.list_daxiao.getComponent(CompBetScroll).getMidIndex();
        let idx2 = this.m_ui.list_beishu.getComponent(CompBetScroll).getMidIndex();
        let betAmount = GameCtrl.getIns().getModel().optionalBetAmountLists[idx1 - 1]
        let betRate = GameCtrl.getIns().getModel().optionalMultipleLists[idx2 - 1]
        let betInfo = GameCtrl.getIns().getModel().getBetInfoByAmount(betAmount * GameConst.BeseGold, betRate)
        // if (!betInfo) {
        //     return
        // }
        warn("refreshBettotal", betInfo)
        let totalIdx = GameCtrl.getIns().getModel().getBetTotalIdx(betInfo.total_bet / GameConst.BeseGold)
        this.m_ui.list_bettotal.getComponent(CompBetScroll).scrollToIndex(totalIdx + 1, bAni);
        this.curSelectBetId = betInfo.id
        this.enabledButton(this.m_ui.btn_maxbet, !GameCtrl.getIns().getModel().isMaxBet(betInfo.total_bet));
    }

}


