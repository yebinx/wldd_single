import { _decorator, Component, Label, Node, sp, Sprite, SpriteFrame, Tween, tween, UIOpacity, UITransform, v3, warn } from 'cc';
import MoneyUtil from '../../kernel/core/utils/MoneyUtil';
import GameAudio from '../../mgrs/GameAudio';
import { CompNumberEx } from '../../kernel/compat/view/comps/CompNumberEx';
import CHandler from '../../kernel/core/datastruct/CHandler';
import CocosUtil from '../../kernel/compat/CocosUtil';
import GameCtrl from '../../ctrls/GameCtrl';
import BigNumber from 'bignumber.js';
import GameConst from '../../define/GameConst';
import EventCenter from '../../kernel/core/event/EventCenter';
import GameEvent from '../../event/GameEvent';
import { AudioManager } from '../../kernel/compat/audio/AudioManager';
const { ccclass, property } = _decorator;

window["marquee"] = {
    nextDelayTime: 0.3,
    stillDuration: 2,
    moveSpeed: 90
}

@ccclass('WinAwardNumAnimation')
export class WinAwardNumAnimation extends Component {

    @property(SpriteFrame)
    labelSprites: SpriteFrame[] = [];

    @property(sp.Skeleton)
    topSpS: sp.Skeleton[] = [];

    @property(Node)
    tips: Node = null;

    @property(Node)
    moveLabel: Node = null;

    @property(Sprite)
    moveContent: Sprite = null;

    @property(Label)
    winNum: Label = null;

    private _marqueeIdx: number = -1;
    private _maxWidth: number = 580;
    private _speed: number = 100;
    private _curLevel: number = 0;
    private _rollRate: number = 3;
    private _maxRollRate: number = 5;
    private _rollTime: number = 2;
    private _targetNum: number = 0;
    private _promise: Function = null;

    protected start(): void {
        CocosUtil.addClickEvent(this.node.getChildByName("quick_run_top_score"), this.onClickSpace, this);
    }

    showMarquee(jump?: boolean) {
        if (!jump && this.moveLabel.active) {
            return;
        }
        this.tips.active = false;
        this.moveLabel.active = true;
        Tween.stopAllByTarget(this.moveContent.node);
        this.moveContent.node.setPosition(0, 0, 0);
        let idx = this.getMarqueeIdx();
        this.moveContent.spriteFrame = this.labelSprites[idx];
        let width = this.moveContent.node.getComponent(UITransform).width;
        // let t = width / this._speed;
        let t = width / window["marquee"].moveSpeed;
        let tw = tween(this.moveContent.node).delay(window["marquee"].stillDuration);
        if (width > this._maxWidth) {
            let x = -(this._maxWidth - width) / 2;
            this.moveContent.node.setPosition(x, 0, 0);
            tw.by(t, { position: v3(-width - 60, 0, 0) })
        }
        tw.delay(window["marquee"].nextDelayTime).call(() => {
            this.showMarquee(true);
        }).start();
    }

    getMarqueeIdx() {
        let idx = this._marqueeIdx + 1;
        if (GameCtrl.getIns().getModel().isFree() || GameCtrl.getIns().getModel().isIntoFree()) {
            idx = 0;
        } else {
            if (idx == 0 || idx >= this.labelSprites.length - 1) {
                idx = 1;
            }
        }
        this._marqueeIdx = idx;
        return idx;
    }

    initializationState(level: 0 | 1 | 2) {
        this.topSpS.forEach((sp, idx) => {
            if (idx == level) {
                sp.node.active = true;
                sp.timeScale = 1000;
                sp.setCompleteListener(() => {
                    sp.setCompleteListener(null);
                    sp.timeScale = 1;
                });
            } else {
                sp.node.active = false;
            }
        });
        this._curLevel = level;
    }

    changeLevel(level: 0 | 1 | 2, isEnd: boolean, isContinue: boolean) {
        if (isContinue) {
            this.topSpS.forEach((spS, idx) => {
                if (level == idx) {
                    spS.node.active = true;
                    spS.timeScale = 1000;
                    spS.setCompleteListener(() => {
                        spS.setCompleteListener(null);
                        spS.timeScale = 1;
                    });
                } else {
                    spS.node.active = false;
                }
            });
            this._curLevel = level;
            return;
        }
        if (!isEnd && level < this._curLevel) {
            return;
        }
        if (level < this._curLevel) {
            this.topSpS.forEach((spS, idx) => {
                if (idx == this._curLevel) {
                    tween(spS.node.getComponent(UIOpacity)).to(0.3, { opacity: 0 }).call(() => {
                        spS.node.active = false;
                        spS.node.getComponent(UIOpacity).opacity = 255;
                    }).start();
                } else if (level == idx) {
                    spS.node.active = true;
                    spS.timeScale = 100000;
                    spS.setCompleteListener(() => {
                        spS.setCompleteListener(null);
                        spS.timeScale = 1;
                    });
                } else {
                    spS.node.active = false;
                }
            });
        } else if (level > this._curLevel) {
            this.topSpS.forEach(((sp, idx) => {
                sp.node.active = idx == level;
            }));
        }
        this._curLevel = level;
    }

    showWin(winNum: number, isEnd: boolean, forceRun?: boolean, isContinue?: boolean) {
        warn("showWin", winNum);
        return new Promise<void>(async (resolve, reject) => {
            Tween.stopAllByTarget(this.moveContent.node);
            this.tips.active = true;
            this.moveLabel.active = false;
            this._targetNum = new BigNumber(winNum).div(GameConst.BeseGold).toNumber();
            this.winNum.string = MoneyUtil.formatGold(this._targetNum)
            this.tips.getChildByName("totalWin").active = isEnd;
            this.tips.getChildByName("win").active = !isEnd;
            !isContinue && tween(this.tips).to(0.02, { scale: v3(1.3, 1.3, 1.3) }).to(0.4, { scale: v3(1, 1, 1) }).start();

            let amount = GameCtrl.getIns().getModel().getCurBetAmount();
            let rate = winNum / amount;
            let isRun = rate >= this._rollRate && rate < this._maxRollRate;
            if (forceRun !== undefined) {
                isRun = forceRun;
            }

            if (isEnd) {
                if (rate < this._rollRate) {
                    this.changeLevel(0, isEnd, isContinue);
                } else if (rate < this._maxRollRate) {
                    this.changeLevel(1, isEnd, isContinue);
                } else {
                    this.changeLevel(2, isEnd, isContinue);
                }
            } else {
                if (rate < this._rollRate) {
                    this.changeLevel(0, isEnd, isContinue);
                } else {
                    this.changeLevel(1, isEnd, isContinue);
                }
            }
            if (!isContinue) {
                this.topSpS[this._curLevel].node.active = true;
                this.topSpS[this._curLevel].timeScale = 1;
                this.topSpS[this._curLevel].setToSetupPose();
                this.topSpS[this._curLevel].setAnimation(0, "yfk" + (this._curLevel + 1) + "_in", false);

                if (isEnd) {
                    if (isRun) {
                        this._promise = resolve;
                        GameAudio.roundTotalWin();
                        this.scheduleOnce(() => {
                            this.openQuickRun();
                        }, 0.1)
                        await CocosUtil.runScore(this.winNum, this._rollTime, this._targetNum, 0);
                        AudioManager.inst.stopMusic();
                        GameAudio.roundTotalWinEnd();
                        this.node.getChildByName("quick_run_top_score").active = false;
                        EventCenter.getInstance().remove(GameEvent.key_down_space, this.onClickSpace, this);
                        EventCenter.getInstance().remove(GameEvent.key_pressing_space, this.onClickSpace, this);
                    } else {
                        GameAudio.normalWinEnd();
                    }
                }
            }
            resolve();
        })
    }

    openQuickRun() {
        this.node.getChildByName("quick_run_top_score").active = true;
        EventCenter.getInstance().listen(GameEvent.key_down_space, this.onClickSpace, this);
        EventCenter.getInstance().listen(GameEvent.key_pressing_space, this.onClickSpace, this);
    }

    onClickSpace() {
        this.node.getChildByName("quick_run_top_score").active = false;
        EventCenter.getInstance().remove(GameEvent.key_down_space, this.onClickSpace, this);
        EventCenter.getInstance().remove(GameEvent.key_pressing_space, this.onClickSpace, this);

        Tween.stopAllByTarget(this.winNum.node);
        this.winNum.string = MoneyUtil.formatGold(this._targetNum)
        GameAudio.roundTotalWinEnd();
        this._promise();
    }

    hideWin() {
        this.showMarquee(GameCtrl.getIns().getModel().isFree() || GameCtrl.getIns().getModel().isIntoFree());
        this.changeLevel(0, true, false);
    }
}


