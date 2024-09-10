import { _decorator, Button, Component, error, EventTouch, log, Node, ParticleSystem2D, sp, tween, UIOpacity, v3, warn } from 'cc';
import { CompNumberEx } from '../../kernel/compat/view/comps/CompNumberEx';
import { BaseView } from '../../kernel/compat/view/BaseView';
import CHandler from '../../kernel/core/datastruct/CHandler';
import GameEvent from '../../event/GameEvent';
import EventCenter from '../../kernel/core/event/EventCenter';
import GameModel from '../../models/GameModel';
import CocosUtil from '../../kernel/compat/CocosUtil';
import MoneyUtil from '../../kernel/core/utils/MoneyUtil';
import GameAudio from '../../mgrs/GameAudio';
import GameCtrl from '../../ctrls/GameCtrl';
const { ccclass, property } = _decorator;

@ccclass('ResultBigAward')
export class ResultBigAward extends BaseView {

    @property(sp.Skeleton)
    spHuzi: sp.Skeleton;
    @property(sp.Skeleton)
    spLight: sp.Skeleton;
    @property(ParticleSystem2D)
    particle: ParticleSystem2D;
    @property(CompNumberEx)
    labNum: CompNumberEx;

    runList: { start: number, end: number }[] = [];
    runIdx: number = 0;
    private autoCloseTime: number = 5;
    private isStartTime: boolean = false;
    private isCloseUi: boolean = false;

    showLevel: number = -1;

    targetNum: number = 0

    targetLevel: number = 0;

    isOnlyBigWin: boolean = false;

    animConfig = [8, 10, 12];

    nextAnimTime = 7;

    delay: number = 5;

    onLoad(): void {
        CocosUtil.traverseNodes(this.node, this.m_ui);
        this.spHuzi.setCompleteListener((t) => {
            let aniName = t.animation.name;
            switch (aniName) {
                case "win_big_in1":
                    this.spHuzi.setAnimation(0, "win_big_in2", false)
                    break;
                case "win_big_in2":
                    // this.spHuzi.setAnimation(0, "win_big_in3", false)
                    break;
                case "win_big_in3":
                    break;
                case "win_huge_in1":
                    this.spHuzi.setAnimation(0, "win_huge_in2", false)
                    break;
                case "win_huge_in2":
                    // this.spHuzi.setAnimation(0, "win_huge_in33", false)
                    break;
                case "win_huge_in33":
                    break;
                case "win_super_in1":
                    this.spHuzi.setAnimation(0, "win_super_in2", false)
                    break;
                case "win_super_in2":
                    // this.spHuzi.setAnimation(0, "win_super_in33", false)
                    break;
                case "win_super_in33":
                    break;
            }
        })

        this.m_ui.win_num_box.setScale(0, 0, 0);
        tween(this.m_ui.win_num_box).to(0.2, { scale: v3(1.2, 1.2, 1) }).to(0.1, { scale: v3(1, 1, 1) }).start();
    }

    private initNetEvent() {
        EventCenter.getInstance().listen(GameEvent.key_down_space, this.onClickMesk, this);
        EventCenter.getInstance().listen(GameEvent.key_pressing_space, this.onClickMesk, this);
    }

    initData(data: { amounts: number[] }) {
        this.targetNum = data.amounts[data.amounts.length - 1]
        this.labNum.setEndCallback(new CHandler(this, this.onValueChangeEnd))
        this.labNum.setValueFormater(v => {
            return MoneyUtil.rmbStr(v);
        })
        this.targetLevel = data.amounts.length;
        let startAmount = 0;
        let totalAward = 0;
        warn("amounts", data.amounts);
        for (let index = 0; index < data.amounts.length; index++) {
            totalAward = data.amounts[index]
            this.runList[index] = { start: startAmount, end: totalAward }
            startAmount = totalAward
        }
        if (this.runList.length == 1) {
            this.isOnlyBigWin = true;
        }
        GameAudio.bigWin()
        this.runChange(1)

        this.scheduleOnce(() => {
            this.initNetEvent()
            CocosUtil.addClickEvent(this.node.getChildByName("mask"), this.onClickMesk, this, null, 1);
            CocosUtil.addClickEvent(this.node.getChildByName("quick_close"), this.onClickClose, this, null, 1);
        }, 0.1);
    }

    private onClickMesk() {
        EventCenter.getInstance().remove(GameEvent.key_down_space, this.onClickMesk, this);
        EventCenter.getInstance().remove(GameEvent.key_pressing_space, this.onClickMesk, this);
        CocosUtil.delClickEvent(this.node.getChildByName("mask"), this.onClickMesk, this);

        this.openQuickClose();

        this.node.getChildByName("mask").getComponent(Button).interactable = false;
        this.scheduleOnce(() => {
            if (!this.isStartTime) {
                GameAudio.bigWinEnd()
                this.toFinal();
            }
        }, 0.1)
    }

    private openQuickClose() {
        EventCenter.getInstance().listen(GameEvent.key_down_space, this.onClickClose, this);
        EventCenter.getInstance().listen(GameEvent.key_pressing_space, this.onClickClose, this);
        this.node.getChildByName("quick_close").active = true;
    }

    private onClickClose() {
        EventCenter.getInstance().remove(GameEvent.key_down_space, this.onClickClose, this);
        EventCenter.getInstance().remove(GameEvent.key_pressing_space, this.onClickClose, this);
        this.node.getChildByName("quick_close").active = false;
        if (this.autoCloseTime > 2) {
            this.autoCloseTime = 2;
        }
    }

    private toFinal() {
        this.onLevelChg(this.targetLevel);
        this.isStartTime = true
        this.labNum.initValue(this.targetNum);
        this.spLight.node.active = true;
        this.spLight.setToSetupPose();
        this.spLight.setCompleteListener(() => {
            this.spLight.node.active = false;
            this.spLight.setCompleteListener(null);
        })
    }

    private showBigAward1() {
        this.spHuzi.setAnimation(0, "win_big_in1", false)
        // this.particle.node.active = true;
        // this.particle.resetSystem();
    }

    private showBigAward2() {
        this.spHuzi.setAnimation(0, "win_huge_in1", false)
        // this.particle.node.active = false;
    }

    private showBigAward3() {
        this.spHuzi.setAnimation(0, "win_super_in1", false)
        // this.particle.node.active = false;
    }

    private onValueChangeEnd(v: number) {
        if (this.runIdx == this.runList.length) {
            // this.isStartTime = true
            GameAudio.bigWinEnd()
            this.toFinal();
        } else {
            this.runIdx++;
            this.runChange(this.runIdx)
        }
    }

    runChange(idx) {
        this.runIdx = idx
        let amounts = this.runList[idx - 1]
        this.onLevelChg(idx)
        this.labNum.initValue(amounts.start)
        if (idx == this.runList.length) {
            this.labNum.chgValue(amounts.end, this.getLastInterval());
        } else {
            this.labNum.chgValue(amounts.end, this.nextAnimTime);
        }
        idx != 1 && tween(this.m_ui.win_num_box).to(0.2, { scale: v3(1.2, 1.2, 1) }).to(0.1, { scale: v3(1, 1, 1) }).start();
    }

    getLastInterval() {
        let curRate = this.runList[this.runList.length - 1].end / GameCtrl.getIns().getModel().getCurBetAmount();
        let needTime = 0;
        let config = GameCtrl.getIns().getModel().winConfig;
        if (this.runList.length == 1) {
            needTime = this.animConfig[0] - this.delay;
        } else if (this.runList.length == 2) {
            needTime = (curRate - config[1]) / (config[2] - config[1]) * (this.animConfig[1] - this.delay);
        } else if (this.runList.length == 3) {
            if (curRate > config[2] * 2) {
                needTime = this.animConfig[2] - this.delay;
            } else {
                needTime = (curRate - config[2]) / config[2] * (this.animConfig[2] - this.delay);
            }
        }
        log("needTime", needTime, this.runList.length);
        return needTime;
    }

    onLevelChg(level: number) {
        if (this.showLevel == level) {
            return;
        }
        this.showLevel = level
        switch (level) {
            case 1:
                this.showBigAward1()
                break;
            case 2:
                this.showBigAward2()
                break;
            case 3:
                this.showBigAward3()
                break;
        }
    }

    private closeUI() {
        tween(this.node.getComponent(UIOpacity)).to(1, { opacity: 0 }).call(() => {
            EventCenter.getInstance().fire(GameEvent.close_bigreward);
        }).start();
    }

    protected onDestroy(): void {
        EventCenter.getInstance().remove(GameEvent.key_down_space, this.onClickMesk, this);
        EventCenter.getInstance().remove(GameEvent.key_pressing_space, this.onClickMesk, this);
        EventCenter.getInstance().remove(GameEvent.key_down_space, this.onClickClose, this);
        EventCenter.getInstance().remove(GameEvent.key_pressing_space, this.onClickClose, this);

        GameAudio.stopBigAward()
    }

    protected update(dt: number): void {
        if (!this.isCloseUi) {
            if (this.isStartTime) {
                this.autoCloseTime -= dt;
                if (this.autoCloseTime <= 0) {
                    this.isCloseUi = true;
                    this.closeUI();
                }
            }
        }
    }

}


