import { _decorator, Button, Color, color, Component, Label, Node, Sprite, tween, UIOpacity, UITransform, v3 } from 'cc';
import { BaseView } from '../../kernel/compat/view/BaseView';
import CocosUtil from '../../kernel/compat/CocosUtil';
import EventCenter from '../../kernel/core/event/EventCenter';
import GameEvent from '../../event/GameEvent';
import { EViewNames } from '../../configs/UIConfig';
import { UIManager } from '../../kernel/compat/view/UImanager';
import MoneyUtil from '../../kernel/core/utils/MoneyUtil';
import { InitUIAutoInfo } from '../../models/GameModel';
import GameCtrl from '../../ctrls/GameCtrl';
import GameAudio from '../../mgrs/GameAudio';
import { PopupView } from '../../kernel/compat/view/PopupView';
const { ccclass, property } = _decorator;

@ccclass('UIAuto')
export class UIAuto extends PopupView {

    @property(Label)
    txtMoney: Label;
    @property(Label)
    txtBet: Label;
    @property(Label)
    txtAward: Label;

    private sel_color = color(110, 231, 141, 255);
    private unsel_color = color(111, 111, 120, 255);
    private hover_color = color(110, 231, 141, 64);

    private _selectIdx: number = -1;

    start() {
        CocosUtil.addClickEvent(this.m_ui.btn_close, function () {
            UIManager.closeView(EViewNames.UIAuto);
            GameAudio.clickClose();
        }, this);
        CocosUtil.addClickEvent(this.node, function () {
            UIManager.closeView(EViewNames.UIAuto);
            GameAudio.clickClose();
        }, this);
        CocosUtil.addClickEvent(this.m_ui.btn_start_auto, function () {
            if (this._selectIdx < 0) {
                return;
            }
            UIManager.closeView(EViewNames.UIAuto);
            GameAudio.clickClose();
            GameCtrl.getIns().openAutoRoll(this._selectIdx)
        }, this, null, 1.01);
        this.m_ui.btn_start_auto.getComponent(Button).interactable = false;
        // this.animAct()
    }

    initData(data: InitUIAutoInfo) {
        CocosUtil.traverseNodes(this.node, this.m_ui);
        this.txtMoney.string = MoneyUtil.currencySymbol() + MoneyUtil.rmbStr(data.balance);
        this.txtBet.string = MoneyUtil.currencySymbol() + MoneyUtil.rmbStr(data.curBetAmount);
        this.txtAward.string = MoneyUtil.currencySymbol() + MoneyUtil.rmbStr(data.lastWinAmount);
        this.selectTab(-1);
        this.initSelectNumTab(data.selectNums);

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

    initSelectNumTab(nums: number[]) {
        for (let index = 0; index < nums.length; index++) {
            const element = nums[index];
            let lab = this.m_ui.tabs.children[index].getChildByName("Label").getComponent(Label);
            lab.string = element + "";
            CocosUtil.addClickEvent(this.m_ui.tabs.children[index], ()=>{
                this.selectTab(index)
                GameAudio.clickClose();
            }, this, index);
            this.initMouseEvent(this.m_ui.tabs.children[index], index)
        }
    }

    initMouseEvent(btn: Node, idx: number) {
        btn.on(Node.EventType.MOUSE_ENTER, ()  => {
            let lab = this.m_ui.tabs.children[idx].getChildByName("Label").getComponent(Label);
            if (this._selectIdx == idx) {
                lab.color = this.sel_color;
                return;
            }
            lab.color = this.hover_color;
        }, this);
        btn.on(Node.EventType.MOUSE_LEAVE, () => {
            let lab = this.m_ui.tabs.children[idx].getChildByName("Label").getComponent(Label);
            if (this._selectIdx == idx) {
                lab.color = this.sel_color;
                return;
            }
            lab.color = this.unsel_color;
        }, this);
    }

    selectTab(idx: number) {
        this._selectIdx = idx;
        for (let i = 0; i < 5; i++) {
            let lab = this.m_ui.tabs.children[i].getChildByName("Label").getComponent(Label);
            lab.color = i == idx && this.sel_color || this.unsel_color;
        }
        if (idx >= 0) {
            this.m_ui.btn_start_auto.getComponent(Button).interactable = true
        }
        let op1 = idx >= 0 ? 255 : 64
        // let op2 = idx >= 0 ? 255 : 120
        let c = this.m_ui.btn_start_auto.getComponent(Sprite).color;
        this.m_ui.btn_start_auto.getComponent(Sprite).color = new Color(c.r, c.g, c.b, op1)
        // this.m_ui.btn_start_auto.getComponent(UIOpacity).opacity = 64;
        
        // CocosUtil.setNodeOpacity(this.m_ui.btn_start_auto, idx>=0 && 255 || 80);
    }

}


