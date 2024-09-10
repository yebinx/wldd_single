import { _decorator, Component, error, Label, log, Node, sp, Tween, tween, UIOpacity, warn } from 'cc';
import GameConst from '../../define/GameConst';
const { ccclass, property } = _decorator;

@ccclass('GameWheel')
export class GameWheel extends Component {

    @property(Node)
    multiples: Node[] = [];

    @property(sp.Skeleton)
    light: sp.Skeleton;

    @property(sp.Skeleton)
    particle: sp.Skeleton;

    @property(Node)
    wheel: Node;

    @property(Node)
    blur: Node = null;

    @property(Node)
    normal: Node = null;

    private _initMul: number = 1;
    private _curMul: number = this._initMul;
    private _curIdx: number = 0;
    private _maxMul: string = "∞";
    private _initAngle: number = 60;
    private _initMultiples: string[] = ["1", "2", "3", "4", "5", "∞"];

    start() {
        
    }

    recover(skip?: boolean) {
        warn("recover", skip, this._curIdx)
        this.setOpacity(false);
        if (this._curMul != 1) {
            this._curIdx = 0;
            this._curMul = this._initMul;
            this._maxMul = "∞";
            this.multiples.forEach((node) => {
                node.active = false;
            });
            this.blur.active = true;
            this.normal.active = false;
            if (skip) {
                this.blur.active = false;
                this.normal.active = true;
                this.wheel.angle = this._initAngle;
                this.multiples.forEach((node, idx) => {
                    node.angle = -this.wheel.angle + this._initAngle;
                    node.active = true;
                    this.setMultiple(node, this._initMultiples[idx]);
                });
                this.setOpacity(true);
            } else {
                Tween.stopAllByTarget(this.wheel);
                tween(this.wheel).by(0.2, { angle: 360 * 5 + this._initAngle })
                    .call(() => {
                        this.blur.active = false;
                        this.normal.active = true;
                        this.wheel.angle = this._initAngle;
                        this.multiples.forEach((node, idx) => {
                            node.angle = -this.wheel.angle + this._initAngle;
                            node.active = true;
                            this.setMultiple(node, this._initMultiples[idx]);
                        });
                        this.setOpacity(true);
                    })
                    .start();
            }
        } else {
            this.setOpacity(true);
        }
    }

    setMultiple(node: Node, num: string) {
        if (num == "∞") {
            node.getComponent(Label).string = num;
        } else {
            node.getComponent(Label).string = "x" + num;
        }
    }

    jumpSpecifyLocation(mul: number) {
        warn("jumpSpecifyLocation", this._curMul, mul);
        this.recover(true);
        if (this._curMul < mul) {
            this.setOpacity(false);
            while (this._curMul != mul) {
                this.wheel.angle += 60;
                this.multiples.forEach((node, idx) => {
                    node.angle = -this.wheel.angle + this._initAngle;
                });
                this.setCurIdx();
                this._curMul++;
                let last = this.findLastIdx();
                log("findLast", last);
                if (this._maxMul == "∞") {
                    this._maxMul = "6"
                } else {
                    this._maxMul = (Number(this._maxMul) + 1).toString();
                }
                log("maxMul", this._maxMul)
                this.setMultiple(this.multiples[last], this._maxMul);
            }
            this.setOpacity(true);
        }
    }

    setCurIdx() {
        this._curIdx++;
        if (this._curIdx > this.multiples.length - 1) {
            this._curIdx = 0;
        }
    }

    setOpacity(isShow: boolean) {
        if (isShow) {
            this.multiples[this._curIdx].getComponent(UIOpacity).opacity = 255;
        } else {
            this.multiples.forEach((node) => {
                node.getComponent(UIOpacity).opacity = 122;
            });
        }
    }

    findLastIdx() {
        let last = this._curIdx + this.multiples.length - 2;
        if (last >= this.multiples.length) {
            last = last % this.multiples.length;
        }
        return last;
    }

    rotate(specify: number) {
        return new Promise<void>((resolve, reject) => {
            if (specify == this._curMul) {
                resolve();
                return;
            }
            warn("rotate", specify)
            this.setOpacity(false);
            Tween.stopAllByTarget(this.wheel);
            tween(this.wheel).by(GameConst.fallDownTime, { angle: 60 }, {
                onUpdate: (target, ratio) => {
                    this.multiples.forEach((node, idx) => {
                        node.angle = -this.wheel.angle + this._initAngle;
                    });
                },
            })
                .call(() => {
                    this.setCurIdx();
                    this._curMul++;
                    let last = this.findLastIdx();
                    if (this._maxMul == "∞") {
                        this._maxMul = "6"
                    } else {
                        this._maxMul = (Number(this._maxMul) + 1).toString();
                    }
                    this.setMultiple(this.multiples[last], this._maxMul)
                    this.light.node.active = true;
                    this.particle.node.active = true;
                    this.light.setToSetupPose();
                    this.particle.setToSetupPose();
                    this.light.setAnimation(0, "animation", false);
                    this.particle.setAnimation(0, "animation", false);
                    this.light.setCompleteListener(() => {
                        this.light.node.active = false;
                    });
                    this.particle.setCompleteListener(() => {
                        this.particle.node.active = false;
                    });
                    this.setOpacity(true);
                    resolve();
                })
                .start();
        })
    }

    update(deltaTime: number) {

    }
}


