import { _decorator, Color, Component, Label, Node, Sprite, Tween, tween, v3 } from 'cc';
import CocosUtil from '../../kernel/compat/CocosUtil';
import { BaseView } from '../../kernel/compat/view/BaseView';
import GameEvent from '../../event/GameEvent';
import EventCenter from '../../kernel/core/event/EventCenter';
import MoneyUtil from '../../kernel/core/utils/MoneyUtil';
import GameCtrl from '../../ctrls/GameCtrl';
import { CompNumberEx } from '../../kernel/compat/view/comps/CompNumberEx';
import GameConst from '../../define/GameConst';
import BigNumber from 'bignumber.js';
const { ccclass, property } = _decorator;


var BLUE = new Color("#84EDFC")

window["betAmount"] = [{
    time: 0.13,
    scale: [1.8, 1.8]
},
{
    time: 0.1,
    scale: [1, 1]
},{
    time: 0.1,
    scale: [1.13, 1.13]
},{
    time: 0.1,
    scale: [1.0, 1.0]
}]

@ccclass('GameUI')
export class GameUI extends BaseView {
    @property(Label)
    txtBalanceAmount: Label;
    @property(Label)
    txtBetAmount: Label;
    @property(Label)
    txtWinAmount: Label;

    winAmount: number = 0;
    balanceAmount: number = 0;

    protected onLoad(): void {
        this.txtWinAmount.addComponent(CompNumberEx)
        this.txtBalanceAmount.addComponent(CompNumberEx)
    }
    setBalanceAmount(amount: number) {
        this.balanceAmount = amount;
        this.txtBalanceAmount.string = MoneyUtil.currencySymbol() + MoneyUtil.rmbStr(amount);
    }

    setBetAmount(amount: number, isAnim: boolean = false) {
        this.txtBetAmount.string = MoneyUtil.currencySymbol() + MoneyUtil.rmbStr(amount);
        if (isAnim) {
            // tween(this.txtBetAmount.node)
            //     .to(0.1, { scale: v3(1.5, 1.5, 1) })
            //     .to(0.1, { scale: v3(0.9, 0.9, 1) })
            //     .to(0.1, { scale: v3(1.1, 1.1, 1) })
            //     .to(0.1, { scale: v3(1.0, 1.0, 1) })
            //     .start()
            tween(this.txtBetAmount.node)
                .to(window["betAmount"][0].time, {scale: v3(window["betAmount"][0].scale[0], window["betAmount"][0].scale[1])})
                .to(window["betAmount"][1].time, {scale: v3(window["betAmount"][1].scale[0], window["betAmount"][1].scale[1])})
                .to(window["betAmount"][2].time, {scale: v3(window["betAmount"][2].scale[0], window["betAmount"][2].scale[1])})
                .to(window["betAmount"][3].time, {scale: v3(window["betAmount"][3].scale[0], window["betAmount"][3].scale[1])})
                .start()
        }
    }

    setWinAmount(amount: number) {
        this.winAmount = amount;
        this.txtWinAmount.string = MoneyUtil.currencySymbol() + MoneyUtil.rmbStr(amount);
        GameCtrl.getIns().getModel().lastWinAmount = amount;
    }

    playAddWinAnimation(amount: number) {
        CocosUtil.runScore(this.txtWinAmount.getComponent(Label), 0.5, new BigNumber(amount).div(GameConst.BeseGold).toNumber(), new BigNumber(this.winAmount).div(GameConst.BeseGold).toNumber(), true, true);
        this.winAmount = amount;
        GameCtrl.getIns().getModel().lastWinAmount = amount;
    }

    playAddBlanceAnimation(amount: number) {
        CocosUtil.runScore(this.txtBalanceAmount.getComponent(Label), 0.5, new BigNumber(amount).div(GameConst.BeseGold).toNumber(), new BigNumber(this.balanceAmount).div(GameConst.BeseGold).toNumber(), true, true);
        this.balanceAmount = amount;
    }

    setLabelColor(isGreen: boolean) {
        this.txtBalanceAmount.color = isGreen ? BLUE : Color.WHITE
        this.txtBetAmount.color = isGreen ? BLUE : Color.WHITE
        this.txtWinAmount.color = isGreen ? BLUE : Color.WHITE
    }






}


